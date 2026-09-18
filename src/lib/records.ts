import "server-only";
import { getSupabase } from "./supabase";

export type CollectionRecord = {
  id: string;
  collection_id: string;
  artist: string;
  title: string;
  year: number | null;
  format: string | null;
  genres: string[];
  styles: string[];
  country: string | null;
  label: string | null;
  catno: string | null;
  cover_image_url: string | null;
  discogs_release_id: number | null;
  discogs_master_id: number | null;
  last_played_at: string | null;
  created_at: string;
};

export type NewRecord = Omit<
  CollectionRecord,
  "id" | "collection_id" | "created_at" | "last_played_at"
>;

const COLUMNS =
  "id, collection_id, artist, title, year, format, genres, styles, country, label, catno, cover_image_url, discogs_release_id, discogs_master_id, last_played_at, created_at";

export async function listRecords(
  collectionId: string,
  limit: number,
  offset = 0,
): Promise<CollectionRecord[]> {
  const { data, error } = await getSupabase()
    .from("records")
    .select(COLUMNS)
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

export async function countRecords(collectionId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("records")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);
  if (error) throw error;
  return count ?? 0;
}

export async function addRecord(
  collectionId: string,
  record: NewRecord,
): Promise<CollectionRecord> {
  const { data, error } = await getSupabase()
    .from("records")
    .insert({ ...record, collection_id: collectionId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function findRecordsByMasterIds(
  collectionId: string,
  masterIds: number[],
): Promise<CollectionRecord[]> {
  if (masterIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("records")
    .select(COLUMNS)
    .eq("collection_id", collectionId)
    .in("discogs_master_id", masterIds);
  if (error) throw error;
  return data;
}

export type CollectionStats = {
  oldestYear: number | null;
  genreCount: number;
};

export async function getCollectionStats(
  collectionId: string,
): Promise<CollectionStats> {
  const { data, error } = await getSupabase()
    .from("records")
    .select("year, genres")
    .eq("collection_id", collectionId);
  if (error) throw error;

  let oldestYear: number | null = null;
  const genres = new Set<string>();
  for (const r of data) {
    if (r.year && (oldestYear === null || r.year < oldestYear)) {
      oldestYear = r.year;
    }
    for (const g of r.genres ?? []) genres.add(g);
  }
  return { oldestYear, genreCount: genres.size };
}

export async function getRandomRecord(
  collectionId: string,
  excludeIds: string[] = [],
): Promise<CollectionRecord | null> {
  const { data, error } = await getSupabase()
    .from("records")
    .select("id")
    .eq("collection_id", collectionId);
  if (error) throw error;

  const ids = data.map((r) => r.id).filter((id) => !excludeIds.includes(id));
  if (ids.length === 0) return null;

  const id = ids[Math.floor(Math.random() * ids.length)];
  const { data: record, error: recordError } = await getSupabase()
    .from("records")
    .select(COLUMNS)
    .eq("id", id)
    .single();
  if (recordError) throw recordError;
  return record;
}

export async function markRecordPlayed(
  collectionId: string,
  recordId: string,
): Promise<CollectionRecord | null> {
  const { data, error } = await getSupabase()
    .from("records")
    .update({ last_played_at: new Date().toISOString() })
    .eq("id", recordId)
    .eq("collection_id", collectionId)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data;
}
