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
      "/home",
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
      className="w-full"
    >
      <Image src="/auth/google.svg" alt="" width={16} height={16} />
      {isLoading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
