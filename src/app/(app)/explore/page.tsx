import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ExploreLibrary } from "@/components/explore/explore-library";
import { newSeed } from "@/lib/shuffle";
import { recentlyAddedToday } from "@/features/explore/recent";

export const metadata: Metadata = {
  title: "Explore · Nia OS",
};

// The Explore tab. People without early access see the coming-soon screen instead (layout.tsx).
// Its rows come in a new order on each visit (Ika, 2026-10-22).
// The order is picked per request, inside a boundary so the rest of the page isn't held up.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Shuffled />
    </Suspense>
  );
}

async function Shuffled() {
  await connection();
  // What's still in "Recently added on Explore" (seven days) is worked out per request too.
  return <ExploreLibrary seed={newSeed()} recent={recentlyAddedToday()} />;
}
