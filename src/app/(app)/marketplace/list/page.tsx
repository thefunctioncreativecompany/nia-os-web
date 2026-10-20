import type { Metadata } from "next";

import { ListGear } from "@/components/marketplace/list-gear";

export const metadata: Metadata = {
  title: "List your gear · Marketplace · Nia OS",
};

// List your gear (MARKETPLACE_SPEC.md §5).
export default function Page() {
  return <ListGear />;
}
