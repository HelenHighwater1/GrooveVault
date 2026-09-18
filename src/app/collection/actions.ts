"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { renameCollection } from "@/lib/collections";

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
