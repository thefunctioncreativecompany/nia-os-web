import type { Metadata } from "next";

import { ProjectForm } from "@/components/projects/project-form";
import { BackLink } from "@/components/nia/back-link";

export const metadata: Metadata = {
  title: "New project · Nia OS",
};

// Figma "Screen 3 - Blank Setup Form".
export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-10 md:px-page">
      <BackLink
        href="/projects"
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Projects
      </BackLink>
      <div className="flex flex-1 items-start justify-center md:items-center">
        <ProjectForm />
      </div>
    </div>
  );
}
