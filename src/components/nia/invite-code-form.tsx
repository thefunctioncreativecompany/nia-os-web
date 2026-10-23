"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemCode, type CodeArea } from "@/lib/invite-codes";

// "Have an invite code?" on a coming-soon card: Explore's (Ika, 2026-10-21; a right code unlocks
// Explore, collections and project references) and Marketplace's (2026-10-22; the store). The
// page opens straight away for this account.
export function InviteCodeForm({ area, unlocked }: { area: CodeArea; /** The toast on a right code. */ unlocked: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setProblem(null);
    const result = await redeemCode(createClient(), area, code);
    setBusy(false);
    if (result === "unlocked") {
      toast.success(unlocked);
      router.refresh();
    } else if (result === "wrong") {
      setProblem("That code didn't work. Check it and try again.");
    } else {
      setProblem(result.error);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex w-full flex-col items-center gap-2 border-t border-border pt-3 sm:pt-4">
      <label htmlFor="invite-code" className="text-small font-semibold text-foreground">
        Have an invite code?
      </label>
      <div className="flex w-full max-w-80 gap-2">
        <Input
          id="invite-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!problem || undefined}
          aria-describedby={problem ? "invite-code-problem" : undefined}
          maxLength={40}
          className="h-10 uppercase placeholder:normal-case"
        />
        <Button type="submit" size="md" disabled={busy || !code.trim()}>
          {busy ? "Checking…" : "Unlock"}
        </Button>
      </div>
      {problem && (
        <p id="invite-code-problem" role="alert" className="text-caption text-destructive">
          {problem}
        </p>
      )}
    </form>
  );
}
