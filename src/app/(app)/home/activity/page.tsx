import { Suspense } from "react";
import type { Metadata } from "next";

import { listActivity } from "@/lib/projects-data";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityPage } from "@/components/home/activity-page";

export const metadata: Metadata = {
  title: "Activity · Nia OS",
};

// All activity, full screen ("View all" on Home). The newest 300 changes.
export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-10 h-96 w-full max-w-200 rounded-xl" />}>
      <AllActivity />
    </Suspense>
  );
}

async function AllActivity() {
  const { items } = await listActivity({ limit: 300 });
  return <ActivityPage items={items} />;
}
