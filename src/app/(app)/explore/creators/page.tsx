import type { Metadata } from "next";
import { connection } from "next/server";

import { CreatorsAll } from "@/components/explore/creators-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Creators · Explore · Nia OS",
};

// View all from Explore's Creators row: every creator's film, with search, in a new order on each
// visit (Ika, 2026-10-22).
export default async function Page() {
  await connection();
  return <CreatorsAll seed={newSeed()} />;
}
