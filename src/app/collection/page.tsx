import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateCollection } from "@/lib/collections";
import { countRecords, listRecords } from "@/lib/records";
import { DecoDivider, Eyebrow, Panel, VinylDisc } from "@/components/deco";
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
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-[clamp(16px,2vw,26px)] px-[clamp(16px,2.4vw,34px)] pb-10">
      <Panel className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <Eyebrow>The stacks</Eyebrow>
            <h1
              className="font-display text-[clamp(34px,5vw,56px)] leading-[.94] tracking-[.02em] text-cream"
              style={{ textShadow: "0 2px 24px rgba(212,164,65,.28)" }}
            >
              {collection.name}
            </h1>
            <p className="font-body text-[11px] uppercase tracking-[.18em] text-cream/45">
              Signed in as {user.primaryEmailAddress?.emailAddress ?? user.id}
            </p>
            <RenameCollectionForm currentName={collection.name} />
          </div>
          <Link href="/collection/add" className="btn-gold">
            Add a record
          </Link>
        </div>

        <DecoDivider />

        <div className="flex items-center justify-between">
          <span className="eyebrow">Records · {total}</span>
          {totalPages > 1 && (
            <span className="font-body text-[9px] uppercase tracking-[.3em] text-cream/50">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {total === 0 ? (
          <p className="font-accent text-[16px] italic leading-[1.6] text-cream/60">
            No records yet —{" "}
            <Link href="/collection/add" className="text-gold underline">
              add your first record
            </Link>
            .
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-4">
            {records.map((r) => (
              <li key={r.id} className="flex min-w-0 flex-col">
                <div className="record-frame">
                  {r.cover_image_url ? (
                    <Image
                      src={r.cover_image_url}
                      alt={`${r.artist} – ${r.title}`}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-[19%]">
                      <VinylDisc className="w-full" speed={9} />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 border border-t-0 border-gold/30 bg-black/30 px-3 py-2.5">
                  <span className="truncate font-display text-[16px] leading-tight text-cream">
                    {r.title}
                  </span>
                  <span className="truncate font-body text-[11px] uppercase tracking-[.12em] text-cream/60">
                    {r.artist}
                  </span>
                  <span className="truncate font-body text-[9px] uppercase tracking-[.18em] text-cream/40">
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
                className="btn-ghost px-5 py-3"
              >
                Previous
              </Link>
            ) : (
              <span className="btn-ghost px-5 py-3 opacity-40">Previous</span>
            )}
            <span className="font-body text-[9px] uppercase tracking-[.3em] text-cream/50">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/collection?page=${page + 1}`}
                className="btn-ghost px-5 py-3"
              >
                Next
              </Link>
            ) : (
              <span className="btn-ghost px-5 py-3 opacity-40">Next</span>
            )}
          </nav>
        )}
      </Panel>
    </main>
  );
}
