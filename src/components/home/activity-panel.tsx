"use client";

import { useEffect, useRef, useState } from "react";

import type { ActivityItem } from "@/lib/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { SidePanel } from "@/components/nia/side-panel";
import { ActivityPage } from "@/components/home/activity-page";
import { loadAllActivity } from "@/features/activity/actions";

// All activity in Home's right panel (Ika, 2026-11-19), in place of a page of its own: the newest
// 300 changes, loaded when it opens. Full width on phones and tablets, as the meeting panel.
export function ActivityPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    loadAllActivity().then(
      (list) => live && setItems(list),
      () => live && setItems([]),
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="max-lg:[--preview-panel-w:100vw]">
      <SidePanel label="Activity" onClose={onClose}>
        <div ref={area} className="flex-1 overflow-y-auto">
          {items ? (
            <ActivityPage items={items} scroller={area} />
          ) : (
            <div className="flex flex-col gap-4 px-6 pt-6 xl:px-9.5" aria-busy="true" aria-label="Loading activity">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          )}
        </div>
      </SidePanel>
    </div>
  );
}
