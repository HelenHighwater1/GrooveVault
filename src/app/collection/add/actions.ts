"use server";

import { auth } from "@clerk/nextjs/server";
import { ApiError } from "@google/genai";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { resolveVault } from "@/lib/collections";
import {
  discogsConfigured,
  getRelease,
  searchReleases,
  type DiscogsSearchResult,
} from "@/lib/discogs";
import { identifyConfigured, identifyCover } from "@/lib/identify";
import { flagOwned, type SearchResultView } from "@/lib/search";
import {
  addRecord,
  findRecordsByMasterIds,
  type CollectionRecord,
} from "@/lib/records";

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
    const collection = await resolveVault(userId);
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

export type ScanState =
  | { results: SearchResultView[]; kind: "barcode" | "cover" }
  | { error: string }
  | null;

export async function lookupBarcodeAction(code: string): Promise<ScanState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };
  if (!discogsConfigured()) {
    return { error: "Discogs search isn't configured yet." };
  }

  const barcode = code.trim();
  if (!/^[0-9A-Za-z .$/+%*-]{4,32}$/.test(barcode)) {
    return { error: "That barcode didn't read cleanly — try again." };
  }

  try {
    let results = await searchReleases({ barcode });
    // UPC-A and EAN-13 forms of the same barcode are catalogued
    // inconsistently on Discogs, so retry with the other form on a miss.
    if (results.length === 0 && /^\d{12}$/.test(barcode)) {
      results = await searchReleases({ barcode: `0${barcode}` });
    } else if (results.length === 0 && /^0\d{12}$/.test(barcode)) {
      results = await searchReleases({ barcode: barcode.slice(1) });
    }
    return { results: await flagOwned(results, userId), kind: "barcode" };
  } catch {
    return { error: "Lookup failed — try again or search manually." };
  }
}

const MAX_SCAN_BYTES = 4 * 1024 * 1024;

export async function identifyCoverAction(
  formData: FormData,
): Promise<ScanState> {
  const { userId } = await auth();
  if (!userId) return { error: "You must be signed in." };
  if (!discogsConfigured()) {
    return { error: "Discogs search isn't configured yet." };
  }
  if (!identifyConfigured()) {
    return { error: "Cover scanning isn't configured yet." };
  }

  const image = formData.get("image");
  if (
    !(image instanceof File) ||
    !image.type.startsWith("image/") ||
    image.size === 0
  ) {
    return { error: "That photo didn't come through — try again." };
  }
  if (image.size > MAX_SCAN_BYTES) {
    return { error: "That photo is too large — try a tighter shot." };
  }

  try {
    const data = Buffer.from(await image.arrayBuffer()).toString("base64");
    const id = await identifyCover({ data, mimeType: image.type });
    if (!id || (!id.artist && !id.title && !id.catno)) {
      return {
        error:
          "Couldn't make out the cover — try a clearer shot or search manually.",
      };
    }

    const searches: Promise<DiscogsSearchResult[]>[] = [];
    if (id.catno) searches.push(searchReleases({ catno: id.catno }));
    if (id.artist && id.title) {
      searches.push(
        searchReleases({
          artist: id.artist,
          releaseTitle: id.title,
          label: id.label ?? undefined,
        }),
      );
    }
    const q = [id.artist, id.title].filter(Boolean).join(" ");
    if (q) searches.push(searchReleases({ q }));

    const settled = await Promise.allSettled(searches);
    if (settled.every((s) => s.status === "rejected")) {
      return { error: "Discogs isn't responding — try again in a moment." };
    }
    const lists = settled
      .filter(
        (s): s is PromiseFulfilledResult<DiscogsSearchResult[]> =>
          s.status === "fulfilled",
      )
      .map((s) => s.value);

    // Interleave the searches so one broad result set can't crowd out the
    // others — a misread catno could otherwise fill all 20 slots.
    const merged: DiscogsSearchResult[] = [];
    const seen = new Set<number>();
    const idx = lists.map(() => 0);
    while (merged.length < 20) {
      let progressed = false;
      for (let j = 0; j < lists.length; j++) {
        while (
          idx[j] < lists[j].length &&
          seen.has(lists[j][idx[j]].releaseId)
        ) {
          idx[j]++;
        }
        if (idx[j] < lists[j].length) {
          seen.add(lists[j][idx[j]].releaseId);
          merged.push(lists[j][idx[j]]);
          idx[j]++;
          progressed = true;
        }
      }
      if (!progressed) break;
    }
    return { results: await flagOwned(merged, userId), kind: "cover" };
  } catch (e) {
    Sentry.captureException(e);
    const busy =
      e instanceof ApiError && (e.status === 429 || e.status === 503);
    return {
      error: busy
        ? "The identification service is busy — try again in a minute."
        : "Couldn't identify that cover — try again or search manually.",
    };
  }
}

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
    const collection = await resolveVault(userId);
    await addRecord(collection.id, {
      artist,
      title,
      added_by: userId,
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
