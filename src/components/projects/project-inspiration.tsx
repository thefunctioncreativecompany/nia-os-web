"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotYet } from "@/components/nia/not-yet";
import { ScrollRow } from "@/components/nia/scroll-row";
import { SaveToCollection } from "@/components/explore/save-controls";
import { TitleCard } from "@/components/explore/title-card";
import { TmdbCredit } from "@/components/explore/tmdb-credit";
import { findEntry, suggestForProject, titleHref } from "@/features/explore/made-in-africa";
import { addReference, loadReferences, removeReference, type Reference } from "@/features/explore/saves";

const cell = "w-[44%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[16%]";
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

  const load = async () => {
    const result = await loadReferences(createClient(), projectId);
    if (result.ready) setRefs(result.data);
    else setProblem(result.error);
  };
  useEffect(() => {
    let live = true;
    void loadReferences(createClient(), projectId).then((result) => {
      if (!live) return;
      if (result.ready) setRefs(result.data);
      else setProblem(result.error);
    });
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
  const suggestions = suggestForProject({ genres, productionType }, held);
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
            {canEdit ? "Add titles from the suggestions below, from Explore, or from your collections." : "Nothing added from Explore yet."}
          </p>
        ) : refs ? (
          <ScrollRow label="References from Explore">
            {refs.map((r) => {
              const entry = findEntry(r.slug);
              if (!entry) return null;
              return (
                <li key={r.id} className={cell}>
                  <TitleCard
                    entry={entry}
                    href={titleHref(entry.title.slug)}
                    sizes={sizes}
                    actions={
                      canEdit && (
                        <Button variant="ghost" size="compact" aria-label={`Remove ${entry.title.title} from references`} onClick={() => void remove(r, entry.title.title)}>
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

      <section aria-labelledby="inspiration" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="inspiration" className="text-xl leading-[1.4] font-bold text-foreground">
            Inspiration for this project
          </h2>
          <p className="text-sm text-muted-foreground">
            {matched ? "From Explore, matched to this project's genres and production type." : "From Explore. Add genres and a production type to get closer matches."}
          </p>
        </div>
        <ScrollRow label="Inspiration for this project">
          {suggestions.map((e) => (
            <li key={e.title.slug} className={cell}>
              <TitleCard
                entry={e}
                href={titleHref(e.title.slug)}
                sizes={sizes}
                actions={
                  <>
                    {canEdit && !problem && (
                      <Button variant="outline" size="compact" aria-label={`Add ${e.title.title} to references`} onClick={() => void add(e.title.slug, e.title.title)}>
                        <Plus aria-hidden /> Add
                      </Button>
                    )}
                    <SaveToCollection slug={e.title.slug} title={e.title.title} size="compact" />
                  </>
                }
              />
            </li>
          ))}
        </ScrollRow>
        <TmdbCredit />
      </section>
    </div>
  );
}
