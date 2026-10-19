"use client";

import { useState } from "react";
import { FileImage, FileText, FileVideo, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Asset = { id: string; name: string; size: string; kind: "image" | "video" | "document" };

const ICONS: Record<Asset["kind"], LucideIcon> = { image: FileImage, video: FileVideo, document: FileText };

// A project's files, as tiles or a list (design system Section 17.4).
export function AssetLibrary({ assets, className }: { assets: Asset[]; className?: string }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const tab = (value: "grid" | "list", text: string) => (
    <button
      type="button"
      aria-pressed={view === value}
      onClick={() => setView(value)}
      className={cn(
        "rounded-md px-2 py-1 text-small outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        view === value ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {text}
    </button>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-micro font-bold text-muted-foreground">Files ({assets.length})</span>
        <div role="group" aria-label="View" className="flex gap-1">
          {tab("grid", "Grid")}
          {tab("list", "List")}
        </div>
      </div>
      <ul className={view === "grid" ? "grid gap-2.5 sm:grid-cols-2" : "flex flex-col divide-y divide-border rounded-xl border border-border bg-white"}>
        {assets.map((asset) => {
          const Icon = ICONS[asset.kind];
          return (
            <li
              key={asset.id}
              className={cn("flex min-w-0 items-center gap-3", view === "grid" ? "rounded-xl border border-border bg-white p-3.5" : "px-3.5 py-2.5")}
            >
              <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-small font-bold text-foreground">{asset.name}</span>
                <span className="text-tiny text-muted-foreground">{asset.size}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
