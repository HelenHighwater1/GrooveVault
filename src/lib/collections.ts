import "server-only";
import { getSupabase } from "./supabase";

export type Collection = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export type CollectionRole = "owner" | "member" | "viewer";

export const DEFAULT_COLLECTION_NAME = "My collection";
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
  // Serialized per user inside the function — the loser of a create race
  // gets the winner's vault back instead of making a duplicate.
  const { data, error } = await getSupabase().rpc(
    "create_personal_collection",
    { p_user_id: userId, p_name: DEFAULT_COLLECTION_NAME },
  );
  if (error) throw error;
  return getCollection(data as string);
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
  collectionId: string,
  name: string,
): Promise<void> {
  await requireRole(userId, collectionId, ["owner"]);

  const { error } = await getSupabase()
    .from("collections")
    .update({ name })
    .eq("id", collectionId);
  if (error) throw error;
}

export type LeaveVaultResult =
  "not_a_member" | "sole_member" | "successor_required" | null;

// One locked DB op: promotes the successor when the sole owner leaves a
// shared vault, then removes the leaver's membership.
export async function leaveVault(
  userId: string,
  collectionId: string,
  successorId?: string,
): Promise<LeaveVaultResult> {
  const { error } = await getSupabase().rpc("leave_collection", {
    p_collection_id: collectionId,
    p_user_id: userId,
    p_successor_id: successorId ?? null,
  });
  if (!error) return null;
  for (const code of [
    "not_a_member",
    "sole_member",
    "successor_required",
  ] as const) {
    if (error.message.includes(code)) return code;
  }
  throw error;
}

export type Vault = Collection & { role: CollectionRole };

// Every vault the user belongs to, oldest membership first — feeds the
// vault switcher.
export async function listVaults(userId: string): Promise<Vault[]> {
  const { data, error } = await getSupabase()
    .from("collection_members")
    .select(
      "role, joined_at, collections!inner(id, owner_id, name, created_at)",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    role: CollectionRole;
    collections: Collection;
  }[];
  return rows.map((r) => ({ ...r.collections, role: r.role }));
}

// Point the user's active vault at another one they belong to. Returns null
// when they aren't a member of the target.
export async function switchVault(
  userId: string,
  collectionId: string,
): Promise<Collection | null> {
  const role = await getMembership(userId, collectionId);
  if (!role) return null;
  await setActiveCollection(userId, collectionId);
  return getCollection(collectionId);
}

export type MemberRow = {
  user_id: string;
  role: CollectionRole;
  joined_at: string;
};

export async function listMembers(collectionId: string): Promise<MemberRow[]> {
  const { data, error } = await getSupabase()
    .from("collection_members")
    .select("user_id, role, joined_at")
    .eq("collection_id", collectionId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MemberRow[];
}

export async function setMemberRole(
  collectionId: string,
  userId: string,
  role: CollectionRole,
): Promise<void> {
  const { error } = await getSupabase()
    .from("collection_members")
    .update({ role })
    .eq("collection_id", collectionId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteMembership(
  collectionId: string,
  userId: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from("collection_members")
    .delete()
    .eq("collection_id", collectionId)
    .eq("user_id", userId);
  if (error) throw error;
}

export type Invite = {
  id: string;
  collection_id: string;
  inviter_id: string;
  token: string;
  status: "active" | "revoked";
  expires_at: string;
  created_at: string;
};

const INVITE_COLUMNS =
  "id, collection_id, inviter_id, token, status, expires_at, created_at";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvite(
  userId: string,
  collectionId: string,
): Promise<Invite> {
  await requireRole(userId, collectionId, ["owner"]);

  const { data, error } = await getSupabase()
    .from("collection_invites")
    .insert({
      collection_id: collectionId,
      inviter_id: userId,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    })
    .select(INVITE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function listActiveInvites(
  collectionId: string,
): Promise<Invite[]> {
  const { data, error } = await getSupabase()
    .from("collection_invites")
    .select(INVITE_COLUMNS)
    .eq("collection_id", collectionId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

export async function revokeInvite(
  userId: string,
  inviteId: string,
): Promise<void> {
  const { data: invite, error: lookupError } = await getSupabase()
    .from("collection_invites")
    .select("collection_id")
    .eq("id", inviteId)
    .single();
  if (lookupError) throw lookupError;

  await requireRole(userId, invite.collection_id, ["owner"]);

  const { error } = await getSupabase()
    .from("collection_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);
  if (error) throw error;
}

export type InviteDetails = {
  token: string;
  collectionId: string;
  collectionName: string;
  inviterId: string;
};

// The link itself is the authorization — anyone holding a live token can see
// which vault it joins. Revoked and expired links read as invalid.
export async function getInviteByToken(
  token: string,
): Promise<InviteDetails | null> {
  const { data, error } = await getSupabase()
    .from("collection_invites")
    .select(
      "token, inviter_id, collection_id, status, expires_at, collections!inner(name)",
    )
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (
    !data ||
    data.status !== "active" ||
    new Date(data.expires_at) <= new Date()
  ) {
    return null;
  }

  const row = data as unknown as {
    token: string;
    inviter_id: string;
    collection_id: string;
    collections: { name: string };
  };
  return {
    token: row.token,
    collectionId: row.collection_id,
    collectionName: row.collections.name,
    inviterId: row.inviter_id,
  };
}

// Accept is one locked DB op — see the accept_invite migration. Returns the
// joined collection's id, or null for a dead/revoked/expired token.
export async function acceptInvite(
  userId: string,
  token: string,
  merge: boolean,
): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("accept_invite", {
    p_token: token,
    p_user_id: userId,
    p_merge: merge,
  });
  if (error) {
    if (error.message.includes("invite_invalid")) return null;
    throw error;
  }
  return data as string;
}

// Vaults where the user is the only member — the ones "merge my records in"
// would fold into the shared vault.
export async function listMergeableVaultIds(
  userId: string,
  excludeCollectionId: string,
): Promise<string[]> {
  const supabase = getSupabase();
  const { data: mine, error: mineError } = await supabase
    .from("collection_members")
    .select("collection_id")
    .eq("user_id", userId)
    .neq("collection_id", excludeCollectionId);
  if (mineError) throw mineError;

  const ids = (mine ?? []).map((m) => m.collection_id);
  if (ids.length === 0) return [];

  const { data: all, error: allError } = await supabase
    .from("collection_members")
    .select("collection_id")
    .in("collection_id", ids);
  if (allError) throw allError;

  const counts = new Map<string, number>();
  for (const row of all ?? []) {
    counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  }
  return ids.filter((id) => counts.get(id) === 1);
}
