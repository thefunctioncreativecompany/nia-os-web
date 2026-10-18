import { cn } from "@/lib/utils";

// Three pulsing dots while something short loads (design system Section 14.4). The pulse
// is the only looping motion allowed, because it tells people work is still happening;
// it stops for people who ask for reduced motion.
export function LoadingDots({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
