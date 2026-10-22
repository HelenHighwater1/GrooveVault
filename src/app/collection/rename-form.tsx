"use client";

import { useActionState } from "react";
import { renameCollectionAction } from "./actions";

export function RenameCollectionForm({
  collectionId,
  currentName,
}: {
  collectionId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState(
    renameCollectionAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="collection_id" value={collectionId} />
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          name="name"
          defaultValue={currentName}
          required
          maxLength={60}
          aria-label="Collection name"
          className="deco-input w-56 px-3.5 py-2.5"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-ghost px-4 py-2.5"
        >
          {pending ? "Saving…" : "Rename"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
