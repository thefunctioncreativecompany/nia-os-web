import type { Metadata } from "next";

import { PlansPage } from "@/components/plans/plans-page";

export const metadata: Metadata = {
  title: "Plans · Nia OS",
};

// Plans and prices (Ika, 2026-10-20). The upgrade prompt links here.
export default function Page() {
  return <PlansPage />;
}
