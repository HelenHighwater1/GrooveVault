"use server";

import { auth } from "@clerk/nextjs/server";
import { getOrCreateCollection } from "@/lib/collections";
import {
  getRandomRecord,
  markRecordPlayed,
  type CollectionRecord,
} from "@/lib/records";

export type PickResult = { record: CollectionRecord } | { error: string };

export async function rerollPickAction(excludeId: string): Promise<PickResult> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const collection = await getOrCreateCollection(userId);
  const record = await getRandomRecord(collection.id, [excludeId]);
  if (!record) return { error: "No other records to pick." };
  return { record };
}

export type PlayedResult = { playedAt: string } | { error: string };

export async function markPlayedAction(
  recordId: string,
): Promise<PlayedResult> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const collection = await getOrCreateCollection(userId);
  const record = await markRecordPlayed(collection.id, recordId);
  if (!record?.last_played_at) {
    return { error: "That record isn't in your collection." };
  }
  return { playedAt: record.last_played_at };
}
