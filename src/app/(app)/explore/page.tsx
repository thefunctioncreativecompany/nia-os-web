import type { Metadata } from "next";

import { ExploreSoon } from "@/components/explore/explore-soon";

export const metadata: Metadata = {
  title: "Explore · Nia OS",
};

// Explore opens February 2027; until then, the coming-soon screen (Ika's design, 2026-10-19).
export default function Page() {
  return <ExploreSoon />;
}
