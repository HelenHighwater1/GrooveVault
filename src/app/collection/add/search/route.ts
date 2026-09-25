import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateCollection } from "@/lib/collections";
import { discogsConfigured, searchReleases } from "@/lib/discogs";
import { findRecordsByMasterIds } from "@/lib/records";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in.", query },
      { status: 401 },
    );
  }
  if (!discogsConfigured()) {
    return NextResponse.json(
      { error: "Discogs search isn't configured yet.", query },
      { status: 503 },
    );
  }
  if (!query) {
    return NextResponse.json(
      { error: "Type something to search for.", query },
      { status: 400 },
    );
  }

  try {
    // request.signal aborts the upstream Discogs call when the client cancels
    // a superseded search.
    const [results, collection] = await Promise.all([
      searchReleases(query, request.signal),
      getOrCreateCollection(userId),
    ]);
    const masterIds = results
      .map((r) => r.masterId)
      .filter((id): id is number => id !== null);
    const owned = await findRecordsByMasterIds(collection.id, masterIds);
    const ownedIds = new Set(owned.map((r) => r.discogs_master_id));
    return NextResponse.json({
      query,
      results: results.map((r) => ({
        ...r,
        owned: r.masterId !== null && ownedIds.has(r.masterId),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed — try again or enter it manually.", query },
      { status: 500 },
    );
  }
}
