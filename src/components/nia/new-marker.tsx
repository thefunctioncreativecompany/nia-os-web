import { cn } from "@/lib/utils";

// The gold "New" marker for something just added (Ika, 2026-10-28: new templates first). Gold is
// the dot and a tint behind dark text, since gold text is too faint on white.
export function NewMarker({ label = "New", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-micro font-semibold text-foreground", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-gold" />
      {label}
    </span>
  );
}

/** "28 October" for a YYYY-MM-DD day, the same on the server and in the browser. */
export const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
