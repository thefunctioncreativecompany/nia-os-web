"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Flag, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { parseDay, toDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/nia/lazy-calendar";
import { NotYet } from "@/components/nia/not-yet";

// Key milestones and actions on a project (Ika, 2026-11-15: "add key milestones/objectives and
// actions, with a date picker … for now i want to be able to just add action items from meetings,
// discussions etc"; later a fuller project management view grows from here). One line to add: an
// action or a milestone, its words, a date if it has one. Open items by date (overdue in red), ticked
// ones folded under Done. People who can edit add, tick, change and remove; viewers read.
// project_milestones, 20261119000000_project_milestones.sql.

type Kind = "milestone" | "action";
type Item = { id: string; kind: Kind; title: string; due_on: string | null; done_at: string | null; created_at: string };

const COLUMNS = "id, kind, title, due_on, done_at, created_at";

/** "Today", "Tomorrow", "Nov 21" (the year only when it isn't this year). */
function dueLabel(day: string, today: string) {
  if (day === today) return "Today";
  const date = parseDay(day);
  if (!date) return day;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (day === toDay(tomorrow)) return "Tomorrow";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

// Open ones by date (no date last), then the order they were added in.
const byDue = (a: Item, b: Item) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999") || a.created_at.localeCompare(b.created_at);

export function ProjectMilestones({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [off, setOff] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [today] = useState(() => toDay(new Date()));

  useEffect(() => {
    let live = true;
    void createClient()
      .from("project_milestones")
      .select(COLUMNS)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setOff(true);
        else setItems((data ?? []) as Item[]);
      });
    return () => {
      live = false;
    };
  }, [projectId]);

  const change = async (item: Item, patch: Partial<Pick<Item, "kind" | "title" | "due_on" | "done_at">>) => {
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

  const open = (items ?? []).filter((i) => !i.done_at).toSorted(byDue);
  const done = (items ?? []).filter((i) => i.done_at).toSorted((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));

  return (
    <section aria-labelledby="milestones" className="flex max-w-3xl flex-col gap-3">
      <h2 id="milestones" className="text-subtitle font-semibold text-foreground">
        Key milestones {open.length > 0 && <span className="text-micro font-normal text-muted-foreground">{open.length}</span>}
      </h2>
      {off ? (
        <NotYet>Milestones and actions open once their database update is run.</NotYet>
      ) : items === null ? null : (
        <>
          {canEdit && <AddLine projectId={projectId} onAdded={(item) => setItems((was) => [...(was ?? []), item])} />}
          {open.length === 0 && done.length === 0 && !canEdit && <p className="text-sm text-muted-foreground">—</p>}
          {open.length > 0 && (
            <ul aria-label="Open milestones and actions" className="flex flex-col">
              {open.map((item) => (
                <Row key={item.id} item={item} today={today} canEdit={canEdit} onChange={(patch) => void change(item, patch)} onRemove={() => void remove(item)} />
              ))}
            </ul>
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
                    <Row key={item.id} item={item} today={today} canEdit={canEdit} onChange={(patch) => void change(item, patch)} onRemove={() => void remove(item)} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** One line to add an action or a milestone: Enter adds it and keeps the line ready for the next. */
function AddLine({ projectId, onAdded }: { projectId: string; onAdded: (item: Item) => void }) {
  const [kind, setKind] = useState<Kind>("action");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const add = async () => {
    const text = title.trim().slice(0, 300);
    if (!text || busy) return;
    setBusy(true);
    const { data, error } = await createClient()
      .from("project_milestones")
      .insert({ project_id: projectId, kind, title: text, due_on: due || null })
      .select(COLUMNS)
      .single();
    setBusy(false);
    if (error) return void toast.error("Couldn't add it. Try again.");
    onAdded(data as Item);
    setTitle("");
    setDue("");
    input.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
    >
      <div role="radiogroup" aria-label="Kind" className="flex shrink-0 rounded-full bg-muted p-0.5">
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
      <input
        ref={input}
        aria-label={kind === "action" ? "New action" : "New milestone"}
        value={title}
        maxLength={300}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={kind === "action" ? "Add an action from a meeting…" : "Add a milestone or objective…"}
        className="h-8 min-w-40 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-nia-placeholder"
      />
      <DuePicker value={due} onChange={setDue} label="Date" />
      <Button type="submit" variant="secondary" size="compact" disabled={!title.trim() || busy}>
        Add
      </Button>
    </form>
  );
}

function Row({ item, today, canEdit, onChange, onRemove }: { item: Item; today: string; canEdit: boolean; onChange: (patch: Partial<Item>) => void; onRemove: () => void }) {
  const done = Boolean(item.done_at);
  const overdue = !done && !!item.due_on && item.due_on < today;
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
      {canEdit ? (
        <DuePicker value={item.due_on ?? ""} onChange={(next) => onChange({ due_on: next || null })} label={`Date for ${item.title}`} today={today} overdue={overdue} />
      ) : item.due_on ? (
        <span className={cn("shrink-0 text-small tabular-nums", overdue ? "font-semibold text-nia-danger" : "text-muted-foreground")}>{dueLabel(item.due_on, today)}</span>
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

/** The date: "Pick date", or the day ("Today", "Nov 21"), red when it's passed and not done. */
function DuePicker({ value, onChange, label, today = toDay(new Date()), overdue = false }: { value: string; onChange: (next: string) => void; label: string; today?: string; overdue?: boolean }) {
  const [open, setOpen] = useState(false);
  const day = parseDay(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label={value ? `${label}: ${dueLabel(value, today)}${overdue ? ", overdue" : ""}. Change` : `${label}: pick a date`}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-small font-medium outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/70",
          overdue ? "text-nia-danger" : value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <CalendarDays aria-hidden className="size-4" />
        <span className="tabular-nums">{value ? dueLabel(value, today) : "Date"}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={day}
          defaultMonth={day}
          today={parseDay(today)}
          onSelect={(next) => {
            onChange(next ? toDay(next) : "");
            setOpen(false);
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mt-1 w-full rounded-md py-1.5 text-small text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          >
            Clear date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
