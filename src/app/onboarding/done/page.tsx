import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "You're all set · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="done">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-9 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-nia-positive drop-shadow-[0_4px_6px_rgba(0,0,0,0.08)]">
          <Check aria-hidden className="size-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold text-foreground">You&apos;re all set!</h1>
          <p className="text-sm leading-normal text-muted-foreground">
            Your workspace is ready. Start creating amazing productions.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/home">Go to Dashboard</Link>
          </Button>
          {/* Templates aren't built yet. */}
          <Button
            type="button"
            variant="outline"
            disabled
            className="w-full"
          >
            Explore templates · Coming soon
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
