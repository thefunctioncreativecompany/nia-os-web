"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { parseDay, toDay } from "@/lib/dates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/nia/lazy-calendar";
import { dueLabel } from "@/features/milestones/rules";

export { GROUP_LABEL, dueLabel, groupOf, namedIn, openOrder, shortName, type Group } from "@/features/milestones/rules";

// What the Overview's Key milestones and the full view share (PR2, Ika 2026-11-24: who's responsible,
// department, priority and stage, drag to reorder; 20261125000000_milestones_detail.sql).

export type Kind = "milestone" | "action";
export type Priority = "high" | "medium" | "low";
export type Item = {
  id: string;
  kind: Kind;
  title: string;
  due_on: string | null;
  done_at: string | null;
  created_at: string;
  position: number | null;
  /** Someone on this project's cast & crew (cast_crew.id). */
  assignee_id?: string | null;
  department?: string | null;
  priority?: Priority | null;
  stage?: string | null;
  notes?: string | null;
};

export const COLUMNS = "id, kind, title, due_on, done_at, created_at, position, assignee_id, department, priority, stage, notes";
// Before the details migration: the first version's columns.
export const BASIC_COLUMNS = "id, kind, title, due_on, done_at, created_at, position";

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

/** A project's open and done items; `detailed`: whether the details migration has run. */
export async function loadMilestones(projectId: string): Promise<{ items: Item[]; detailed: boolean } | null> {
  const db = createClient();
  const full = await db.from("project_milestones").select(COLUMNS).eq("project_id", projectId).is("deleted_at", null);
  if (!full.error) return { items: (full.data ?? []) as Item[], detailed: true };
  const basic = await db.from("project_milestones").select(BASIC_COLUMNS).eq("project_id", projectId).is("deleted_at", null);
  return basic.error ? null : { items: (basic.data ?? []) as Item[], detailed: false };
}

// ---- Who can be assigned: the project's cast & crew ----

export type CrewPerson = { id: string; name: string; role: string; department: string | null; photo: string | null };

/** This project's cast & crew, in the directory's order; null until loaded. */
export function useCrew(projectId: string): CrewPerson[] | null {
  const [crew, setCrew] = useState<CrewPerson[] | null>(null);
  useEffect(() => {
    let live = true;
    void createClient()
      .from("cast_crew")
      .select("id, role, department, person:people(name, photo_url)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("position")
      .then(({ data }) => {
        if (!live) return;
        type Row = { id: string; role: string; department: string | null; person: { name: string; photo_url: string | null } | null };
        setCrew(((data ?? []) as unknown as Row[]).flatMap((r) => (r.person ? [{ id: r.id, name: r.person.name, role: r.role, department: r.department, photo: r.person.photo_url }] : [])));
      });
    return () => {
      live = false;
    };
  }, [projectId]);
  return crew;
}

/** A person's picture, or their initials. */
export function Face({ person, size = "size-6" }: { person: Pick<CrewPerson, "name" | "photo">; size?: string }) {
  return person.photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- people's photos come from several places (Nia accounts, uploads)
    <img src={person.photo} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />
  ) : (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-secondary text-meta font-semibold text-foreground", size)}>
      {getInitials(person.name, "")}
    </span>
  );
}

// ---- Dates ----

/** The date: "Pick date", or the day ("Today", "Nov 21"), red when it's passed and not done. */
export function DuePicker({ value, onChange, label, today = toDay(new Date()), overdue = false }: { value: string; onChange: (next: string) => void; label: string; today?: string; overdue?: boolean }) {
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
