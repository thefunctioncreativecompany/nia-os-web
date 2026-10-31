import { cn } from "@/lib/utils";

// The "New" marker for something just added (Ika, 2026-10-28: new templates first): a Nia Blue
// dot and a blue tint behind the text.
export function NewMarker({ label = "New", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-nia-blue/50 bg-nia-blue/15 px-2.5 py-0.5 text-micro font-semibold text-foreground", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-nia-blue" />
      {label}
    </span>
  );
}

/** "28 October" for a YYYY-MM-DD day, the same on the server and in the browser. */
export const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
