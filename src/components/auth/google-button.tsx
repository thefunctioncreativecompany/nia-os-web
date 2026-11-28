"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { START_PAGE } from "@/lib/start-page";

// Signs in with Google through Supabase. Google sends the user back to
// /auth/confirm, which finishes signing in and forwards them on.
export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
      START_PAGE,
    );
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        // Always show Google's account chooser (2026-11-28): without it Google quietly reuses the
        // Google account this browser is already signed in to, so "Add another account" or a
        // second person on the same computer landed back in the first account.
        queryParams: { prompt: "select_account" },
      },
    });
    // On success the browser is already leaving for Google.
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signIn}
      disabled={isLoading}
      className="w-full"
    >
      <Image src="/auth/google.svg" alt="" width={16} height={16} />
      {isLoading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
