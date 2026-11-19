import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Holiday classics · Explore · Nia OS",
};

// View all for Holiday classics (Ika, 2026-11-11): Christmas films and holiday specials, by
// collection; the same page as the other categories' View all, in a new order on each visit.
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
  return <MadeInAfricaAll seed={newSeed()} category="holiday-classics" />;
}
