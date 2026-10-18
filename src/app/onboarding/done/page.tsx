import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authButtonClassName } from "@/components/auth/auth-primitives";

export const metadata: Metadata = {
  title: "You're all set · Nia OS",
};

export default function Page() {
  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-9 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-nia-positive drop-shadow-[0_4px_6px_rgba(0,0,0,0.08)]">
        <Check aria-hidden className="size-7 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-[1.3] font-bold text-foreground">You&apos;re all set!</h1>
        <p className="text-sm leading-normal text-muted-foreground">
          Your workspace is ready. Start creating amazing productions.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Button asChild className={authButtonClassName}>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        {/* Templates aren't built yet. */}
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-11 w-full rounded-full border-border bg-white text-sm leading-[1.4] font-bold text-foreground"
        >
          Explore templates · Coming soon
        </Button>
      </div>
    </div>
  );
}
