import Link from "next/link";
import { Monitor } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// What phones and tablets see instead of the Timeline (Ika, 2026-11-02): it's a desktop view.
export function TimelineLocked({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[calc(100svh-var(--nav-h)-7rem)] flex-col items-center justify-center gap-4 px-6 text-center lg:min-h-[calc(100svh-var(--nav-h))]", className)}>
      <Monitor aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-h3 font-semibold text-foreground">The timeline is on desktop</h1>
      <p className="max-w-md text-sm text-muted-foreground">Open Explore all on a computer to move through time. Here, the canvas has every title.</p>
      <Button asChild variant="outline">
        <Link href="/explore/all">Open the canvas</Link>
      </Button>
    </div>
  );
}
