import type { Metadata } from "next";

import { LibraryQuickView } from "@/components/explore/library-quick-view";

export const metadata: Metadata = {
  title: "Explore all · Nia OS",
};

// Explore all's quick view: one title at a time, swiped left and right (Ika, 2026-10-30).
export default function Page() {
  return <LibraryQuickView />;
}
