"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import type { News } from "./welcome-tour";

// The welcome tour opens once per account (or from "Take the tour"), so its code only downloads
// when it's about to open, not on every visit to Home.
const WelcomeTour = dynamic(() => import("./welcome-tour").then((m) => m.WelcomeTour), { ssr: false });

export function WelcomeTourLoader({ firstName, firstVisit, news }: { firstName: string; firstVisit: boolean; news: News | null }) {
  const asked = useSearchParams().get("tour") === "1";
  return firstVisit || asked ? <WelcomeTour firstName={firstName} firstVisit={firstVisit} news={news} /> : null;
}
