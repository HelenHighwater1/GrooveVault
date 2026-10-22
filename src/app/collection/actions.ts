"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import {
  deleteMembership,
  getMembership,
  leaveVault,
  renameCollection,
  requireRole,
  resolveVault,
  switchVault,
} from "@/lib/collections";

export type RenameState = { error: string } | null;

export async function renameCollectionAction(
  _prev: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const collectionId = formData.get("collection_id");
  if (typeof collectionId !== "string" || !collectionId) {
    return { error: "Missing vault." };
  }

  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return { error: "Name can't be empty." };
  if (name.length > 60) return { error: "Keep it under 60 characters." };

  try {
    await renameCollection(userId, collectionId, name);
  } catch {
    return { error: "Couldn't save — try again." };
  }

  refresh();
  return null;
}

export async function switchVaultAction(collectionId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  await switchVault(userId, collectionId);
  refresh();
}

export type MemberActionState = { error: string } | null;

export async function removeMemberAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const collectionId = formData.get("collection_id");
  const targetId = formData.get("user_id");
  if (typeof collectionId !== "string" || !collectionId) {
    return { error: "Missing vault." };
  }
  if (typeof targetId !== "string" || !targetId) {
    return { error: "Missing member." };
  }
  if (targetId === userId) {
    return { error: "Use Leave vault to remove yourself." };
  }

  try {
    await requireRole(userId, collectionId, ["owner"]);

    const targetRole = await getMembership(targetId, collectionId);
    if (!targetRole) return { error: "They aren't in this vault." };
    if (targetRole === "owner") {
      return { error: "Owners can't be removed — transfer ownership first." };
    }

    await deleteMembership(collectionId, targetId);
  } catch {
    return { error: "Couldn't remove them — try again." };
  }

  refresh();
  return null;
}

const LEAVE_ERRORS: Record<string, string> = {
  not_a_member: "You aren't in this vault.",
  sole_member: "You can't leave a vault that's only yours.",
  successor_required: "Pick who takes over the vault first.",
};

export async function leaveVaultAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const collectionId = formData.get("collection_id");
  if (typeof collectionId !== "string" || !collectionId) {
    return { error: "Missing vault." };
  }
  const raw = formData.get("successor_id");
  const successorId = typeof raw === "string" && raw ? raw : undefined;

  try {
    const failed = await leaveVault(userId, collectionId, successorId);
    if (failed) {
      return { error: LEAVE_ERRORS[failed] ?? "Couldn't leave — try again." };
    }
    // If the vault just left was the active one, re-point to another.
    await resolveVault(userId);
  } catch {
    return { error: "Couldn't leave — try again." };
  }

  refresh();
  return null;
}
