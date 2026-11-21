import type { Metadata } from "next";

import { RecentAll } from "@/components/explore/recent-all";
import { addedLabel, everyAddition } from "@/features/explore/recent";

export const metadata: Metadata = {
  title: "Recently added · Explore · Nia OS",
};

// View all from Recently added on Explore (Ika, 2026-11-21): everything that has joined Explore,
// newest first, each with the day it was added. Known ahead of time, so drawn once at build.
export default function Page() {
  return <RecentAll entries={everyAddition().map(({ slug, added }) => ({ slug, note: `Added ${addedLabel(added)}` }))} />;
}
