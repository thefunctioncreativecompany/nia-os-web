import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Greatest TV · Explore · Nia OS",
};

// View all for Greatest TV (2026-11-08): every series, by collection; the same page as Made in
// Africa's and Hollywood Classics' View all, in a new order on each visit.
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
  return <MadeInAfricaAll seed={newSeed()} category="greatest-tv" />;
}
