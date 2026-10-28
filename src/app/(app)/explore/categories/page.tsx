import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ExploreCategories } from "@/components/explore/explore-categories";
import { recentlyAddedToday } from "@/features/explore/recent";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "By category · Explore · Nia OS",
};

// Every Explore category on one page, from "By category ›" on Explore. Rows come in a new order on
// each visit, like Explore, so the order is picked per request inside a boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Shuffled />
    </Suspense>
  );
}

async function Shuffled() {
  await connection();
  return <ExploreCategories seed={newSeed()} recent={recentlyAddedToday()} />;
}
