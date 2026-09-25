import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { discogsConfigured } from "@/lib/discogs";
import { searchDiscogs } from "@/lib/search";

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

  // request.signal aborts the upstream Discogs call when the client cancels
  // a superseded search.
  const state = await searchDiscogs(query, userId, request.signal);
  return NextResponse.json(state, {
    status: state && "error" in state ? 500 : 200,
  });
}
