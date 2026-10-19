"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/auth/auth-input";
import type { EmailLinkType } from "@/components/auth/resend-email-button";

// The code from the confirmation or reset email, typed in here. Works on any device,
// unlike the link, which must open in the browser that asked for it.
export function VerifyCodeForm({ email, type }: { email: string; type: EmailLinkType }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.verifyOtp({
      email,
      token: code.trim(),
      type: type === "signup" ? "email" : "recovery",
    });
    if (error) {
      setError("That code didn't work. Check it, or send a new email.");
      setBusy(false);
      return;
    }
    router.push(type === "signup" ? "/home" : "/reset-password");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      <AuthInput
        id="code"
        label="Enter the code from the email"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "code-error" : undefined}
        className="text-center tracking-[0.3em] placeholder:tracking-normal"
      />
      {error && (
        <p id="code-error" role="alert" className="text-small text-nia-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="outline" className="w-full" disabled={busy || code.length < 6}>
        {busy ? "Checking…" : "Continue with code"}
      </Button>
    </form>
  );
}
