import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { TimelineView } from "@/components/explore/timeline/timeline-view";
import { PRESETS, boundsFor, centredOn, clampView } from "@/features/explore/timeline/scale";
import { mockItems, timelineItems } from "@/features/explore/timeline/data";
import { TimelineLocked } from "@/components/explore/timeline/timeline-locked";

export const metadata: Metadata = {
  title: "Explore all · Timeline · Nia OS",
};

// Explore all as a timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md): a desktop
// view, open to everyone in the beta (Ika, 2026-11-08); phones and tablets get a short note instead.
// The address holds the view (`?from=1972-01-01&to=1980-01-01&focus=t:the-godfather`), so it can
// be shared.
export default function Page({ searchParams }: PageProps<"/explore/all/timeline">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-[calc(100svh-7rem)] rounded-2xl md:mx-6" />}>
      <Timeline searchParams={searchParams} />
    </Suspense>
  );
}

const clock = () => Date.now();
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const parse = (v?: string) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v)) return null;
  const t = Date.parse(v.length === 10 ? `${v}T00:00Z` : `${v}Z`);
  return Number.isFinite(t) ? t : null;
};

async function Timeline({ searchParams }: Pick<PageProps<"/explore/all/timeline">, "searchParams">) {
  await connection();
  const now = clock();
  const q = await searchParams;
  // `?mock=5000` (development only): made-up titles, to check the timeline stays smooth.
  const mock = process.env.NODE_ENV !== "production" ? Number(one(q.mock)) || 0 : 0;
  const items = mock ? mockItems(mock) : timelineItems();
  const bounds = boundsFor(items.map((i) => i.at), now);
  const [from, to] = [parse(one(q.from)), parse(one(q.to))];
  const year = PRESETS.find((p) => p.id === "year")!.span;
  // Opens on the year around today unless the address says otherwise; Fit shows everything.
  const initial = from !== null && to !== null && to > from ? clampView({ start: from, end: to }, bounds) : centredOn(now - year / 3, year, bounds);
  return (
    <>
      <TimelineLocked className="lg:hidden" />
      <div className="max-lg:hidden">
        <TimelineView
          items={items.map(({ precision: _p, ...it }) => it)}
          bounds={bounds}
          initial={initial}
          now={now}
          initialFocus={one(q.focus) ?? null}
        />
      </div>
    </>
  );
}
