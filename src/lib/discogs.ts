import "server-only";

const DISCOGS_API = "https://api.discogs.com";
const USER_AGENT = "GrooveVault/0.1";

export function discogsConfigured(): boolean {
  return Boolean(process.env.DISCOGS_TOKEN);
}

async function discogsFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) throw new Error("Missing DISCOGS_TOKEN");

  const res = await fetch(`${DISCOGS_API}${path}`, {
    signal,
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Discogs request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// Search results bundle artist and title into one string ("Artist – Title"),
// so the full release detail is fetched on selection to prefill the add form.

type SearchResponse = {
  results: {
    id: number;
    master_id?: number;
    title: string;
    year?: string;
    country?: string;
    format?: string[];
    genre?: string[];
    style?: string[];
    label?: string[];
    catno?: string;
    thumb?: string;
    cover_image?: string;
  }[];
};

export type DiscogsSearchResult = {
  releaseId: number;
  masterId: number | null;
  title: string;
  year: number | null;
  country: string | null;
  format: string;
  label: string | null;
  catno: string | null;
  thumb: string | null;
};

export async function searchReleases(
  query: string,
  signal?: AbortSignal,
): Promise<DiscogsSearchResult[]> {
  const data = await discogsFetch<SearchResponse>(
    `/database/search?type=release&per_page=20&q=${encodeURIComponent(query)}`,
    signal,
  );
  return data.results.map((r) => ({
    releaseId: r.id,
    masterId: r.master_id || null,
    title: r.title,
    year: r.year ? Number(r.year) || null : null,
    country: r.country ?? null,
    format: (r.format ?? []).join(", "),
    label: r.label?.[0] ?? null,
    catno: r.catno && r.catno !== "none" ? r.catno : null,
    thumb: r.thumb ?? null,
  }));
}

type ReleaseResponse = {
  id: number;
  master_id?: number;
  title: string;
  artists?: { name: string; anv?: string }[];
  year?: number;
  country?: string;
  genres?: string[];
  styles?: string[];
  formats?: { name: string; descriptions?: string[] }[];
  labels?: { name: string; catno?: string }[];
  images?: { type: string; uri: string }[];
};

export type DiscogsRelease = {
  releaseId: number;
  masterId: number | null;
  artist: string;
  title: string;
  year: number | null;
  country: string | null;
  format: string;
  genres: string[];
  styles: string[];
  label: string | null;
  catno: string | null;
  coverImageUrl: string | null;
};

export async function getRelease(id: number): Promise<DiscogsRelease> {
  const r = await discogsFetch<ReleaseResponse>(`/releases/${id}`);
  return {
    releaseId: r.id,
    masterId: r.master_id || null,
    artist: (r.artists ?? [])
      .map((a) => (a.anv || a.name).replace(/\s\(\d+\)$/, ""))
      .join(", "),
    title: r.title,
    year: r.year || null,
    country: r.country ?? null,
    format: (r.formats ?? [])
      .map((f) =>
        f.descriptions?.length
          ? `${f.name} (${f.descriptions.join(", ")})`
          : f.name,
      )
      .join(", "),
    genres: r.genres ?? [],
    styles: r.styles ?? [],
    label: r.labels?.[0]?.name ?? null,
    catno:
      r.labels?.[0]?.catno && r.labels[0].catno !== "none"
        ? r.labels[0].catno
        : null,
    coverImageUrl:
      r.images?.find((i) => i.type === "primary")?.uri ??
      r.images?.[0]?.uri ??
      null,
  };
}
