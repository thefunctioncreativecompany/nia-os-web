"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Flag, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { parseDay } from "@/lib/dates";
import { mentionPeople } from "@/lib/mention-people";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { DuePicker } from "@/components/projects/project-milestones";
import { actionItems, dueIn } from "@/features/meetings/points";
import { addMilestones, MILESTONES_CHANGED, milestoneTitles, titleKey, type NewMilestone } from "@/features/meetings/to-milestones";

const RichTextEditor = dynamic(() => import("@/components/nia/rich-text-editor").then((m) => m.RichTextEditor), { ssr: false });

type Kind = NewMilestone["kind"];
type Flagged = { text: string; top: number };

// A meeting's notes (Ika, 2026-11-19: easier changes to meeting points, an easier way to send
// action items to milestones/objectives). Always open for typing, like a document: click a point
// and change it, Enter for the next point, Tab to nest one, "Section heading" for a section; saved
// a moment after typing stops (and on leaving). Above the notes, the action items it finds (points
// under "Action items", "Next steps", "To do"…) with "Add to milestones"; beside any point, a flag
// sends that one point as an action or a milestone, with a date. Nothing is added twice. Typing @
// mentions someone on the project (2026-11-28), who's told once the notes save.
export function MeetingSummary({
  projectId,
  heldOn,
  value,
  placeholder,
  onSave,
}: {
  projectId: string;
  /** The meeting's day: "tomorrow" in the notes counts from it. */
  heldOn: string | null;
  value: string;
  placeholder: string;
  onSave: (summary: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);
  // @mentions of the people on the project (20261130000000_mentions_notes_documents.sql tells them).
  const findPeople = useMemo(() => mentionPeople(projectId), [projectId]);
  const [have, setHave] = useState<Set<string>>(new Set());
  // "Tomorrow" and "by Friday" count from the meeting's day (or today, when it has none).
  const [today] = useState(() => (heldOn && parseDay(heldOn)) || new Date());
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  });

  // What's already in the project's milestones, and again whenever they change.
  useEffect(() => {
    let live = true;
    const load = () => void milestoneTitles(projectId).then((set) => live && setHave(set));
    load();
    const changed = (e: Event) => (e as CustomEvent<string>).detail === projectId && load();
    window.addEventListener(MILESTONES_CHANGED, changed);
    return () => {
      live = false;
      window.removeEventListener(MILESTONES_CHANGED, changed);
    };
  }, [projectId]);

  const flush = () => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next !== null) void saveRef.current(next).catch(() => {});
  };
  // Typing that hasn't been saved yet is saved when the notes close.
  useEffect(() => flush, []);

  const change = (markdown: string) => {
    setDraft(markdown);
    pending.current = markdown;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 1000);
  };

  const items = useMemo(() => actionItems(draft, today), [draft, today]);

  return (
    <div className="flex flex-col gap-5">
      <ActionItems projectId={projectId} items={items} have={have} />
      <PointFlags projectId={projectId} have={have} today={today}>
        <RichTextEditor value={value} label="Meeting notes" placeholder={placeholder} variant="document" headings maxLength={100000} mentions={findPeople} onChange={change} onDone={(save) => save && flush()} className="text-sm leading-relaxed text-foreground" />
      </PointFlags>
    </div>
  );
}

