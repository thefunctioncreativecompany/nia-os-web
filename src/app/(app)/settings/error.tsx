"use client";

import { Button } from "@/components/ui/button";

// Shown when a settings tab can't load its data (e.g. the database isn't set up).
export default function SettingsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-border p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base leading-normal font-bold text-foreground">
          We couldn&apos;t load these settings
        </h2>
        <p className="text-[13px] leading-normal text-muted-foreground">{error.message}</p>
      </div>
      <Button
        type="button"
        onClick={retry}
        className="h-auto rounded-full px-6 py-2.5 text-sm font-bold"
      >
        Try again
      </Button>
    </div>
  );
}
