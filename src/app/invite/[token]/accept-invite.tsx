"use client";

import Link from "next/link";
import { useActionState } from "react";
import { acceptInviteAction } from "@/app/collection/actions";

export function AcceptInvite({
  token,
  alreadyMember,
  mergeableCount,
}: {
  token: string;
  alreadyMember: boolean;
  mergeableCount: number;
}) {
  if (alreadyMember) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="font-accent text-[15px] italic text-cream/60">
          You&rsquo;re already in this vault.
        </p>
        <Link href="/collection" className="btn-gold">
          Open your vaults
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <JoinForm
        token={token}
        merge={false}
        label={mergeableCount > 0 ? "Join and keep my vault" : "Join vault"}
        primary
      />
      {mergeableCount > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <JoinForm
            token={token}
            merge
            label={`Join and merge my ${mergeableCount} record${mergeableCount === 1 ? "" : "s"}`}
          />
          <p className="font-body text-[10px] leading-[1.5] text-cream/45">
            Merging moves your records into the shared vault and deletes your
            personal one — it can&rsquo;t be undone.
          </p>
        </div>
      )}
    </div>
  );
}

function JoinForm({
  token,
  merge,
  label,
  primary = false,
}: {
  token: string;
  merge: boolean;
  label: string;
  primary?: boolean;
}) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, null);

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="merge" value={merge ? "true" : "false"} />
      <button
        type="submit"
        disabled={pending}
        className={primary ? "btn-gold" : "btn-ghost px-5 py-3"}
      >
        {pending ? "Joining…" : label}
      </button>
      {state?.error && (
        <span className="font-body text-[11px] text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}
