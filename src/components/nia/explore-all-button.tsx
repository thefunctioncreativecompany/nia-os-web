"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoaderPinwheel } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// A small round button in the bottom-left corner that opens Explore all from anywhere (Ika,
// 2026-11-02), opposite Send feedback. Desktop only for now; hidden on Explore all itself.
export function ExploreAllButton() {
  const path = usePathname();
  if (path.startsWith("/explore/all")) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/explore/all"
          aria-label="Explore all"
          className="fixed bottom-6 left-6 z-40 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-elevation-2 outline-none transition-transform duration-fast hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:hidden print:hidden"
        >
          <LoaderPinwheel aria-hidden className="size-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">Explore all</TooltipContent>
    </Tooltip>
  );
}
