"use client";

import { useActionState, useState } from "react";
import { createInviteAction, revokeInviteAction } from "./actions";
import { RenameCollectionForm } from "./rename-form";

export type InviteView = {
  id: string;
  token: string;
  expiresAt: string;
};

// Server render can't know the origin — the input is read-only, so a
// suppressHydrationWarning covers the client filling it in.
function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

function inviteUrlFor(token: string) {
  return typeof window === "undefined" ? "" : inviteUrl(token);
}

export function InvitePanel({
  collectionId,
  defaultName,
  invites,
}: {
  collectionId: string;
  defaultName: boolean;
  invites: InviteView[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost px-5 py-2.5"
      >
        Invite someone
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 border border-gold/30 bg-black/25 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Share this vault</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-[10px] uppercase tracking-[.2em] text-cream/50 hover:text-cream"
        >
          Close
        </button>
      </div>

      {defaultName && (
        <div className="flex flex-col gap-2">
          <p className="font-body text-[11px] leading-[1.5] text-cream/60">
            Give the vault a name they&rsquo;ll recognize — optional, but it
            beats &ldquo;My collection&rdquo; on their end.
          </p>
          <RenameCollectionForm
            collectionId={collectionId}
            currentName="My collection"
          />
        </div>
      )}

      <NewInviteForm
        collectionId={collectionId}
        liveTokens={new Set(invites.map((i) => i.token))}
      />

      {invites.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-gold/20 pt-3">
          {invites.map((i) => (
            <InviteRow key={i.id} invite={i} />
          ))}
        </ul>
      )}

      <p className="font-body text-[10px] leading-[1.5] text-cream/45">
        Anyone with the link can join while it&rsquo;s active. Links expire
        after 7 days.
      </p>
    </div>
  );
}

function NewInviteForm({
  collectionId,
  liveTokens,
}: {
  collectionId: string;
  liveTokens: Set<string>;
}) {
  const [state, formAction, pending] = useActionState(createInviteAction, null);
  // Only keep showing a fresh link while it's still live — a revoke clears
  // it from the copy field once the server list updates.
  const created =
    state && "token" in state && liveTokens.has(state.token) ? state : null;

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="collection_id" value={collectionId} />
        <button
          type="submit"
          disabled={pending}
          className="btn-gold px-4 py-2.5"
        >
          {pending ? "Making link…" : "Create invite link"}
        </button>
        {state && "error" in state && (
          <span className="font-body text-[11px] text-red-400">
            {state.error}
          </span>
        )}
      </form>
      {created && (
        <InviteLink token={created.token} expiresAt={created.expiresAt} />
      )}
    </div>
  );
}

function InviteLink({
  token,
  expiresAt,
}: {
  token: string;
  expiresAt: string;
}) {
  const url = inviteUrlFor(token);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          readOnly
          value={url}
          suppressHydrationWarning
          aria-label="Invite link"
          onFocus={(e) => e.target.select()}
          className="deco-input w-full px-3.5 py-2.5 text-[12px]"
        />
        <button
          type="button"
          disabled={!url}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard blocked — the field is read-only and selectable.
            }
          }}
          className="btn-ghost shrink-0 px-4 py-2.5"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <span className="font-body text-[10px] uppercase tracking-[.18em] text-cream/45">
        Expires {new Date(expiresAt).toLocaleDateString()}
      </span>
    </div>
  );
}

function InviteRow({ invite }: { invite: InviteView }) {
  const [state, formAction, pending] = useActionState(revokeInviteAction, null);
  const url = inviteUrlFor(invite.token);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span
          suppressHydrationWarning
          className="truncate font-body text-[11px] text-cream/70"
        >
          {url}
        </span>
        <span className="font-body text-[9px] uppercase tracking-[.18em] text-cream/45">
          Expires {new Date(invite.expiresAt).toLocaleDateString()}
        </span>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="invite_id" value={invite.id} />
        <button
          type="submit"
          disabled={pending}
          className="btn-ghost px-3.5 py-1.5 text-[10px]"
        >
          {pending ? "Revoking…" : "Revoke"}
        </button>
        {state?.error && (
          <span className="font-body text-[11px] text-red-400">
            {state.error}
          </span>
        )}
      </form>
    </li>
  );
}
