import type { Metadata } from "next";

import { CollectionsView } from "@/components/projects/collections-view";
import { ProjectsTabs } from "@/components/projects/projects-tabs";

export const metadata: Metadata = {
  title: "Collections · Nia OS",
};

// Projects › Collections: titles saved from Explore (Ika, 2026-10-21).
export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-15 md:px-15">
      <ProjectsTabs />
      <CollectionsView />
    </div>
  );
}
