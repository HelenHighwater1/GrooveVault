import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { discogsConfigured } from "@/lib/discogs";
import { AddRecord } from "./add-record";

export default async function AddRecordPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await getOrCreateCollection(user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Add a record</h1>
        <Link
          href="/collection"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          Back to collection
        </Link>
      </div>
      <AddRecord discogsEnabled={discogsConfigured()} />
    </main>
  );
}
