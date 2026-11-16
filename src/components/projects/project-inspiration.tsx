"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotYet } from "@/components/nia/not-yet";
import { ScrollRow } from "@/components/nia/scroll-row";
import { CARD_TOOLS, CardButton, DragHandle, MoveButtons, useDragReorder } from "@/components/nia/drag-reorder";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
// the Explore titles. Arranged by the team (Ika, 2026-11-15, like a template's reference cards):
// drag a card or use Move earlier / later, and each has a note below to write in
// (`project_references.position` and `note`, 20261118000000_project_references_arrange.sql;
// until it's run, newest first and nothing saves).

type Arranged = { position: number | null; note: string | null };

/** Each reference's place and note; null if the order column isn't there yet (then neither shows). */
async function loadArrangement(projectId: string) {
  const { data, error } = await createClient().from("project_references").select("id, position, note").eq("project_id", projectId).is("deleted_at", null);
  if (error) return null;
  return new Map((data as ({ id: string } & Arranged)[]).map((r) => [r.id, { position: r.position, note: r.note }]));
}
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
  const [arranged, setArranged] = useState<Map<string, Arranged>>(new Map());
  // Arranging needs its migration (position, note); until then the row stays newest first.
  const [arrangeOn, setArrangeOn] = useState(false);

  const load = async () => {
    const db = createClient();
    const [result, list] = await Promise.all([loadReferences(db, projectId), loadInstagramReferences(db, projectId).catch(() => null)]);
    if (result.ready) setRefs(result.data);
    else setProblem(result.error);
    if (list) setPosts(list);
    const map = await loadArrangement(projectId);
    setArrangeOn(!!map);
    setArranged(map ?? new Map());
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
    void loadArrangement(projectId).then((map) => {
      if (!live) return;
      setArrangeOn(!!map);
      setArranged(map ?? new Map());
    });
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
  // Explore titles and pasted posts in one row: in the team's order, then newest first.
  const placeOf = (id: string) => arranged.get(id)?.position ?? Number.MAX_SAFE_INTEGER;
  const row =
    refs && posts
      ? [
          ...refs.flatMap((r) => {
            const entry = exploreItem(r.slug);
            return entry ? [{ id: r.id, at: r.createdAt, explore: { ref: r, entry } }] : [];
          }),
          ...posts.map((post) => ({ id: post.id, at: post.createdAt, post })),
        ].toSorted((a, b) => placeOf(a.id) - placeOf(b.id) || b.at.localeCompare(a.at))
      : null;

  // Moving a card saves every card's place (positions 0, 1, 2…).
  const move = async (from: number, to: number) => {
    if (!row || to < 0 || to >= row.length || from === to) return;
    const ids = row.map((x) => x.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    const before = arranged;
    setArranged(new Map(ids.map((id, position) => [id, { position, note: arranged.get(id)?.note ?? null }])));
    const db = createClient();
    const results = await Promise.all(ids.map((id, position) => db.from("project_references").update({ position }).eq("id", id)));
    if (results.some((r) => r.error)) {
      setArranged(before);
      toast.error("Couldn't save the order. Try again.");
    }
  };
  const drag = useDragReorder((from, to) => void move(from, to));
  const saveNote = async (id: string, note: string) => {
    const next = note.trim().slice(0, 1000) || null;
    if ((arranged.get(id)?.note ?? null) === next) return;
    const { error } = await createClient().from("project_references").update({ note: next }).eq("id", id);
    if (error) return void toast.error("Couldn't save the note. Try again.");
    setArranged((was) => new Map(was).set(id, { position: was.get(id)?.position ?? null, note: next }));
  };
  const tools = (ref: { id: string }, title: string, i: number) =>
    canEdit && row && !arrangeOn ? (
      <CardButton label={`Remove ${title} from references`} onClick={() => void remove(ref, title)}>
        <X aria-hidden className="size-3.5" />
      </CardButton>
    ) : canEdit && row ? (
      <div className="flex w-full items-center gap-1">
        <DragHandle name={title} {...drag.handle(i)} />
        <span className={cn(CARD_TOOLS, "ml-auto")}>
          <MoveButtons name={title} i={i} count={row.length} onMove={(a, b) => void move(a, b)} />
          <CardButton label={`Remove ${title} from references`} onClick={() => void remove(ref, title)}>
            <X aria-hidden className="size-3.5" />
          </CardButton>
        </span>
      </div>
    ) : null;
  // `saved`: the note loaded with an Instagram reference, shown until the arrangement loads.
  const note = (id: string, title: string, saved?: string | null) => {
    if (!arrangeOn) return null;
    const text = (arranged.has(id) ? arranged.get(id)?.note : saved) ?? "";
    if (!canEdit) return text ? <p className="text-small text-muted-foreground">{text}</p> : null;
    return (
      <Textarea
        key={`${id}-${text}`}
        aria-label={`Note on ${title}`}
        defaultValue={text}
        placeholder="Add a note"
        rows={2}
        maxLength={1000}
        onBlur={(e) => void saveNote(id, e.target.value)}
        className="min-h-14 resize-none border-transparent bg-transparent px-1 text-small shadow-none hover:bg-muted/50 focus-visible:bg-background"
      />
    );
  };

  return (
    <div className="flex flex-col gap-10">
      <section id="references" aria-labelledby="project-references" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="project-references" className="text-subtitle font-semibold text-foreground">
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
          <ScrollRow label="References" className="items-start">
            {row.map((item, i) =>
              "post" in item ? (
                <li key={item.id} className={cn(cell, "group/card flex flex-col gap-1 rounded-lg", drag.state(i))} style={referenceSpan(item.post)} {...(canEdit && arrangeOn ? drag.target(i) : {})}>
                  <InstagramReferenceCard projectId={projectId} reference={item.post} actions={tools(item.post, item.post.title, i)} />
                  {note(item.id, item.post.title, item.post.note)}
                </li>
              ) : (
                <li key={item.id} className={cn(cell, "group/card flex flex-col gap-1 rounded-lg", drag.state(i))} style={cardSpan(item.explore.entry)} {...(canEdit && arrangeOn ? drag.target(i) : {})}>
                  <ExploreCard item={item.explore.entry} href={item.explore.entry.href()} sizes={sizes} actions={tools(item.explore.ref, item.explore.entry.title, i)} />
                  {note(item.id, item.explore.entry.title)}
                </li>
              ),
            )}
          </ScrollRow>
        ) : null}
      </section>

      {access === false ? (
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
      ) : access ? (
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
      ) : null}
    </div>
  );
}
