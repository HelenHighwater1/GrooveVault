import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { countRecords, listRecords } from "@/lib/records";
import { RenameCollectionForm } from "./rename-form";

const PAGE_SIZE = 60;

export default async function CollectionPage({
  searchParams,
}: PageProps<"/collection">) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const requested = Number((await searchParams).page);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;

  const collection = await getOrCreateCollection(user.id);
  const [records, total] = await Promise.all([
    listRecords(collection.id, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    countRecords(collection.id),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (page > 1 && page > totalPages) {
    redirect(`/collection?page=${Math.max(totalPages, 1)}`);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {collection.name}
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Signed in as {user.primaryEmailAddress?.emailAddress ?? user.id}.
        </p>
        <RenameCollectionForm currentName={collection.name} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight">
          Records{" "}
          <span className="text-sm font-normal text-black/60 dark:text-white/60">
            ({total})
          </span>
        </h2>
        <Link
          href="/collection/add"
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Add a record
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No records yet —{" "}
          <Link href="/collection/add" className="underline">
            add your first record
          </Link>
          .
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-black/10 p-3 dark:border-white/10"
            >
              {r.cover_image_url ? (
                <Image
                  src={r.cover_image_url}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-black/10 text-lg dark:bg-white/10">
                  ♪
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{r.title}</span>
                <span className="truncate text-sm text-black/60 dark:text-white/60">
                  {r.artist}
                </span>
                <span className="truncate text-xs text-black/50 dark:text-white/50">
                  {[r.year, r.format, r.genres.join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 self-center">
          {page > 1 ? (
            <Link
              href={`/collection?page=${page - 1}`}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-black/40 dark:border-white/10 dark:text-white/40">
              Previous
            </span>
          )}
          <span className="text-sm text-black/60 dark:text-white/60">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/collection?page=${page + 1}`}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-black/40 dark:border-white/10 dark:text-white/40">
              Next
            </span>
          )}
        </nav>
      )}
    </main>
  );
}
