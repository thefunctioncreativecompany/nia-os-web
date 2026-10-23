import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Made in Africa · Explore · Nia OS",
};

// View all from Explore's Made in Africa filmstrip: every title, by collection, in a new order
// on each visit (Ika, 2026-10-22).
export default async function Page() {
  await connection();
  return <MadeInAfricaAll seed={newSeed()} />;
}
