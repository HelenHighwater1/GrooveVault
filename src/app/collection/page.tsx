import { currentUser } from "@clerk/nextjs/server";

export default async function CollectionPage() {
  const user = await currentUser();

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your collection</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.id}.
      </p>
      <p className="text-sm text-black/60 dark:text-white/60">
        No records yet — adding and browsing vinyl comes next.
      </p>
    </main>
  );
}
