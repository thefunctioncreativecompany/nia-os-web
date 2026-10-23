import type { Metadata } from "next";

import { CreatorsAll } from "@/components/explore/creators-all";

export const metadata: Metadata = {
  title: "Creators · Explore · Nia OS",
};

// View all from Explore's Creators row: every creator's film, with search.
export default function Page() {
  return <CreatorsAll />;
}
