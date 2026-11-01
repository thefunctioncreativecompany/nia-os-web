import { notFound } from "next/navigation";

import { CastCrewDirectory } from "@/components/projects/cast-crew-directory";
import { SAMPLE } from "@/features/crew/directory";

// The cast and crew directory on Figma frame 18's sample production, for the design check before
// the people tables are connected. Hidden on the live site, like the component gallery.
export default function Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <CastCrewDirectory projectId="sample" projectTitle="Streamer University S2" projectHref="/projects" entries={SAMPLE} editable={false} />
    </div>
  );
}
