"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotYet } from "@/components/nia/not-yet";
import { ScrollRow } from "@/components/nia/scroll-row";
import { SaveToCollection } from "@/components/explore/save-controls";
import { ExploreCard, cardSpan } from "@/components/explore/title-card";
import { TmdbCredit } from "@/components/explore/tmdb-credit";
import { exploreItem, suggestItemsForProject } from "@/features/explore/items";
import { addReference, exploreAccess, loadReferences, removeReference, type Reference } from "@/features/explore/saves";

// Landscape films get wider cells (`cardSpan`).
const cell = "w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(16%*var(--span,1))]";
const sizes = "(min-width: 64rem) 16vw, (min-width: 40rem) 30vw, 44vw";

// Explore on a project page (Ika, 2026-10-21): the titles the team added to its references, then
// Explore titles that match its genres and production type, each one tap from being a reference.
// Explore is there to inspire the work, so it sits with the project's files.
export function ProjectInspiration({
  projectId,
  genres,
  productionType,
  canEdit,
}: {
  projectId: string;
  genres: string;
  productionType: string | null;
  canEdit: boolean;
}) {
  const [refs, setRefs] = useState<Reference[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // Suggestions and adding come with Explore's early access (Ika, 2026-10-21).
  const [access, setAccess] = useState<boolean | null>(null);

  const load = async () => {
    const result = await loadReferences(createClient(), projectId);
    if (result.ready) setRefs(result.data);
    else setProblem(result.error);
  };
  useEffect(() => {
    let live = true;
    const db = createClient();
    void loadReferences(db, projectId).then((result) => {
      if (!live) return;
      if (result.ready) setRefs(result.data);
      else setProblem(result.error);
    });
    void exploreAccess(db).then((yes) => live && setAccess(yes));
    return () => {
      live = false;
    };
  }, [projectId]);

  const add = async (slug: string, name: string) => {
    const result = await addReference(createClient(), projectId, slug);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Added ${name} to references.`);
    void load();
  };
  const remove = async (ref: Reference, name: string) => {
    const result = await removeReference(createClient(), ref.id);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Removed ${name} from references.`);
    void load();
  };

  const held = new Set((refs ?? []).map((r) => r.slug));
  const suggestions = suggestItemsForProject({ genres, productionType }, held);
  const matched = genres.trim() !== "" || !!productionType;

  return (
    <div className="flex flex-col gap-10">
      <section id="references" aria-labelledby="explore-references" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="explore-references" className="text-xl leading-[1.4] font-bold text-foreground">
          References from Explore {refs && refs.length > 0 && <span className="text-micro font-normal text-muted-foreground">{refs.length}</span>}
        </h2>
        {problem ? (
          <NotYet>{problem} Titles added from Explore will show here.</NotYet>
        ) : refs && refs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {canEdit && access ? "Add titles from the suggestions below, from Explore, or from your collections." : "Nothing added from Explore yet."}
          </p>
        ) : refs ? (
          <ScrollRow label="References from Explore">
            {refs.map((r) => {
              const entry = exploreItem(r.slug);
              if (!entry) return null;
              return (
                <li key={r.id} className={cell} style={cardSpan(entry)}>
                  <ExploreCard
                    item={entry}
                    href={entry.href()}
                    sizes={sizes}
                    actions={
                      canEdit && (
                        <Button variant="ghost" size="compact" aria-label={`Remove ${entry.title} from references`} onClick={() => void remove(r, entry.title)}>
                          <X aria-hidden /> Remove
                        </Button>
                      )
                    }
                  />
                </li>
              );
            })}
          </ScrollRow>
        ) : null}
      </section>

      {access === false ? (
        <section aria-labelledby="inspiration" className="flex flex-col gap-3">
          <h2 id="inspiration" className="text-xl leading-[1.4] font-bold text-foreground">
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
      ) : access ? (
        <section aria-labelledby="inspiration" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="inspiration" className="text-xl leading-[1.4] font-bold text-foreground">
              Inspiration for this project
            </h2>
            <p className="text-sm text-muted-foreground">
              {matched
                ? "From Explore's films, series and creators' work, matched to this project's genres and production type."
                : "From Explore. Add genres and a production type to get closer matches."}
            </p>
          </div>
          <ScrollRow label="Inspiration for this project">
            {suggestions.map((e) => (
              <li key={e.slug} className={cell} style={cardSpan(e)}>
                <ExploreCard
                  item={e}
                  href={e.href()}
                  sizes={sizes}
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
          <TmdbCredit />
        </section>
      ) : null}
    </div>
  );
}
