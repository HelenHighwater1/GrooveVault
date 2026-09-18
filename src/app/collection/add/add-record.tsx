"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CollectionRecord } from "@/lib/records";
import {
  addRecordAction,
  searchDiscogsAction,
  selectReleaseAction,
  type ConfirmDraft,
  type SearchResultView,
} from "./actions";

const EMPTY_DRAFT: ConfirmDraft = {
  artist: "",
  title: "",
  year: null,
  format: "",
  genres: [],
  styles: [],
  country: "",
  label: "",
  catno: "",
  coverImageUrl: null,
  discogsReleaseId: null,
  discogsMasterId: null,
};

export function AddRecord({ discogsEnabled }: { discogsEnabled: boolean }) {
  const [draft, setDraft] = useState<ConfirmDraft | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [ownedPressings, setOwnedPressings] = useState<CollectionRecord[]>([]);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selecting, startSelecting] = useTransition();

  function openDraft(next: ConfirmDraft, owned: CollectionRecord[]) {
    setOwnedPressings(owned);
    setDraftKey((k) => k + 1);
    setDraft(next);
  }

  function selectResult(result: SearchResultView) {
    setSelectError(null);
    startSelecting(async () => {
      const res = await selectReleaseAction(result.releaseId);
      if (!res || "error" in res) {
        setSelectError(res?.error ?? "Couldn't load that release — try again.");
        return;
      }
      openDraft(res.draft, res.ownedPressings);
    });
  }

  if (draft) {
    return (
      <ConfirmForm
        key={draftKey}
        draft={draft}
        ownedPressings={ownedPressings}
        onCancel={() => setDraft(null)}
        onAdded={() => setDraft(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {discogsEnabled ? (
        <SearchPanel
          onSelect={selectResult}
          selecting={selecting}
          selectError={selectError}
        />
      ) : (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Discogs search isn&apos;t configured yet — you can still add records
          manually.
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className="text-sm text-black/60 dark:text-white/60">
          Can&apos;t find it?
        </span>
        <button
          type="button"
          onClick={() => openDraft(EMPTY_DRAFT, [])}
          className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
        >
          Enter it manually
        </button>
      </div>
    </div>
  );
}

function SearchPanel({
  onSelect,
  selecting,
  selectError,
}: {
  onSelect: (r: SearchResultView) => void;
  selecting: boolean;
  selectError: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    searchDiscogsAction,
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex items-center gap-2">
        <input
          type="search"
          name="query"
          required
          placeholder="Artist or title — e.g. Fleetwood Mac Rumours"
          aria-label="Search Discogs"
          className="w-full rounded-md border border-black/20 bg-transparent px-3 py-1.5 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Searching…" : "Search"}
        </button>
      </form>

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {selectError && (
        <p className="text-sm text-red-600 dark:text-red-400">{selectError}</p>
      )}

      {state && "results" in state && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-black/60 dark:text-white/60">
            {state.results.length === 0
              ? `No matches for “${state.query}” — try fewer words or enter it manually.`
              : `Matches for “${state.query}” — pick your pressing:`}
          </p>
          <ul className="flex flex-col divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/10 dark:border-white/10">
            {state.results.map((r) => (
              <li key={r.releaseId}>
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  disabled={selecting}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
                >
                  {r.thumb ? (
                    <Image
                      src={r.thumb}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-black/10 text-xs dark:bg-white/10">
                      ♪
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {r.title}
                    </span>
                    <span className="truncate text-xs text-black/60 dark:text-white/60">
                      {[r.year, r.format, r.country, r.label, r.catno]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {r.owned && (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                      In your collection
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-black/60 dark:text-white/60">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded-md border border-black/20 bg-transparent px-3 py-1.5 dark:border-white/20"
      />
    </label>
  );
}

function ConfirmForm({
  draft,
  ownedPressings,
  onCancel,
  onAdded,
}: {
  draft: ConfirmDraft;
  ownedPressings: CollectionRecord[];
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [state, formAction, pending] = useActionState(addRecordAction, null);

  if (state && "added" in state) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm">
          Added {state.added} to your collection.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAdded}
            className="rounded-full bg-black px-4 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            Add another
          </button>
          <Link
            href="/collection"
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            View collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {draft.coverImageUrl && (
        <Image
          src={draft.coverImageUrl}
          alt={`${draft.artist} – ${draft.title} cover`}
          width={120}
          height={120}
          className="h-30 w-30 rounded object-cover"
        />
      )}

      {ownedPressings.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            You already own this album —{" "}
            {ownedPressings.length === 1
              ? "1 pressing"
              : `${ownedPressings.length} pressings`}
            :
          </p>
          <ul className="text-amber-800/80 dark:text-amber-300/80">
            {ownedPressings.map((p) => (
              <li key={p.id}>
                {[p.year, p.format, p.country, p.label, p.catno]
                  .filter(Boolean)
                  .join(" · ") || p.title}
              </li>
            ))}
          </ul>
          <p className="text-amber-800/80 dark:text-amber-300/80">
            Saving adds this as a separate pressing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Artist"
          name="artist"
          defaultValue={draft.artist}
          required
        />
        <Field label="Title" name="title" defaultValue={draft.title} required />
        <Field
          label="Year"
          name="year"
          defaultValue={draft.year}
          placeholder="1977"
        />
        <Field
          label="Format"
          name="format"
          defaultValue={draft.format}
          placeholder="Vinyl (LP, Album)"
        />
        <Field
          label="Genres"
          name="genres"
          defaultValue={draft.genres.join(", ")}
          placeholder="Rock, Funk / Soul"
        />
        <Field
          label="Styles"
          name="styles"
          defaultValue={draft.styles.join(", ")}
          placeholder="Soft Rock, Disco"
        />
        <Field label="Country" name="country" defaultValue={draft.country} />
        <Field label="Label" name="label" defaultValue={draft.label} />
        <Field label="Cat #" name="catno" defaultValue={draft.catno} />
      </div>

      <input
        type="hidden"
        name="cover_image_url"
        value={draft.coverImageUrl ?? ""}
      />
      <input
        type="hidden"
        name="discogs_release_id"
        value={draft.discogsReleaseId ?? ""}
      />
      <input
        type="hidden"
        name="discogs_master_id"
        value={draft.discogsMasterId ?? ""}
      />

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Adding…" : "Add to collection"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
        >
          Back
        </button>
      </div>
    </form>
  );
}
