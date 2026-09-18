"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { CollectionRecord } from "@/lib/records";
import { markPlayedAction, rerollPickAction } from "./actions";
import { Eyebrow, VinylDisc } from "@/components/deco";

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function whyNote(r: CollectionRecord): string {
  const parts: string[] = [];
  const genre = r.styles[0] ?? r.genres[0];
  if (genre) parts.push(`Filed under ${genre}`);
  if (r.year) parts.push(`a ${r.year} pressing`);
  if (r.last_played_at) {
    const days = daysSince(r.last_played_at);
    parts.push(
      days === 0
        ? "on the turntable today"
        : `last spun ${days} day${days === 1 ? "" : "s"} ago`,
    );
  } else {
    parts.push("not yet spun");
  }
  return parts.length
    ? `${parts.join(" · ")}.`
    : "A quiet pull from the stacks.";
}

export function PickOfDay({
  initialPick,
  canReroll,
}: {
  initialPick: CollectionRecord;
  canReroll: boolean;
}) {
  const [pick, setPick] = useState(initialPick);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reroll() {
    setError(null);
    startTransition(async () => {
      const res = await rerollPickAction(pick.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPick(res.record);
    });
  }

  function putOn() {
    setError(null);
    startTransition(async () => {
      const res = await markPlayedAction(pick.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPick({ ...pick, last_played_at: res.playedAt });
    });
  }

  const meta = [pick.artist, pick.year, pick.label, pick.catno]
    .filter(Boolean)
    .join(" · ");
  const playedToday =
    !!pick.last_played_at && daysSince(pick.last_played_at) === 0;

  return (
    <div
      className="grid gap-[clamp(20px,2.8vw,36px)]"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,290px),1fr))",
      }}
    >
      <div className="flex flex-wrap items-start gap-6">
        <div
          className="relative flex-none"
          style={{ flexBasis: "clamp(130px,15vw,180px)" }}
        >
          {pick.cover_image_url && (
            <span className="absolute -right-5 top-1/2 aspect-square w-[62%] -translate-y-1/2">
              <VinylDisc speed={9} className="w-full" />
            </span>
          )}
          <div
            className="relative aspect-square border border-gold/50"
            style={{
              background: "radial-gradient(#2e4d38, #0e1c13)",
              boxShadow: "0 20px 40px -18px rgba(0,0,0,.95)",
            }}
          >
            {pick.cover_image_url ? (
              <Image
                src={pick.cover_image_url}
                alt={`${pick.artist} – ${pick.title} sleeve`}
                fill
                sizes="180px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-[19%]">
                <VinylDisc className="w-full" />
              </span>
            )}
          </div>
        </div>

        <div
          key={pick.id}
          className="animate-fade flex min-w-0 flex-1 flex-col gap-3"
        >
          <Eyebrow pulse>Pick of the day</Eyebrow>
          <h2 className="font-display text-[clamp(28px,4vw,44px)] leading-none text-cream">
            {pick.title}
          </h2>
          <p className="font-body text-[13px] uppercase tracking-[.12em] text-cream/55">
            {meta}
          </p>
          <p className="max-w-[42ch] border-l border-gold/60 pl-3.5 font-accent text-[16px] italic leading-[1.6] text-cream/70">
            {whyNote(pick)}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={putOn}
              disabled={pending || playedToday}
              className="btn-gold"
            >
              {playedToday ? "On the turntable" : "Put it on"}
            </button>
            <button
              type="button"
              onClick={reroll}
              disabled={pending || !canReroll}
              className="btn-ghost"
            >
              {pending ? "Rolling…" : "Re-roll"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-4">
        <button
          type="button"
          onClick={reroll}
          disabled={pending || !canReroll}
          className="surprise"
        >
          <span className="flex flex-col gap-2">
            <span className="font-display text-[26px] uppercase tracking-[.14em] text-cream-bright">
              Surprise me
            </span>
            <span className="font-body text-[11.5px] uppercase tracking-[.24em] text-cream/50">
              One record, no thinking
            </span>
          </span>
          <span className="surprise-ring" aria-hidden />
        </button>

        <div className="mood-field">
          <div className="flex items-center justify-between">
            <span className="font-body text-[8.5px] font-medium uppercase tracking-[.36em] text-gold">
              Or set the mood
            </span>
            <span className="gold-chip">Soon</span>
          </div>
          <input
            type="text"
            disabled
            placeholder="rainy sunday, no vocals"
            className="mood-input opacity-60"
            aria-label="Set the mood (coming soon)"
          />
        </div>
      </div>
    </div>
  );
}
