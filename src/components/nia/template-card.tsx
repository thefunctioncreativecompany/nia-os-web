import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// A document template: icon in a white circle above its name. `default` is the large card
// in the template library (Figma 931:11); `compact` is the small one on Home (1021:800).
// Without `href` it's shown as not yet available.
export function TemplateCard({
  href,
  name,
  icon: Icon,
  size = "default",
  className,
}: {
  href?: string;
  name: string;
  icon: LucideIcon;
  size?: "default" | "compact";
  className?: string;
}) {
  const compact = size === "compact";
  const classes = cn(
    "flex min-w-0 flex-col items-center justify-center border border-border bg-muted text-center text-foreground outline-none transition-colors duration-fast",
    href ? "hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" : "cursor-default",
    compact ? "gap-2 rounded-xl p-3" : "gap-4 rounded-[39px] p-6 shadow-elevation-2",
    className,
  );
  const content = (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-white",
          compact ? "size-8" : "size-[72px]",
        )}
      >
        <Icon aria-hidden className={compact ? "size-[18px]" : "size-[29px]"} />
      </span>
      <span
        className={cn(
          "w-full truncate",
          compact ? "text-tiny font-semibold" : "text-lead font-medium",
        )}
      >
        {name}
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div aria-disabled="true" className={classes}>
      {content}
    </div>
  );
}
