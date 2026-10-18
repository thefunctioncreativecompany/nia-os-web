import type { Metadata } from "next";
import Link from "next/link";

import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = {
  title: "New project · Nia OS",
};

// Figma "Screen 3 - Blank Setup Form".
export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-10 md:px-15">
      <Link
        href="/projects"
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Projects
      </Link>
      <div className="flex flex-1 items-start justify-center md:items-center">
        <ProjectForm />
      </div>
    </div>
  );
}
