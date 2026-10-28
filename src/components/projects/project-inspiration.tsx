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
import type { ProjectSignals, Taste } from "@/features/explore/match";
import { loadTaste } from "@/features/explore/taste";
import { addReference, exploreAccess, loadReferences, removeReference, type Reference } from "@/features/explore/saves";
import { loadInstagramReferences, type InstagramReference } from "@/lib/instagram-references";
import { AddInstagramReference } from "./add-instagram-reference";
import { InstagramReferenceCard, referenceSpan } from "./instagram-reference-card";

// Landscape films get wider cells (`cardSpan`).
const cell = "w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(16%*var(--span,1))]";
const sizes = "(min-width: 64rem) 16vw, (min-width: 40rem) 30vw, 44vw";

// Explore on a project page (Ika, 2026-10-21): the titles the team added to its references, then
// Explore titles that match its genres and production type, each one tap from being a reference.
// Explore is there to inspire the work, so it sits with the project's files. References also take
// Instagram links pasted by the team (Ika, 2026-10-22), private to the project, newest first with
// the Explore titles.
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
  const [refs, setRefs] = useState<Reference[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // Pasted Instagram links; null until loaded, or when their migration hasn't run.
  const [posts, setPosts] = useState<InstagramReference[] | null>(null);
  const [postsOff, setPostsOff] = useState(false);
  // Suggestions and adding come with Explore's early access (Ika, 2026-10-21).
  const [access, setAccess] = useState<boolean | null>(null);
  // What this person tends to open, save and add, which nudges the order (match.ts).
  const [taste, setTaste] = useState<Taste | undefined>(undefined);

  const load = async () => {
    const db = createClient();
    const [result, list] = await Promise.all([loadReferences(db, projectId), loadInstagramReferences(db, projectId).catch(() => null)]);
    if (result.ready) setRefs(result.data);
    else setProblem(result.error);
    if (list) setPosts(list);
  };
  useEffect(() => {
    let live = true;
    const db = createClient();
    void loadReferences(db, projectId).then((result) => {
      if (!live) return;
      if (result.ready) setRefs(result.data);
      else setProblem(result.error);
    });
    void loadInstagramReferences(db, projectId).then(
      (list) => live && setPosts(list),
      () => live && (setPosts([]), setPostsOff(true)),
    );
    void exploreAccess(db).then((yes) => {
      if (!live) return;
      setAccess(yes);
      if (yes) void loadTaste().then((t) => live && setTaste(t), () => undefined);
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
  const remove = async (ref: { id: string }, name: string) => {
    const result = await removeReference(createClient(), ref.id);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Removed ${name} from references.`);
    void load();
  };

  const held = new Set((refs ?? []).map((r) => r.slug));
  const suggestions = suggestItemsForProject(signals, held, [...held], taste);
  const matched = signals.genres.trim() !== "" || !!signals.productionType || !!signals.description?.trim();
  // Explore titles and pasted posts in one row, newest first.
  const row =
    refs && posts
      ? [
          ...refs.flatMap((r) => {
            const entry = exploreItem(r.slug);
            return entry ? [{ at: r.createdAt, explore: { ref: r, entry } }] : [];
          }),
          ...posts.map((post) => ({ at: post.createdAt, post })),
        ].toSorted((a, b) => b.at.localeCompare(a.at))
      : null;
  const removeButton = (ref: { id: string }, title: string) =>
    canEdit && (
      <Button variant="ghost" size="compact" aria-label={`Remove ${title} from references`} onClick={() => void remove(ref, title)}>
        <X aria-hidden /> Remove
      </Button>
    );

  return (
    <div className="flex flex-col gap-10">
      <section id="references" aria-labelledby="project-references" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="project-references" className="text-xl leading-[1.4] font-bold text-foreground">
          References {row && row.length > 0 && <span className="text-micro font-normal text-muted-foreground">{row.length}</span>}
        </h2>
        {canEdit &&
          (postsOff ? (
            <NotYet>Adding Instagram links isn&rsquo;t switched on yet.</NotYet>
          ) : (
            <AddInstagramReference projectId={projectId} held={new Set((posts ?? []).map((p) => p.link.code))} onAdded={() => void load()} />
          ))}
        {problem ? (
          <NotYet>{problem} Titles added from Explore will show here.</NotYet>
        ) : row && row.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {!canEdit
              ? "No references yet."
              : postsOff
                ? access
                  ? "Add titles from the suggestions below, from Explore, or from your collections."
                  : "Nothing added yet."
                : access
                  ? "Paste a link above, or add titles from the suggestions below, from Explore, or from your collections."
                  : "Paste a link above to add your first reference."}
          </p>
        ) : row ? (
          <ScrollRow label="References">
            {row.map((item) =>
              "post" in item ? (
                <li key={item.post.id} className={cell} style={referenceSpan(item.post)}>
                  <InstagramReferenceCard projectId={projectId} reference={item.post} actions={removeButton(item.post, item.post.title)} />
                </li>
              ) : (
                <li key={item.explore.ref.id} className={cell} style={cardSpan(item.explore.entry)}>
                  <ExploreCard item={item.explore.entry} href={item.explore.entry.href()} sizes={sizes} actions={removeButton(item.explore.ref, item.explore.entry.title)} />
                </li>
              ),
            )}
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
            <div className="flex items-center gap-1">
              <h2 id="inspiration" className="text-xl leading-[1.4] font-bold text-foreground">
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
      ) : null}
    </div>
  );
}
