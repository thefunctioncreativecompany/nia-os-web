import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ExploreLibrary } from "@/components/explore/explore-library";
import { newSeed } from "@/lib/shuffle";
import { galleryForToday } from "@/features/explore/recent";
import { loadTopTen } from "@/features/explore/top-server";
import { studioRows } from "@/features/explore/studios";

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
  // The top gallery's recent additions (seven days, or the latest 20) are worked out per request
  // too. The Top 10 is read without waiting: only its own section waits for it.
  return <ExploreLibrary seed={newSeed()} gallery={galleryForToday()} top={loadTopTen()} studios={studioRows()} />;
}
