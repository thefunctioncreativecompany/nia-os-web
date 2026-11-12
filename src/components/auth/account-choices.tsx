"use client";

import { PersonPicture } from "@/components/nia/cast-crew-row";
import type { SavedAccount } from "@/lib/accounts";

// "Continue as" on the login page (Ika, 2026-11-11): the accounts already used on this device, each
// one tap to sign back in without a password (src/lib/accounts.ts).
export function AccountChoices({ accounts, disabled, onPick }: { accounts: SavedAccount[]; disabled?: boolean; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {accounts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(a.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            >
              <PersonPicture name={a.name || a.email} photo={a.avatar} className="size-10 [&_span]:text-small" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-nia-ink">{a.name || a.email}</span>
                {a.name && a.name !== a.email && <span className="truncate text-caption text-nia-ink-muted">{a.email}</span>}
              </span>
              <span className="text-small font-semibold text-nia-ink">Continue</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 text-caption text-nia-ink-muted">
        <span className="h-px flex-1 bg-border" />
        or log in to another account
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
