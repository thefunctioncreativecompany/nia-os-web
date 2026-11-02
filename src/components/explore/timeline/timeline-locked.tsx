import Link from "next/link";
import { Monitor } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// What the Timeline shows instead of itself (Ika, 2026-11-02): it's a desktop view on paid plans.
export function TimelineLocked({ reason, className }: { reason: "plan" | "screen"; className?: string }) {
  const copy =
    reason === "plan"
      ? { title: "The timeline comes with paid plans", body: "See Explore through time, from a century down to a single day, with the eras of film history behind it." }
      : { title: "The timeline is on desktop", body: "Open Explore all on a computer to move through time. Here, the canvas has every title." };
  return (
    <div className={cn("flex min-h-[calc(100svh-12rem)] flex-col items-center justify-center gap-4 px-6 text-center lg:min-h-[calc(100svh-5rem)]", className)}>
      <Monitor aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-h3 font-semibold text-foreground">{copy.title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{copy.body}</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        {reason === "plan" && (
          <Button asChild>
            <Link href="/plans">See plans</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/explore/all">Open the canvas</Link>
        </Button>
      </div>
    </div>
  );
}
