import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { RenameCollectionForm } from "./rename-form";

export default async function CollectionPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const collection = await getOrCreateCollection(user.id);

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {collection.name}
      </h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Signed in as {user.primaryEmailAddress?.emailAddress ?? user.id}.
      </p>
      <RenameCollectionForm currentName={collection.name} />
      <p className="text-sm text-black/60 dark:text-white/60">
        No records yet — adding and browsing vinyl comes next.
      </p>
    </main>
  );
}
