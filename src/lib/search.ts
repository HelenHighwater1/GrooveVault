import "server-only";

import { getOrCreateCollection } from "@/lib/collections";
import {
  discogsConfigured,
  searchReleases,
  type DiscogsSearchResult,
} from "@/lib/discogs";
import { findRecordsByMasterIds } from "@/lib/records";

export type SearchResultView = DiscogsSearchResult & { owned: boolean };

export type SearchState =
  | { results: SearchResultView[]; query: string }
  | { error: string; query: string }
  | null;

export async function flagOwned(
  results: DiscogsSearchResult[],
  userId: string,
): Promise<SearchResultView[]> {
  const collection = await getOrCreateCollection(userId);
  const masterIds = results
    .map((r) => r.masterId)
    .filter((id): id is number => id !== null);
  const owned = await findRecordsByMasterIds(collection.id, masterIds);
  const ownedIds = new Set(owned.map((r) => r.discogs_master_id));
  return results.map((r) => ({
    ...r,
    owned: r.masterId !== null && ownedIds.has(r.masterId),
  }));
}

export async function searchDiscogs(
  query: string,
  userId: string,
  signal?: AbortSignal,
): Promise<SearchState> {
  if (!discogsConfigured()) {
    return { error: "Discogs search isn't configured yet.", query };
  }
  if (!query) return { error: "Type something to search for.", query };

  try {
    const results = await searchReleases({ q: query }, signal);
    return { query, results: await flagOwned(results, userId) };
  } catch {
    return { error: "Search failed — try again or enter it manually.", query };
  }
}
