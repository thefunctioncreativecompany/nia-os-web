"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotYet } from "@/components/nia/not-yet";
import { ScrollRow } from "@/components/nia/scroll-row";
import { SaveToCollection } from "@/components/explore/save-controls";
import { ExploreCard, cardSpan } from "@/components/explore/title-card";
import { TmdbCredit } from "@/components/explore/tmdb-credit";
import { suggestItemsForProject } from "@/features/explore/items";
import type { ProjectSignals, Taste } from "@/features/explore/match";
import { loadTaste } from "@/features/explore/taste";
import { addReference, exploreAccess, loadReferences } from "@/features/explore/saves";
import { REFERENCES_CHANGED } from "./references-events";

// Landscape films get wider cells (`cardSpan`).
const cell = "w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(16%*var(--span,1))]";
const sizes = "(min-width: 64rem) 16vw, (min-width: 40rem) 30vw, 44vw";

// Explore on a project page (Ika, 2026-10-21): Explore titles that match the project's genres and
// production type, each one tap from being a reference. Explore is there to inspire the work, so it
// sits under the project's references. The references themselves, in folders, are
// project-references.tsx (PR1, 2026-11-25); adding one here tells that section to reload.

export function ProjectInspiration({
  projectId,
  signals,
  canEdit,
}: {
  projectId: string;
  /** What the suggestions match on: type, genres, frames and the project's own words. */
  signals: ProjectSignals;
  canEdit: boolean;
}) {
  // The Explore titles already on the project, so they aren't suggested again; null until loaded.
  const [held, setHeld] = useState<string[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // Suggestions and adding come with Explore's early access (Ika, 2026-10-21).
  const [access, setAccess] = useState<boolean | null>(null);
  // What this person tends to open, save and add, which nudges the order (match.ts).
  const [taste, setTaste] = useState<Taste | undefined>(undefined);

  useEffect(() => {
    let live = true;
    const db = createClient();
    const loadHeld = () =>
      void loadReferences(db, projectId).then((result) => {
        if (!live) return;
        if (result.ready) setHeld(result.data.map((r) => r.slug));
        else setProblem(result.error);
      });
    loadHeld();
    void exploreAccess(db).then((yes) => {
      if (!live) return;
      setAccess(yes);
      if (yes) void loadTaste().then((t) => live && setTaste(t), () => undefined);
    });
    // A title added or removed in the References section above.
    window.addEventListener(REFERENCES_CHANGED, loadHeld);
    return () => {
      live = false;
      window.removeEventListener(REFERENCES_CHANGED, loadHeld);
    };
  }, [projectId]);

  const add = async (slug: string, name: string) => {
    const result = await addReference(createClient(), projectId, slug);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Added ${name} to references.`);
    setHeld((was) => [...(was ?? []), slug]);
    window.dispatchEvent(new Event(REFERENCES_CHANGED));
  };

  const suggestions = suggestItemsForProject(signals, new Set(held ?? []), held ?? [], taste);
  const matched = signals.genres.trim() !== "" || !!signals.productionType || !!signals.description?.trim();

  if (access === false)
    return (
      <section aria-labelledby="inspiration" className="flex flex-col gap-3">
        <h2 id="inspiration" className="text-subtitle font-semibold text-foreground">
          Inspiration for this project
        </h2>
        <NotYet>
          Explore is open to invited members for now.{" "}
          <Link href="/explore" className="font-semibold text-foreground underline underline-offset-2">
            Enter your invite code
          </Link>{" "}
          to get titles matched to this project and add them to its references.
        </NotYet>
      </section>
    );
  if (!access) return null;
  return (
    <section aria-labelledby="inspiration" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <h2 id="inspiration" className="text-subtitle font-semibold text-foreground">
            Inspiration for this project
          </h2>
          <TmdbCredit />
        </div>
        <p className="text-sm text-muted-foreground">
          {matched
            ? "From Explore's films, series and creators' work, matched to this project's type, genres, deliverables, description and references."
            : "From Explore. Add a production type, genres and a description to get closer matches."}
        </p>
      </div>
      <ScrollRow label="Inspiration for this project">
        {suggestions.map(({ item: e, reasons }) => (
          <li key={e.slug} className={cell} style={cardSpan(e)}>
            <ExploreCard
              item={e}
              href={e.href()}
              sizes={sizes}
              note={reasons.length ? reasons.join(" · ") : undefined}
              actions={
                <>
                  {canEdit && !problem && (
                    <Button variant="outline" size="compact" aria-label={`Add ${e.title} to references`} onClick={() => void add(e.slug, e.title)}>
                      <Plus aria-hidden /> Add
                    </Button>
                  )}
                  <SaveToCollection slug={e.slug} title={e.title} size="compact" />
                </>
              }
            />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
