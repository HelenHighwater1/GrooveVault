"use client";

import { useActionState, useState } from "react";
import { leaveVaultAction, removeMemberAction } from "./actions";

export type MemberView = {
  userId: string;
  role: "owner" | "member" | "viewer";
  label: string;
};

export function MembersPanel({
  collectionId,
  members,
  me,
}: {
  collectionId: string;
  members: MemberView[];
  me: string;
}) {
  const mine = members.find((m) => m.userId === me);
  const soleOwner =
    mine?.role === "owner" &&
    members.filter((m) => m.role === "owner").length === 1;
  // A sole owner of a shared vault must name a successor to leave; a sole
  // member can't leave at all (the vault would be orphaned).
  const needsSuccessor = soleOwner && members.length > 1;
  const canLeave = !(soleOwner && members.length === 1);

  return (
    <ul className="flex flex-col">
      {members.map((m) => (
        <li
          key={m.userId}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 py-3 last:border-b-0"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate font-body text-[13px] text-cream">
              {m.label}
              {m.userId === me ? " (you)" : ""}
            </span>
            <span className="font-body text-[9px] uppercase tracking-[.22em] text-cream/45">
              {m.role}
            </span>
          </div>
          {m.userId === me
            ? canLeave && (
                <LeaveVaultButton
                  collectionId={collectionId}
                  successors={
                    needsSuccessor ? members.filter((s) => s.userId !== me) : []
                  }
                />
              )
            : mine?.role === "owner" &&
              m.role !== "owner" && (
                <RemoveMemberButton
                  collectionId={collectionId}
                  userId={m.userId}
                />
              )}
        </li>
      ))}
    </ul>
  );
}

function RemoveMemberButton({
  collectionId,
  userId,
}: {
  collectionId: string;
  userId: string;
}) {
  const [state, formAction, pending] = useActionState(removeMemberAction, null);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="collection_id" value={collectionId} />
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost px-3.5 py-1.5 text-[10px]"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state?.error && (
        <span className="font-body text-[11px] text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}

function LeaveVaultButton({
  collectionId,
  successors,
}: {
  collectionId: string;
  successors: MemberView[];
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(leaveVaultAction, null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn-ghost px-3.5 py-1.5 text-[10px]"
      >
        Leave vault
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="collection_id" value={collectionId} />
      {successors.length > 0 && (
        <select
          name="successor_id"
          required
          defaultValue=""
          aria-label="New owner"
          className="deco-input max-w-48 px-3 py-1.5"
        >
          <option value="" disabled>
            Hand the vault to…
          </option>
          {successors.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost px-3.5 py-1.5 text-[10px]"
      >
        {pending ? "Leaving…" : "Confirm leave"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="font-body text-[10px] uppercase tracking-[.2em] text-cream/50 hover:text-cream"
      >
        Cancel
      </button>
      {state?.error && (
        <span className="font-body text-[11px] text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}
