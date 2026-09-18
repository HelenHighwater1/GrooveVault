import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { countRecords } from "@/lib/records";
import { discogsConfigured } from "@/lib/discogs";
import { AddRecord } from "./add-record";

export default async function AddRecordPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const collection = await getOrCreateCollection(user.id);
  const total = await countRecords(collection.id);

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-[clamp(16px,2.4vw,34px)] pb-10 pt-4">
      <AddRecord discogsEnabled={discogsConfigured()} nextNumber={total + 1} />
    </main>
  );
}
