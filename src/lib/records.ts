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
  created_at: string;
};

export type NewRecord = Omit<
  CollectionRecord,
  "id" | "collection_id" | "created_at"
>;

const COLUMNS =
  "id, collection_id, artist, title, year, format, genres, styles, country, label, catno, cover_image_url, discogs_release_id, discogs_master_id, created_at";

export async function listRecords(
  collectionId: string,
): Promise<CollectionRecord[]> {
  const { data, error } = await getSupabase()
    .from("records")
    .select(COLUMNS)
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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
