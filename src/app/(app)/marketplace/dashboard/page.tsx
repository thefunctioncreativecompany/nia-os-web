import type { Metadata } from "next";

import { ListerDashboard } from "@/components/marketplace/lister-dashboard";

export const metadata: Metadata = {
  title: "Lister dashboard · Marketplace · Nia OS",
};

// The lister dashboard (MARKETPLACE_SPEC.md §7). With real data it's for anyone with at least one
// listing; for now everyone sees the sample dashboard.
export default function Page() {
  return <ListerDashboard />;
}
