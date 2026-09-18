"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getOrCreateCollection } from "@/lib/collections";
import {
  discogsConfigured,
  getRelease,
  searchReleases,
  type DiscogsSearchResult,
} from "@/lib/discogs";
import {
  addRecord,
  findRecordsByMasterIds,
  type CollectionRecord,
} from "@/lib/records";

export type SearchResultView = DiscogsSearchResult & { owned: boolean };

export type SearchState =
  { results: SearchResultView[]; query: string } | { error: string } | null;

export async function searchDiscogsAction(
  _prev: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };
  if (!discogsConfigured()) {
    return { error: "Discogs search isn't configured yet." };
  }

  const raw = formData.get("query");
  const query = typeof raw === "string" ? raw.trim() : "";
  if (!query) return { error: "Type something to search for." };

  try {
    const [results, collection] = await Promise.all([
      searchReleases(query),
      getOrCreateCollection(userId),
    ]);
    const masterIds = results
      .map((r) => r.masterId)
      .filter((id): id is number => id !== null);
    const owned = await findRecordsByMasterIds(collection.id, masterIds);
    const ownedIds = new Set(owned.map((r) => r.discogs_master_id));
    return {
      query,
      results: results.map((r) => ({
        ...r,
        owned: r.masterId !== null && ownedIds.has(r.masterId),
      })),
    };
  } catch {
    return { error: "Search failed — try again or enter it manually." };
  }
}

export type ConfirmDraft = {
  artist: string;
  title: string;
  year: number | null;
  format: string;
  genres: string[];
  styles: string[];
  country: string;
  label: string;
  catno: string;
  coverImageUrl: string | null;
  discogsReleaseId: number | null;
  discogsMasterId: number | null;
};

export type SelectState =
  | { draft: ConfirmDraft; ownedPressings: CollectionRecord[] }
  | { error: string }
  | null;

export async function selectReleaseAction(
  releaseId: number,
): Promise<SelectState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  try {
    const release = await getRelease(releaseId);
    const collection = await getOrCreateCollection(userId);
    const ownedPressings = release.masterId
      ? await findRecordsByMasterIds(collection.id, [release.masterId])
      : [];
    return {
      ownedPressings,
      draft: {
        artist: release.artist,
        title: release.title,
        year: release.year,
        format: release.format,
        genres: release.genres,
        styles: release.styles,
        country: release.country ?? "",
        label: release.label ?? "",
        catno: release.catno ?? "",
        coverImageUrl: release.coverImageUrl,
        discogsReleaseId: release.releaseId,
        discogsMasterId: release.masterId,
      },
    };
  } catch {
    return { error: "Couldn't load that release — try again." };
  }
}

export type AddState = { error: string } | { added: string } | null;

function textField(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function listField(formData: FormData, key: string): string[] {
  return textField(formData, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function intField(formData: FormData, key: string): number | null {
  const raw = textField(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export async function addRecordAction(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };

  const artist = textField(formData, "artist");
  const title = textField(formData, "title");
  if (!artist || !title) return { error: "Artist and title are required." };

  const year = intField(formData, "year");
  if (textField(formData, "year") && year === null) {
    return { error: "Year needs to be a number." };
  }

  try {
    const collection = await getOrCreateCollection(userId);
    await addRecord(collection.id, {
      artist,
      title,
      year,
      format: textField(formData, "format") || null,
      genres: listField(formData, "genres"),
      styles: listField(formData, "styles"),
      country: textField(formData, "country") || null,
      label: textField(formData, "label") || null,
      catno: textField(formData, "catno") || null,
      cover_image_url: textField(formData, "cover_image_url") || null,
      discogs_release_id: intField(formData, "discogs_release_id"),
      discogs_master_id: intField(formData, "discogs_master_id"),
    });
  } catch {
    return { error: "Couldn't save — try again." };
  }

  revalidatePath("/collection");
  return { added: `${artist} – ${title}` };
}
