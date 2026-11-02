import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { TimelineView } from "@/components/explore/timeline/timeline-view";
import { PRESETS, boundsFor, centredOn } from "@/features/explore/timeline/scale";
import { timelineItems } from "@/features/explore/timeline/data";

export const metadata: Metadata = {
  title: "Explore all · Timeline · Nia OS",
};

// Explore all as a timeline (Ika, 2026-11-02; design-ref EXPLORE_TIMELINE_SPEC.md). Not linked
// yet: the Canvas · Timeline · Colour switch comes with step D.
export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-[calc(100svh-7rem)] rounded-2xl md:mx-6" />}>
      <Timeline />
    </Suspense>
  );
}

const clock = () => Date.now();

async function Timeline() {
  // Opens on the year around today; Fit shows the whole library.
  await connection();
  const now = clock();
  const items = timelineItems();
  const bounds = boundsFor(items.map((i) => i.at), now);
  const year = PRESETS.find((p) => p.id === "year")!.span;
  return <TimelineView dots={items.map(({ id, at }) => ({ id, at }))} bounds={bounds} initial={centredOn(now - year / 3, year, bounds)} now={now} />;
}
