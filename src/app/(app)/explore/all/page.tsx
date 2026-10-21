import type { Metadata } from "next";

import { LibraryCanvas } from "@/components/explore/library-canvas";

export const metadata: Metadata = {
  title: "Explore all · Nia OS",
};

// "Explore all" on Explore: the whole library on one canvas (Ika, 2026-10-21).
export default function Page() {
  return <LibraryCanvas />;
}
