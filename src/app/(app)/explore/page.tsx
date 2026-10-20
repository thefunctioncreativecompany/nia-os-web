import type { Metadata } from "next";

import { ExploreComingSoon } from "@/components/explore/explore-coming-soon";
import { ExploreLibrary } from "@/components/explore/explore-library";
import { features } from "@/lib/features";

export const metadata: Metadata = {
  title: "Explore · Nia OS",
};

// The Explore tab always lands here; the switch in src/lib/features.ts picks the screen.
// Explore opens February 2027; until then, the coming-soon screen (Ika's design, 2026-10-19).
export default function Page() {
  return features.exploreUnlocked ? <ExploreLibrary /> : <ExploreComingSoon />;
}
