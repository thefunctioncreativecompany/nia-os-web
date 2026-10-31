import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ExploreFeed } from "@/components/explore/explore-feed";
import { feedNow } from "@/features/explore/feed";

export const metadata: Metadata = {
  title: "Feed · Explore · Nia OS",
};

// Explore's feed (Ika, 2026-10-31). Behind Explore's early access like every Explore page.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Today />
    </Suspense>
  );
}

// Fresh news ranks first, so the stories are ranked against the time of this request.
async function Today() {
  await connection();
  return <ExploreFeed now={feedNow()} />;
}
