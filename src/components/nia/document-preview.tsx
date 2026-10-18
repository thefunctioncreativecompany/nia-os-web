"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Maximize, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ZOOMS = [50, 75, 100, 125, 150, 200];

// A paged document on a grey desk with zoom, page and full-screen controls (design
// system Section 25.1). `renderPage` draws one page at 100%; zoom scales it.
export function DocumentPreview({
  pages,
  renderPage,
  label,
  className,
}: {
  pages: number;
  renderPage: (page: number) => React.ReactNode;
  label: string;
  className?: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const zoomIndex = ZOOMS.indexOf(zoom);

  return (
    <section aria-label={label} className={cn("flex flex-col gap-3", className)}>
      <div className="h-96 overflow-auto rounded-xl border border-border bg-nia-panel p-6">
        <div
          aria-live="polite"
          className="mx-auto aspect-[1/1.29] w-full max-w-sm origin-top bg-white p-6 shadow-elevation-2 transition-transform duration-base"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <span className="sr-only">Page {page} of {pages}.</span>
          {renderPage(page)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={zoomIndex <= 0} onClick={() => setZoom(ZOOMS[zoomIndex - 1])}><Minus /></Button>
          <span className="w-11 text-center text-small font-bold">{zoom}%</span>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={zoomIndex >= ZOOMS.length - 1} onClick={() => setZoom(ZOOMS[zoomIndex + 1])}><Plus /></Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ArrowLeft /></Button>
          <span className="text-small whitespace-nowrap text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ArrowRight /></Button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Full screen"
          onClick={(e) => e.currentTarget.closest("section")?.requestFullscreen?.()}
        >
          <Maximize />
        </Button>
      </div>
    </section>
  );
}
