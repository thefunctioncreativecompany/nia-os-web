"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// A small (i) button that opens a note (Ika, 2026-10-22): for sources and credits too long to sit
// under every row, such as where Explore's posters and creators' films come from.
export function InfoNote({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} className={cn("rounded-full text-muted-foreground hover:text-foreground", className)}>
          <Info aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-small leading-relaxed text-muted-foreground">
        {children}
      </PopoverContent>
    </Popover>
  );
}
