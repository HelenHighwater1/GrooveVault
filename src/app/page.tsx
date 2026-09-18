import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";
import { getOrCreateCollection } from "@/lib/collections";
import {
  countRecords,
  getCollectionStats,
  getRandomRecord,
  listRecords,
} from "@/lib/records";
import { ArchCard, DecoDivider, Eyebrow, Panel } from "@/components/deco";
import { PickOfDay } from "./pick-of-day";

const SHELF_SIZE = 11;

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Panel className="flex max-w-lg flex-col items-center gap-6 text-center">
          <span className="logo-mark" aria-hidden />
          <h1 className="font-display text-[40px] uppercase leading-none tracking-[.3em] text-gold-light">
            Groove Vault
          </h1>
          <p className="font-accent text-[17px] italic leading-[1.6] text-cream/60">
            A listening ritual, not a database. Track, organize, and rediscover
            your vinyl collection.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <SignUpButton mode="modal">
              <button className="btn-gold">Start your vault</button>
            </SignUpButton>
            <Link href="/sign-in" className="btn-ghost">
              Sign in
            </Link>
          </div>
        </Panel>
      </main>
    );
  }

  const collection = await getOrCreateCollection(user.id);
  const [total, stats, shelf, pick] = await Promise.all([
    countRecords(collection.id),
    getCollectionStats(collection.id),
    listRecords(collection.id, SHELF_SIZE),
    getRandomRecord(collection.id),
  ]);

  const statCells = [
    { value: String(total), label: "Records" },
    { value: String(stats.genreCount), label: "Genres" },
    {
      value: stats.oldestYear ? String(stats.oldestYear) : "—",
      label: "Oldest press",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-[clamp(16px,2vw,26px)] px-[clamp(16px,2.4vw,34px)] pb-10">
      <Panel className="flex flex-col gap-[clamp(20px,2.6vw,32px)]">
        <Eyebrow>The Collection</Eyebrow>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <h1
              className="font-display text-[clamp(40px,6.6vw,76px)] leading-[.94] tracking-[.02em] text-cream"
              style={{ textShadow: "0 2px 24px rgba(212,164,65,.28)" }}
            >
              {collection.name}
            </h1>
            <p className="font-accent text-[15px] italic leading-[1.5] text-cream/60">
              Every sleeve a story, every side a small ceremony.
            </p>
          </div>

          <div className="flex divide-x divide-gold/30 border border-gold/30 bg-black/30">
            {statCells.map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1.5 px-[22px] py-[15px]"
              >
                <span className="font-display text-[30px] leading-none text-gold-light">
                  {s.value}
                </span>
                <span className="font-body text-[8.5px] uppercase tracking-[.3em] text-cream/50">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DecoDivider />

        <div
          className="grid gap-[14px]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
          }}
        >
          <ArchCard
            href="/collection"
            title="Browse"
            caption={total === 1 ? "1 sleeve" : `All ${total} sleeves`}
            icon="browse"
          />
          <ArchCard
            title="Reorganize"
            caption="Crates & order"
            icon="crates"
            soon
          />
          <ArchCard
            href="/collection/add"
            title="Add new"
            caption="Scan a sleeve"
            icon="plus"
            emphasized
          />
          <ArchCard
            title="Stats"
            caption="Genres & decades"
            icon="stats"
            soon
          />
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-3 border-b border-gold/20 pb-5">
            <div className="flex items-center justify-between">
              <span className="font-body text-[9px] font-medium uppercase tracking-[.38em] text-cream/55">
                On the shelf
              </span>
              <Link
                href="/collection"
                className="font-body text-[9px] font-medium uppercase tracking-[.3em] text-gold hover:text-gold-light"
              >
                See all →
              </Link>
            </div>
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {shelf.map((r) => (
                <Link
                  key={r.id}
                  href="/collection"
                  className="shelf-tile"
                  title={`${r.artist} – ${r.title}`}
                >
                  {r.cover_image_url ? (
                    <Image
                      src={r.cover_image_url}
                      alt={`${r.artist} – ${r.title}`}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="shelf-dot" aria-hidden />
                  )}
                </Link>
              ))}
              {total > shelf.length && (
                <Link
                  href="/collection"
                  className="shelf-tile"
                  style={{ borderStyle: "dashed" }}
                >
                  <span className="px-2 text-center font-body text-[8.5px] uppercase tracking-[.24em] text-gold">
                    + {total - shelf.length} more
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {total === 0 && (
          <p className="font-accent text-[16px] italic leading-[1.6] text-cream/60">
            The vault is quiet —{" "}
            <Link href="/collection/add" className="text-gold underline">
              add your first record
            </Link>{" "}
            and give the needle something to do.
          </p>
        )}
      </Panel>

      {pick && (
        <Panel alt>
          <PickOfDay initialPick={pick} canReroll={total > 1} />
        </Panel>
      )}
    </main>
  );
}
