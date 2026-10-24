"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

// The calendar (and its date library) loads the first time someone opens a date, not with the
// page. Use this inside pop-ups; a calendar that shows on the page itself can import
// `@/components/ui/calendar` directly.
export const Calendar = dynamic(() => import("@/components/ui/calendar").then((m) => m.Calendar), {
  ssr: false,
  loading: () => <Skeleton className="h-75 w-62 rounded-lg" />,
});
