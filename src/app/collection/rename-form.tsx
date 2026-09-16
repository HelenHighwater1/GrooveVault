"use client";

import { useActionState } from "react";
import { renameCollectionAction } from "./actions";

export function RenameCollectionForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(
    renameCollectionAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="name"
          defaultValue={currentName}
          required
          maxLength={60}
          aria-label="Collection name"
          className="rounded-md border border-black/20 bg-transparent px-3 py-1.5 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Saving…" : "Rename"}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
