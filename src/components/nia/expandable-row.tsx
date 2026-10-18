"use client";

import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";

// A table row that opens to show details underneath (design system Section 18.4).
// Put the row's cells in `cells`; the first cell gets the open/close button.
export function ExpandableRow({
  label,
  cells,
  colSpan,
  defaultOpen = false,
  children,
}: {
  // What the button announces, e.g. "Scene 04 details".
  label: string;
  cells: React.ReactNode[];
  colSpan: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <>
      <TableRow className={cn(open && "border-b-0")}>
        <TableCell className="w-10 pr-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            aria-label={label}
            onClick={() => setOpen((o) => !o)}
            className="flex size-6 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronRight aria-hidden className={cn("size-4 transition-transform duration-fast", open && "rotate-90")} />
          </button>
        </TableCell>
        {cells.map((cell, i) => (
          <TableCell key={i}>{cell}</TableCell>
        ))}
      </TableRow>
      <TableRow id={id} hidden={!open} className="hover:bg-transparent">
        <TableCell colSpan={colSpan} className="bg-nia-panel px-5 py-3.5 text-small whitespace-normal text-muted-foreground">
          {children}
        </TableCell>
      </TableRow>
    </>
  );
}
