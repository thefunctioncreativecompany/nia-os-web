import type { Metadata } from "next";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";

export const metadata: Metadata = {
  title: "Made in Africa · Explore · Nia OS",
};

// View all from Explore's Made in Africa filmstrip: every title, by collection.
export default function Page() {
  return <MadeInAfricaAll />;
}