/** The action items the notes list, ticked, with one button to add them to Key milestones. */
function ActionItems({ projectId, items, have }: { projectId: string; items: { title: string; dueOn: string | null }[]; have: Set<string> }) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  if (!items.length) return null;
  const waiting = items.filter((i) => !have.has(titleKey(i.title)));
  const chosen = waiting.filter((i) => !skipped.has(titleKey(i.title)));

  const add = async () => {
    setBusy(true);
    try {
      const added = await addMilestones(
        projectId,
        chosen.map((i) => ({ kind: "action", title: i.title, dueOn: i.dueOn })),
      );
      toast.success(`${added} ${added === 1 ? "action" : "actions"} added to Key milestones`);
    } catch {
      toast.error("Couldn't add them. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="meeting-actions" className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="meeting-actions" className="flex items-center gap-2 pl-1 text-small font-semibold text-foreground">
          <ListChecks aria-hidden className="size-4 text-muted-foreground" />
          Action items <span className="font-normal text-muted-foreground">{items.length}</span>
        </h3>
        {waiting.length > 0 ? (
          <Button variant="secondary" size="compact" disabled={busy || !chosen.length} onClick={() => void add()}>
            <Flag aria-hidden /> {busy ? "Adding…" : chosen.length === waiting.length ? "Add to milestones" : `Add ${chosen.length} to milestones`}
          </Button>
        ) : (
          <span className="flex items-center gap-1 pr-1 text-caption text-muted-foreground">
            <Check aria-hidden className="size-3.5" /> All in Key milestones
          </span>
        )}
      </div>
      <ul className="flex flex-col">
        {items.map((item) => {
          const k = titleKey(item.title);
          const added = have.has(k);
          return (
            <li key={k}>
              <label className={cn("flex items-start gap-2.5 rounded-lg px-1 py-1.5 text-sm", !added && "cursor-pointer hover:bg-muted/60")}>
                {added ? (
                  <Check aria-label="In Key milestones" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Checkbox
                    className="mt-0.5"
                    checked={!skipped.has(k)}
                    onCheckedChange={(on) =>
                      setSkipped((s) => {
                        const next = new Set(s);
                        if (on) next.delete(k);
                        else next.add(k);
                        return next;
                      })
                    }
                  />
                )}
                <span className={cn("min-w-0 flex-1", added ? "text-muted-foreground" : "text-foreground")}>{item.title}</span>
                {item.dueOn && <span className="shrink-0 pt-px text-caption text-muted-foreground tabular-nums">{parseDay(item.dueOn)?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The notes with a flag beside the point under the pointer (or the cursor, on phones): send that point to Key milestones. */
function PointFlags({ projectId, have, today, children }: { projectId: string; have: Set<string>; today: Date; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<Flagged | null>(null);
  const [open, setOpen] = useState(false);

  const track = (node: Node | null | undefined) => {
    if (open) return;
    const el = node instanceof Element ? node : node?.parentElement;
    // Nothing under the pointer, or the flag itself: keep it where it is.
    if (!el || el.closest("[data-point-flag]")) return;
    const li = el.closest(".ProseMirror li");
    if (!li || !box.current) return setPoint(null);
    const text = (li.querySelector(":scope > p")?.textContent ?? "").trim();
    if (!text) return setPoint(null);
    const top = li.getBoundingClientRect().top - box.current.getBoundingClientRect().top;
    setPoint((p) => (p?.text === text && p.top === top ? p : { text, top }));
  };

  return (
    <div
      ref={box}
      className="relative pr-10"
      onMouseMove={(e) => track(e.target as Node)}
      onMouseLeave={() => !open && setPoint(null)}
      onClick={(e) => !(e.target as Element).closest("[data-point-flag]") && track(document.getSelection()?.anchorNode)}
      onKeyUp={() => track(document.getSelection()?.anchorNode)}
    >
      {children}
      {point && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <Button
              type="button"
              data-point-flag
              variant="ghost"
              size="icon-sm"
              aria-label={have.has(titleKey(point.text)) ? "In Key milestones" : "Send this point to Key milestones"}
              title="Send to Key milestones"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(true)}
              style={{ top: point.top - 4 }}
              className="absolute right-0 text-muted-foreground"
            >
              {have.has(titleKey(point.text)) ? <Check /> : <Flag />}
            </Button>
          </PopoverAnchor>
          <PopoverContent align="end" className="w-80 p-3">
            <SendPoint key={point.text} projectId={projectId} text={point.text} inAlready={have.has(titleKey(point.text))} today={today} onDone={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function SendPoint({ projectId, text, inAlready, today, onDone }: { projectId: string; text: string; inAlready: boolean; today: Date; onDone: () => void }) {
  const [kind, setKind] = useState<Kind>("action");
  const [title, setTitle] = useState(text.slice(0, 300));
  const [due, setDue] = useState(() => dueIn(text, today) ?? "");
  const [busy, setBusy] = useState(false);

  if (inAlready)
    return (
      <p className="flex items-center gap-2 text-small text-muted-foreground">
        <Check aria-hidden className="size-4" /> Already in Key milestones.
      </p>
    );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addMilestones(projectId, [{ kind, title, dueOn: due || null }]);
      toast.success(kind === "action" ? "Action added to Key milestones" : "Milestone added");
      onDone();
    } catch {
      toast.error("Couldn't add it. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={add} className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Add as" className="flex w-fit rounded-full bg-muted p-0.5">
        {(["action", "milestone"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-small font-semibold text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              kind === k && "bg-background text-foreground shadow-xs",
            )}
          >
            {k === "milestone" && <Flag aria-hidden className="size-3.5" />}
            {k === "action" ? "Action" : "Milestone"}
          </button>
        ))}
      </div>
      <textarea
        aria-label={kind === "action" ? "The action" : "The milestone"}
        value={title}
        maxLength={300}
        rows={4}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="flex items-center justify-between gap-2">
        <DuePicker value={due} onChange={setDue} label="Date" />
        <Button type="submit" variant="secondary" size="compact" disabled={busy || !title.trim()}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
