import Image from "next/image";
import Link from "next/link";

import { projectMeta, type Project } from "@/lib/projects";
import { Card } from "@/components/arc/card/card";
import { Button } from "@/components/ui/button";

// "Shared with you" (Fix 8, Ika's C1): projects other people invited this person to, as uiarc
// cards. "View" opens the full project; what they can do there follows their role.
export function SharedProjects({ projects, now }: { projects: Project[]; now: number }) {
  return (
    <section aria-labelledby="shared-with-you" className="mt-6 flex flex-col gap-4">
      <h2 id="shared-with-you" className="text-xl font-bold text-foreground">Shared with you</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16.25rem),1fr))] gap-6">
        {projects.map((p) => (
          <Card
            key={p.id}
            title={p.title || "Untitled project"}
            description={p.description || undefined}
            media={
              <div className="relative aspect-[19/10] w-full bg-muted">
                {p.coverUrl && <Image src={p.coverUrl} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />}
              </div>
            }
            meta={p.productionType ?? p.stage}
            status={projectMeta(p, now)}
            action={
              <Button asChild variant="outline" size="compact">
                <Link href={`/projects/${p.id}`} aria-label={`View ${p.title || "Untitled project"}`}>View</Link>
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}
