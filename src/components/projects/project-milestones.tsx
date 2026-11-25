"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ChevronDown, Flag, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toDay } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { NotYet } from "@/components/nia/not-yet";
import { ViewAll } from "@/components/nia/view-all";
import { MILESTONES_CHANGED } from "@/features/meetings/to-milestones";
import { MilestoneAddLine } from "./milestone-add-line";
import { DuePicker, Face, dueLabel, loadMilestones, openOrder, shortName, useCrew, type CrewPerson, type Item } from "./milestones-shared";

// The meetings screen picks dates with the same control.
export { DuePicker } from "./milestones-shared";

// The full view loads when it's first opened, so the Overview stays light.
const MilestonesFull = dynamic(() => import("./milestones-full").then((m) => m.MilestonesFull));

// Key milestones and actions on a project (Ika, 2026-11-15: "add key milestones/objectives and
// actions, with a date picker … for now i want to be able to just add action items from meetings,
// discussions etc"; later a fuller project management view grows from here). One line to add: an
// action or a milestone, its words, a date if it has one; a crew member named in the words is
// assigned (PR2, 2026-11-25). Open items by when they're due (overdue in red), with who's on each
// next to its date; ticked ones folded under Done. View all opens the full view (milestones-full.tsx):
// department, priority, stage and notes, filters, drag to reorder. People who can edit add, tick,
// change and remove; viewers read. project_milestones, 20261119000000_project_milestones.sql and
// 20261125000000_milestones_detail.sql.

/** Open ones shown here; the rest in View all. */
const FIRST = 5;

export function ProjectMilestones({ projectId, projectTitle, canEdit }: { projectId: string; projectTitle?: string; canEdit: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [detailed, setDetailed] = useState(false);
  const [off, setOff] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [full, setFull] = useState(false);
  const [today] = useState(() => toDay(new Date()));
  const crew = useCrew(projectId);
  // Points sent from a meeting's notes (to-milestones.ts) show here straight away.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const changed = (e: Event) => (e as CustomEvent<string>).detail === projectId && setVersion((v) => v + 1);
    window.addEventListener(MILESTONES_CHANGED, changed);
    return () => window.removeEventListener(MILESTONES_CHANGED, changed);
  }, [projectId]);

  useEffect(() => {
    let live = true;
    void loadMilestones(projectId).then((loaded) => {
      if (!live) return;
      if (!loaded) return setOff(true);
      setItems(loaded.items);
      setDetailed(loaded.detailed);
    });
    return () => {
      live = false;
    };
  }, [projectId, version]);

  const change = async (item: Item, patch: Partial<Item>) => {
    const before = items;
    setItems((was) => was?.map((i) => (i.id === item.id ? { ...i, ...patch } : i)) ?? null);
    const { error } = await createClient().from("project_milestones").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) {
      setItems(before);
      toast.error("Couldn't save that. Try again.");
    }
  };
  const remove = async (item: Item) => {
    const before = items;
    setItems((was) => was?.filter((i) => i.id !== item.id) ?? null);
    const { error } = await createClient().rpc("remove_project_milestone", { milestone_id: item.id });
    if (error) {
      setItems(before);
      toast.error("Couldn't remove it. Try again.");
    }
  };
  // A group's new order: each item's place (0, 1, 2…).
  const reorder = async (ids: string[]) => {
    const before = items;
    setItems((was) => was?.map((i) => (ids.includes(i.id) ? { ...i, position: ids.indexOf(i.id) } : i)) ?? null);
    const db = createClient();
    const results = await Promise.all(ids.map((id, position) => db.from("project_milestones").update({ position }).eq("id", id)));
    if (results.some((r) => r.error)) {
      setItems(before);
      toast.error("Couldn't save the order. Try again.");
    }
  };
  const added = (item: Item) => setItems((was) => [...(was ?? []), item]);

  const open = (items ?? []).filter((i) => !i.done_at).toSorted(openOrder(today));
  const done = (items ?? []).filter((i) => i.done_at).toSorted((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));

  return (
    <section aria-labelledby="milestones" className="flex max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="milestones" className="text-subtitle font-semibold text-foreground">
          Key milestones {open.length > 0 && <span className="text-micro font-normal text-muted-foreground">{open.length}</span>}
        </h2>
        {items && items.length > 0 && <ViewAll onClick={() => setFull(true)} />}
      </div>
      {off ? (
        <NotYet>Milestones and actions open once their database update is run.</NotYet>
      ) : items === null ? null : (
        <>
          {canEdit && <MilestoneAddLine projectId={projectId} crew={crew} detailed={detailed} onAdded={added} onChange={(item, patch) => void change(item, patch)} />}
          {open.length === 0 && done.length === 0 && !canEdit && <p className="text-sm text-muted-foreground">—</p>}
          {open.length > 0 && (
            <ul aria-label="Open milestones and actions" className="flex flex-col">
              {open.slice(0, FIRST).map((item) => (
                <Row key={item.id} item={item} crew={crew} today={today} canEdit={canEdit} onChange={(patch) => void change(item, patch)} onRemove={() => void remove(item)} />
              ))}
            </ul>
          )}
          {open.length > FIRST && (
            <button type="button" onClick={() => setFull(true)} className="w-fit rounded-full px-1 py-1 text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              {open.length - FIRST} more in View all
            </button>
          )}
          {done.length > 0 && (
            <div className="flex flex-col">
              <button
                type="button"
                aria-expanded={showDone}
                onClick={() => setShowDone((s) => !s)}
                className="flex w-fit items-center gap-1 rounded-full px-1 py-1 text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-fast", !showDone && "-rotate-90")} />
                Done <span className="font-normal">{done.length}</span>
              </button>
              {showDone && (
                <ul aria-label="Done" className="flex flex-col">
                  {done.map((item) => (
                    <Row key={item.id} item={item} crew={crew} today={today} canEdit={canEdit} onChange={(patch) => void change(item, patch)} onRemove={() => void remove(item)} />
                  ))}
                </ul>
              )}
            </div>
          )}
          {full && (
            <MilestonesFull
              open={full}
              onOpenChange={setFull}
              projectTitle={projectTitle}
              projectId={projectId}
              items={items}
              crew={crew}
              detailed={detailed}
              canEdit={canEdit}
              today={today}
              onAdded={added}
              onChange={(item, patch) => void change(item, patch)}
              onRemove={(item) => void remove(item)}
              onReorder={(ids) => void reorder(ids)}
            />
          )}
        </>
      )}
    </section>
  );
}

