import type { Metadata } from "next";
import { connection } from "next/server";

import { ExploreLibrary } from "@/components/explore/explore-library";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Explore · Nia OS",
};

// The Explore tab. People without early access see the coming-soon screen instead (layout.tsx).
// Its rows come in a new order on each visit (Ika, 2026-10-22).
export default async function Page() {
  await connection();
  return <ExploreLibrary seed={newSeed()} />;
}
