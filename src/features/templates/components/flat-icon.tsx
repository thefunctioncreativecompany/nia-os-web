import { createElement } from "react";
import type { LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";
import { iconFor } from "@/features/templates/gallery";

// A template's thumbnail: one black line icon on white (TEMPLATE_THUMBNAILS.md Section 0).
// Thinner strokes at large sizes so big icons stay as light as small ones.
export function FlatIcon({ name, size = "md", className, ...props }: LucideProps & { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const look = {
    sm: "size-6 stroke-[1.6]",
    md: "size-13 stroke-[1.35]",
    lg: "size-30 stroke-[1.1]",
    xl: "size-37.5 stroke-[1.1]",
  }[size];
  return createElement(iconFor(name), { "aria-hidden": true, className: cn("text-foreground", look, className), ...props });
}
