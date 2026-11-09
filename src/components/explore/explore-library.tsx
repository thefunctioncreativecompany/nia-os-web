"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { LIBRARY_HREF } from "@/features/explore/made-in-africa";
import { CategorySections } from "./explore-categories";
import type { StudioRow } from "@/features/explore/studios";
import { TopTen } from "./top-ten";

// Explore, the library: Ika's Claude Design "ExploreLibrary" as designed (layout, motion, images),
// in the platform's font, colours, buttons and sentence case. Drawn from explore-data.ts. The
// rows under By category come in a new order on each visit (`seed`, Ika 2026-10-22).
// Recently added was removed for now (Ika, 2026-11-08; git tag parked-2026-11-08-recently-added).
export function ExploreLibrary({ seed, top, studios }: { seed: number; top: Promise<string[]>; studios: StudioRow[] }) {
  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      {/* Opens the whole library as one canvas (Ika, 2026-10-21). */}
      <h1 id="explore-all" className="text-h2 font-semibold tracking-tight text-foreground">
        <Link
          href={LIBRARY_HREF}
          className="group inline-flex items-center gap-3.5 rounded-md outline-none hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Explore all
          <ChevronRight aria-hidden className="size-5.5 transition-transform duration-fast ease-out group-hover:translate-x-1 motion-reduce:translate-x-0!" strokeWidth={2} />
        </Link>
      </h1>

      {/* Top 10 first, then what's new (Ika, 2026-11-08). Headings carry no count or explaining
          line (Ika, 2026-10-30). */}
      <section aria-labelledby="top-ten" className="mt-7">
        <h2 id="top-ten" className="text-subtitle font-semibold text-foreground">
          Top 10 on Explore
        </h2>
        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <TopTen top={top} />
          </Suspense>
        </div>
      </section>

      {/* Every category under a heading that shows or hides it (Ika, 2026-10-29). */}
      <CategorySections seed={seed} studios={studios} />
    </div>
  );
}
