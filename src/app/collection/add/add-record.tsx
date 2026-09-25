"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import type { CollectionRecord } from "@/lib/records";
import { Eyebrow, Panel, VinylDisc } from "@/components/deco";
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

export function AddRecord({
  discogsEnabled,
  nextNumber,
}: {
  discogsEnabled: boolean;
  nextNumber: number;
}) {
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

  return (
    <Panel className="flex flex-col gap-[19px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Eyebrow>Record {nextNumber}</Eyebrow>
          <h1 className="font-display text-[31px] leading-none tracking-[.04em] text-cream">
            Add to the vault
          </h1>
        </div>
        <Link
          href="/collection"
          aria-label="Back to collection"
          className="flex h-8 w-8 flex-none items-center justify-center border border-gold/50 font-body text-[16px] font-light text-cream/70 transition hover:border-gold hover:text-gold-light"
        >
          ×
        </Link>
      </div>

      {draft ? (
        <ConfirmForm
          key={draftKey}
          draft={draft}
          ownedPressings={ownedPressings}
          onCancel={() => setDraft(null)}
          onAdded={() => setDraft(null)}
        />
      ) : (
        <>
          <div className="scanner-well">
            <span className="scan-line" aria-hidden />
            <span className="gold-chip absolute right-3 top-3">Soon</span>
            <div className="scan-ring">
              <VinylDisc speed={9} className="w-[58px]" />
            </div>
            <p className="font-display text-[25px] leading-none text-cream">
              Hold the barcode up
            </p>
            <p className="font-accent text-[15px] italic text-cream/60">
              Or snap the front cover — we&apos;ll match the pressing
            </p>
          </div>

          <div className="divider-deco">
            <span className="font-body text-[8.5px] font-medium uppercase tracking-[.34em] text-cream/50">
              Or
            </span>
          </div>

          {discogsEnabled ? (
            <SearchPanel
              onSelect={selectResult}
              selecting={selecting}
              selectError={selectError}
            />
          ) : (
            <p className="border border-gold/40 bg-gold/10 px-3.5 py-2.5 font-body text-[12px] text-gold-light/90">
              Discogs search isn&apos;t configured yet — you can still add
              records manually.
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="font-accent text-[15px] italic text-cream/60">
              Can&apos;t find it?
            </span>
            <button
              type="button"
              onClick={() => openDraft(EMPTY_DRAFT, [])}
              className="btn-ghost px-4 py-2.5"
            >
              Enter it manually
            </button>
          </div>
        </>
      )}
    </Panel>
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
  const [query, setQuery] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const lastSubmittedRef = useRef("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || q === lastSubmittedRef.current) return;
    const timer = setTimeout(() => {
      lastSubmittedRef.current = q;
      formRef.current?.requestSubmit();
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmedQuery = query.trim();

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={formAction}
        onSubmit={() => {
          lastSubmittedRef.current = trimmedQuery;
        }}
        className="lookup"
      >
        <input
          type="search"
          name="query"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artist, title, or catalog no."
          aria-label="Search Discogs"
          className="lookup-input"
        />
        <button type="submit" disabled={pending} className="lookup-action">
          {pending ? "Looking…" : "Look up"}
        </button>
      </form>

      {state && "error" in state && state.query === trimmedQuery && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      {selectError && <p className="text-sm text-red-400">{selectError}</p>}

      {state && "results" in state && state.query === trimmedQuery && (
        <div className="flex flex-col gap-2.5">
          <p className="font-accent text-[15px] italic text-cream/60">
            {state.results.length === 0
              ? `No matches for “${state.query}” — try fewer words or enter it manually.`
              : `Matches for “${state.query}” — pick your pressing:`}
          </p>
          <ul className="flex flex-col divide-y divide-gold/15 border border-gold/30 bg-black/25">
            {state.results.map((r) => (
              <li key={r.releaseId}>
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  disabled={selecting}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-gold/10 disabled:opacity-50"
                >
                  {r.thumb ? (
                    <Image
                      src={r.thumb}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 border border-gold/30 object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-vault-mid text-xs text-gold">
                      ♪
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-display text-[15px] text-cream">
                      {r.title}
                    </span>
                    <span className="truncate font-body text-[9.5px] uppercase tracking-[.14em] text-cream/50">
                      {[r.year, r.format, r.country, r.label, r.catno]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {r.owned && (
                    <span className="gold-chip shrink-0">
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
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[8.5px] font-medium uppercase tracking-[.28em] text-cream/55">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="deco-input px-3.5 py-2.5"
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
        <p className="w-full border border-gold/50 bg-gold/10 px-3.5 py-2.5 font-body text-[12px] tracking-[.06em] text-gold-light">
          Added {state.added} to your collection.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onAdded} className="btn-gold">
            Add another
          </button>
          <Link href="/collection" className="btn-ghost">
            View collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {draft.coverImageUrl && (
        <div className="record-frame h-[120px] w-[120px]">
          <Image
            src={draft.coverImageUrl}
            alt={`${draft.artist} – ${draft.title} cover`}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>
      )}

      {ownedPressings.length > 0 && (
        <div className="flex flex-col gap-1.5 border border-gold/50 bg-gold/10 px-3.5 py-2.5">
          <p className="font-body text-[10px] font-medium uppercase tracking-[.2em] text-gold-light">
            You already own this album —{" "}
            {ownedPressings.length === 1
              ? "1 pressing"
              : `${ownedPressings.length} pressings`}
            :
          </p>
          <ul className="font-body text-[12px] text-cream/70">
            {ownedPressings.map((p) => (
              <li key={p.id}>
                {[p.year, p.format, p.country, p.label, p.catno]
                  .filter(Boolean)
                  .join(" · ") || p.title}
              </li>
            ))}
          </ul>
          <p className="font-accent text-[14px] italic text-cream/55">
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
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-gold">
          {pending ? "Adding…" : "Add to collection"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Back
        </button>
      </div>
    </form>
  );
}
