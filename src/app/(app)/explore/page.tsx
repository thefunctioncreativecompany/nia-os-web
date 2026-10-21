import type { Metadata } from "next";

import { ExploreLibrary } from "@/components/explore/explore-library";

export const metadata: Metadata = {
  title: "Explore · Nia OS",
};

// The Explore tab. People without early access see the coming-soon screen instead (layout.tsx).
export default function Page() {
  return <ExploreLibrary />;
}
