import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { countRecords } from "@/lib/records";
import { discogsConfigured } from "@/lib/discogs";
import { searchDiscogs } from "@/lib/search";
import { AddRecord } from "./add-record";

export default async function AddRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string | string[] }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const collection = await getOrCreateCollection(user.id);
  const total = await countRecords(collection.id);

  // A native (pre-hydration or no-JS) form submit lands here as
  // /collection/add?query=... — run the search server-side so the page still
  // shows results.
  const { query } = await searchParams;
  const initialQuery = (typeof query === "string" ? query : "").trim();
  const enabled = discogsConfigured();
  const initialState =
    enabled && initialQuery.length >= 2
      ? await searchDiscogs(initialQuery, user.id)
      : null;

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-[clamp(16px,2.4vw,34px)] pb-10 pt-4">
      <AddRecord
        discogsEnabled={enabled}
        nextNumber={total + 1}
        initialQuery={initialQuery}
        initialState={initialState}
      />
    </main>
  );
}
