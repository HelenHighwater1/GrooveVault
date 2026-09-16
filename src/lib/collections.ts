import "server-only";
import { getSupabase } from "./supabase";

export type Collection = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

const DEFAULT_COLLECTION_NAME = "My collection";

export async function getOrCreateCollection(
  ownerId: string,
): Promise<Collection> {
  const { error: upsertError } = await getSupabase()
    .from("collections")
    .upsert(
      { owner_id: ownerId, name: DEFAULT_COLLECTION_NAME },
      { onConflict: "owner_id", ignoreDuplicates: true },
    );
  if (upsertError) throw upsertError;

  const { data, error } = await getSupabase()
    .from("collections")
    .select("id, owner_id, name, created_at")
    .eq("owner_id", ownerId)
    .single();
  if (error) throw error;

  return data;
}

export async function renameCollection(
  ownerId: string,
  name: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from("collections")
    .update({ name })
    .eq("owner_id", ownerId);
  if (error) throw error;
}