function Row({ item, crew, today, canEdit, onChange, onRemove }: { item: Item; crew: CrewPerson[] | null; today: string; canEdit: boolean; onChange: (patch: Partial<Item>) => void; onRemove: () => void }) {
  const done = Boolean(item.done_at);
  const overdue = !done && !!item.due_on && item.due_on < today;
  const person = item.assignee_id ? (crew?.find((p) => p.id === item.assignee_id) ?? null) : null;
  const [draft, setDraft] = useState(item.title);
  // Escape leaves without saving (the blur that follows mustn't save the typed words).
  const cancelled = useRef(false);
  const save = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return setDraft(item.title);
    }
    const next = draft.trim().slice(0, 300);
    if (!next) return setDraft(item.title);
    if (next !== item.title) onChange({ title: next });
  };
  return (
    <li className="group/row flex min-h-11 items-center gap-2.5 border-b border-secondary py-1 last:border-b-0">
      <Checkbox
        aria-label={done ? `${item.title}: done. Mark not done` : `Mark ${item.title} done`}
        checked={done}
        disabled={!canEdit}
        onCheckedChange={(on) => onChange({ done_at: on === true ? new Date().toISOString() : null })}
      />
      {item.kind === "milestone" && (
        <span title="Milestone" className="shrink-0 text-nia-blue">
          <Flag aria-hidden className="size-4" />
          <span className="sr-only">Milestone:</span>
        </span>
      )}
      {canEdit ? (
        <input
          aria-label={item.kind === "milestone" ? "Milestone" : "Action"}
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              e.currentTarget.blur();
            }
          }}
          className={cn(
            "h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm outline-none hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50",
            done ? "text-muted-foreground line-through" : item.kind === "milestone" ? "font-semibold text-foreground" : "text-foreground",
          )}
        />
      ) : (
        <span className={cn("min-w-0 flex-1 px-1 text-sm", done ? "text-muted-foreground line-through" : item.kind === "milestone" ? "font-semibold text-foreground" : "text-foreground")}>{item.title}</span>
      )}
      {/* Who's on it, next to the date (PR2). */}
      {person && crew && (
        <span className="flex shrink-0 items-center gap-1.5 text-small font-medium text-foreground" title={`${person.name} · ${person.role}`}>
          <Face person={person} />
          <span className="sr-only">Assigned to</span>
          <span className="max-w-24 truncate">{shortName(person, crew)}</span>
        </span>
      )}
      {canEdit ? (
        <DuePicker value={item.due_on ?? ""} onChange={(next) => onChange({ due_on: next || null })} label={`Date for ${item.title}`} today={today} overdue={overdue} />
      ) : item.due_on ? (
        <span className={cn("shrink-0 text-small tabular-nums", overdue ? "font-semibold text-nia-danger" : "text-muted-foreground")}>
          {dueLabel(item.due_on, today)}
        </span>
      ) : null}
      {canEdit && (
        <button
          type="button"
          aria-label={`Remove ${item.title}`}
          onClick={onRemove}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 outline-none transition-opacity duration-fast group-hover/row:opacity-100 hover:bg-muted/70 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:opacity-100"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </li>
  );
}
