import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Best of 2026 · Explore · Nia OS",
};

// View all for Best of 2026 (Ika, 2026-11-14): the year's top 20 on Explore, in rank order
// (scripts/build-best-of-2026.mjs); the same page as the other categories' View all.
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
  return <MadeInAfricaAll seed={newSeed()} category="best-of-2026" />;
}
