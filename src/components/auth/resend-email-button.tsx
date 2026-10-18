"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export type EmailLinkType = "signup" | "recovery";

// Sends the confirmation or password-reset email again.
export function ResendEmailButton({
  email,
  type,
}: {
  email: string | null;
  type: EmailLinkType;
}) {
  const [isSending, setIsSending] = useState(false);

  const resend = async () => {
    if (!email) return;
    const supabase = createClient();
    const origin = window.location.origin;
    setIsSending(true);

    const { error } =
      type === "signup"
        ? await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: `${origin}/auth/confirm?next=/dashboard` },
          })
        : await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/confirm?next=/reset-password`,
          });

    setIsSending(false);
    if (error) toast.error(error.message);
    else toast.success("Email sent. Check your inbox.");
  };

  return (
    <button
      type="button"
      onClick={resend}
      disabled={!email || isSending}
      className="font-bold text-nia-ink underline disabled:opacity-50"
    >
      {isSending ? "Sending..." : "Resend"}
    </button>
  );
}
