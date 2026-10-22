import "server-only";
import { getSupabase } from "./supabase";

export type Collection = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export type CollectionRole = "owner" | "member" | "viewer";

const DEFAULT_COLLECTION_NAME = "My collection";
const COLLECTION_COLUMNS = "id, owner_id, name, created_at";

async function getCollection(id: string): Promise<Collection> {
  const { data, error } = await getSupabase()
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getMembership(
  userId: string,
  collectionId: string,
): Promise<CollectionRole | null> {
  const { data, error } = await getSupabase()
    .from("collection_members")
    .select("role")
    .eq("collection_id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as CollectionRole | undefined) ?? null;
}

export async function requireRole(
  userId: string,
  collectionId: string,
  roles: CollectionRole[],
): Promise<void> {
  const role = await getMembership(userId, collectionId);
  if (!role || !roles.includes(role)) {
    throw new Error("Forbidden");
  }
}

export async function canWriteVault(
  userId: string,
  collectionId: string,
): Promise<boolean> {
  const role = await getMembership(userId, collectionId);
  return role === "owner" || role === "member";
}

async function setActiveCollection(
  userId: string,
  collectionId: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from("user_settings")
    .upsert(
      { user_id: userId, active_collection_id: collectionId },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

async function createPersonalCollection(userId: string): Promise<Collection> {
  const supabase = getSupabase();
  const { data: created, error: insertError } = await supabase
    .from("collections")
    .insert({ owner_id: userId, name: DEFAULT_COLLECTION_NAME })
    .select(COLLECTION_COLUMNS)
    .single();

  let collection = created;
  if (insertError) {
    // Concurrent first-load can race the insert; the collections.owner_id
    // unique constraint means only one row wins — re-select it.
    const { data, error } = await supabase
      .from("collections")
      .select(COLLECTION_COLUMNS)
      .eq("owner_id", userId)
      .single();
    if (error) throw insertError;
    collection = data;
  }
  if (!collection) throw insertError ?? new Error("Collection insert failed");

  const { error: membershipError } = await supabase
    .from("collection_members")
    .upsert(
      { collection_id: collection.id, user_id: userId, role: "owner" },
      { onConflict: "collection_id,user_id", ignoreDuplicates: true },
    );
  if (membershipError) throw membershipError;
  return collection;
}

// The vault a user is acting on: their stored active choice when the
// membership is still valid, else any vault they belong to (preferring one
// they own), else a freshly created personal vault. Resolution writes the
// result back to user_settings so later reads are one lookup.
export async function resolveVault(userId: string): Promise<Collection> {
  const supabase = getSupabase();

  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("active_collection_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (settingsError) throw settingsError;

  if (settings?.active_collection_id) {
    const role = await getMembership(userId, settings.active_collection_id);
    if (role) return getCollection(settings.active_collection_id);
  }

  const { data: memberships, error: membersError } = await supabase
    .from("collection_members")
    .select("collection_id, role, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (membersError) throw membersError;

  const list = memberships ?? [];
  const pick = list.find((m) => m.role === "owner") ?? list[0];

  const collection = pick
    ? await getCollection(pick.collection_id)
    : await createPersonalCollection(userId);

  await setActiveCollection(userId, collection.id);
  return collection;
}

export async function renameCollection(
  userId: string,
  name: string,
): Promise<void> {
  const collection = await resolveVault(userId);
  await requireRole(userId, collection.id, ["owner"]);

  const { error } = await getSupabase()
    .from("collections")
    .update({ name })
    .eq("id", collection.id);
  if (error) throw error;
}
