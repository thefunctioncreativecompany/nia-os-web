"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// A panel docked on the right of the page on computers (A/B, Ika 2026-11-14: "a right panel open
// for artifacts/documents/template preview", after Claude's artifacts panel; used by template and
// project previews). The page beside it leaves room (`lg:in-data-[preview-panel=open]:pr-(--preview-panel-w)`
// on its wrapper), so the list stays in reach and another item swaps in. Escape closes it; Expand
// fills the page below the top bar. Phones and tablets keep their own pop-up or page.
export function SidePanel({
  label,
  onClose,
  tools,
  onKeyDown,
  children,
}: {
  label: string;
  onClose: () => void;
  tools?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}) {
  const [wide, setWide] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.previewPanel = "open";
    panel.current?.focus({ preventScroll: true });
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEscape);
    return () => {
      delete root.dataset.previewPanel;
      window.removeEventListener("keydown", onEscape);
    };
  }, [onClose]);

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "fixed top-(--nav-h) right-0 bottom-0 z-30 flex flex-col border-l border-border bg-background outline-none",
        "animate-in duration-base ease-out fade-in-0 slide-in-from-right-10 motion-reduce:animate-none",
        wide ? "left-0" : "w-(--preview-panel-w)",
      )}
    >
      <div className="flex items-center gap-1 border-b border-border px-3.5 py-3">
        <Button variant="ghost" size="icon-sm" onClick={() => setWide((w) => !w)} aria-label={wide ? "Shrink" : "Expand"}>
          {wide ? <Minimize2 /> : <Maximize2 />}
        </Button>
        {tools && <span aria-hidden className="mx-1.5 h-4.5 w-px bg-border" />}
        {tools}
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>
      {children}
    </aside>
  );
}

// Previous / next within the list the panel was opened from.
export function PrevNext<T extends { name: string }>({ prev, next, onNavigate }: { prev: T | null; next: T | null; onNavigate: (item: T) => void }) {
  return (
    <>
      <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label={prev ? `Previous: ${prev.name}` : "Previous"}>
        <ChevronLeft />
      </Button>
      <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => next && onNavigate(next)} aria-label={next ? `Next: ${next.name}` : "Next"}>
        <ChevronRight />
      </Button>
    </>
  );
}
