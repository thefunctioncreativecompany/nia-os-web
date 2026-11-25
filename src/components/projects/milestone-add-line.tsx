"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Flag, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BASIC_COLUMNS, COLUMNS, DuePicker, Face, namedIn, type CrewPerson, type Item, type Kind } from "./milestones-shared";

/**
 * One line to add an action or a milestone: Enter adds it and keeps the line ready for the next.
 * A crew member named in the words is assigned (PR2): their name shows as a token, × takes them off,
 * and two people with that first name means a choice. Assigning also fills in their department.
 */
export function MilestoneAddLine({
  projectId,
  crew,
  detailed,
  onAdded,
  onChange,
}: {
  projectId: string;
  crew: CrewPerson[] | null;
  /** Whether assignees and details can be saved (their migration has run). */
  detailed: boolean;
  onAdded: (item: Item) => void;
  onChange: (item: Item, patch: Partial<Item>) => void;
}) {
  const [kind, setKind] = useState<Kind>("action");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  // A name the person took off (×) stays off until the words change it.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const found = detailed && crew ? namedIn(title, crew) : null;
  const match = found && found.word !== dismissed ? found : null;
  const assignee = match ? (match.people.length === 1 ? match.people[0] : (match.people.find((p) => p.id === chosen) ?? null)) : null;

  const add = async () => {
    const text = title.trim().slice(0, 300);
    if (!text || busy) return;
    setBusy(true);
    const details = assignee ? { assignee_id: assignee.id, ...(assignee.department ? { department: assignee.department } : {}) } : {};
    const { data, error } = await createClient()
      .from("project_milestones")
      .insert({ project_id: projectId, kind, title: text, due_on: due || null, ...details })
      .select(detailed ? COLUMNS : BASIC_COLUMNS)
      .single();
    setBusy(false);
    if (error) return void toast.error("Couldn't add it. Try again.");
    const item = data as unknown as Item;
    onAdded(item);
    if (assignee) toast.success(`Assigned to ${assignee.name}`, { action: { label: "Undo", onClick: () => onChange(item, { assignee_id: null, department: null }) } });
    setTitle("");
    setDue("");
    setDismissed(null);
    setChosen(null);
    input.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
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
          placeholder={kind === "action" ? "Add an action, e.g. Send call sheet to Maya" : "Add a milestone or objective…"}
          className="h-8 min-w-40 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-nia-placeholder"
        />
        {assignee && (
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-secondary pr-1 pl-0.5 text-small font-semibold text-foreground">
            <Face person={assignee} size="size-6" />
            <span className="sr-only">Assigned to</span>
            {assignee.name}
            <button
              type="button"
              aria-label={`Don't assign ${assignee.name}`}
              onClick={() => (match && match.people.length > 1 ? setChosen(null) : setDismissed(match?.word ?? null))}
              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        )}
        <DuePicker value={due} onChange={setDue} label="Date" />
        <Button type="submit" variant="secondary" size="compact" disabled={!title.trim() || busy}>
          Add
        </Button>
      </form>
      {match && !assignee && (
        <div role="group" aria-label={`Which ${match.word}?`} className="flex flex-wrap items-center gap-2 pl-1">
          <span className="text-small text-muted-foreground">Which {match.word}?</span>
          {match.people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setChosen(p.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background pr-3 pl-1 text-small font-semibold text-foreground outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Face person={p} size="size-6" />
              {p.name}
              <span className="font-normal text-muted-foreground">{p.role}</span>
            </button>
          ))}
          <button type="button" onClick={() => setDismissed(match.word)} className="h-8 rounded-full px-2 text-small text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Nobody
          </button>
        </div>
      )}
    </div>
  );
}
