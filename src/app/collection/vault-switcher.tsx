"use client";

import { useTransition } from "react";
import { switchVaultAction } from "./actions";

export type VaultOption = {
  id: string;
  name: string;
  role: string;
};

export function VaultSwitcher({
  vaults,
  activeId,
}: {
  vaults: VaultOption[];
  activeId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3">
      <span className="font-body text-[10px] uppercase tracking-[.24em] text-cream/50">
        Vault
      </span>
      <select
        key={activeId}
        defaultValue={activeId}
        disabled={pending}
        aria-label="Switch vault"
        onChange={(e) =>
          startTransition(() => switchVaultAction(e.target.value))
        }
        className="deco-input max-w-56 px-3 py-2"
      >
        {vaults.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
            {v.role === "member" ? " (shared)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
