"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { exploreItem } from "@/features/explore/items";

// Top 10 on Explore (Ika, 2026-10-31; src/features/explore/top.ts): what people on Nia open, save
// and add to projects most, ranked again on every visit. A ranked list like the old director's
// notes, each row opening the title's page.
export function TopTen({ top }: { top: Promise<string[]> }) {
  const items = use(top).flatMap((slug) => {
    const item = exploreItem(slug);
    return item ? [item] : [];
  });

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.slug}>
          <Link
            href={item.href()}
            className="group/row flex min-h-18 items-center gap-4 border-b border-secondary px-2 py-3 text-foreground outline-none transition-colors duration-base ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span className="w-10 shrink-0 text-h3 leading-none font-bold tabular-nums md:w-14 md:text-h1">{i + 1}</span>
            <span
              className={cn("relative h-16 shrink-0 overflow-hidden rounded-md", item.image ? "bg-muted" : item.grain)}
              style={{ aspectRatio: item.aspect ?? 2 / 3 }}
            >
              {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-lead font-semibold tracking-tight transition-transform duration-glide ease-glide group-hover/row:translate-x-1.5 motion-reduce:translate-x-0! md:text-h3">
                {item.title}
              </span>
              <span className="truncate text-small text-muted-foreground">{[item.credit, item.meta].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-small font-semibold opacity-0 transition-opacity duration-base ease-out group-hover/row:opacity-100 group-focus-visible/row:opacity-100 max-md:hidden">
              Open
              <ArrowRight aria-hidden className="size-3.25" strokeWidth={2} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
