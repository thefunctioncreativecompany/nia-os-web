import type { Metadata } from "next";

import { StudiosAll } from "@/components/explore/studios-all";
import { studioRows } from "@/features/explore/studios";

export const metadata: Metadata = {
  title: "Studios · Explore · Nia OS",
};

// View all for By studio (Ika, 2026-11-11): every studio with a title on Explore. Known ahead of
// time, so it's drawn once at build.
export default function Page() {
  return <StudiosAll rows={studioRows()} />;
}
