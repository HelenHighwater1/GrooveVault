"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import {
  deleteMembership,
  getMembership,
  listMembers,
  renameCollection,
  requireRole,
  resolveVault,
  setMemberRole,
  switchVault,
} from "@/lib/collections";

export type RenameState = { error: string } | null;

export async function renameCollectionAction(
  _prev: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return { error: "Name can't be empty." };
  if (name.length > 60) return { error: "Keep it under 60 characters." };

  try {
    await renameCollection(userId, name);
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

  const targetId = formData.get("user_id");
  if (typeof targetId !== "string" || !targetId) {
    return { error: "Missing member." };
  }
  if (targetId === userId) {
    return { error: "Use Leave vault to remove yourself." };
  }

  try {
    const collection = await resolveVault(userId);
    await requireRole(userId, collection.id, ["owner"]);

    const targetRole = await getMembership(targetId, collection.id);
    if (!targetRole) return { error: "They aren't in this vault." };
    if (targetRole === "owner") {
      return { error: "Owners can't be removed — transfer ownership first." };
    }

    await deleteMembership(collection.id, targetId);
  } catch {
    return { error: "Couldn't remove them — try again." };
  }

  refresh();
  return null;
}

export async function leaveVaultAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  try {
    const collection = await resolveVault(userId);
    const myRole = await getMembership(userId, collection.id);
    if (!myRole) return { error: "You aren't in this vault." };

    if (myRole === "owner") {
      const members = await listMembers(collection.id);
      const otherOwners = members.filter(
        (m) => m.role === "owner" && m.user_id !== userId,
      );

      if (otherOwners.length === 0 && members.length > 1) {
        // Sole owner leaving a shared vault must hand off first.
        const raw = formData.get("successor_id");
        const successorId = typeof raw === "string" ? raw : "";
        const successor = members.find(
          (m) => m.user_id === successorId && m.role !== "owner",
        );
        if (!successor) {
          return { error: "Pick who takes over the vault first." };
        }
        await setMemberRole(collection.id, successorId, "owner");
      } else if (members.length === 1) {
        return { error: "You can't leave a vault that's only yours." };
      }
    }

    await deleteMembership(collection.id, userId);
    await resolveVault(userId);
  } catch {
    return { error: "Couldn't leave — try again." };
  }

  refresh();
  return null;
}
