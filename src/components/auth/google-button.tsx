"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Signs in with Google through Supabase. Google sends the user back to
// /auth/confirm, which finishes signing in and forwards them on.
export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
      "/dashboard",
    );
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
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
      className="h-11 w-full gap-2 rounded-full border-nia-line bg-white px-6 text-sm leading-[1.4] font-bold text-nia-ink hover:bg-neutral-50 hover:text-nia-ink"
    >
      <Image src="/auth/google.svg" alt="" width={16} height={16} />
      {isLoading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
