import { parseDay, toDay } from "@/lib/dates";

// The rules behind a project's Key milestones (PR2): who the words name, which group an item is in,
// the order, and how a date reads. Shared by the Overview and the full view; tested in rules.test.ts.

export type Person = { id: string; name: string; role: string };
export type Dated = { due_on: string | null; position: number | null; created_at: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Who a new item's words name (Ika: "a crew name in the text assigns it to that person automatically").
 * A full name matches however it's typed; a first name only when typed with a capital ("Send the
 * call sheet to Maya"), so everyday words that are also names ("will", "may") don't assign anyone.
 * Several people with that first name: all of them, to choose from.
 */
export function namedIn<P extends Person>(text: string, crew: P[]): { word: string; people: P[] } | null {
  const full = crew.filter((p) => p.name.trim().length > 2 && new RegExp(`(^|[^\\p{L}])${escape(p.name.trim())}($|[^\\p{L}])`, "iu").test(text));
  if (full.length) return { word: full[0].name, people: full };
  for (const word of text.match(/\p{Lu}[\p{L}'-]+/gu) ?? []) {
    const people = crew.filter((p) => p.name.trim().split(/\s+/)[0].toLowerCase() === word.toLowerCase());
    if (people.length) return { word, people };
  }
  return null;
}

/** First name, or the full name when two people on the project share the first. */
export function shortName(person: Pick<Person, "name">, crew: Pick<Person, "name">[]) {
  const first = person.name.trim().split(/\s+/)[0];
  return crew.filter((p) => p.name.trim().split(/\s+/)[0] === first).length > 1 ? person.name : first;
}

// ---- Groups and order ----

export type Group = "overdue" | "week" | "later" | "none";
export const GROUP_LABEL: Record<Group, string> = { overdue: "Overdue", week: "This week", later: "Later", none: "No date" };
const RANK: Record<Group, number> = { overdue: 0, week: 1, later: 2, none: 3 };

/** Overdue, due within the next seven days, later, or no date. */
export function groupOf(item: Pick<Dated, "due_on">, today: string): Group {
  if (!item.due_on) return "none";
  if (item.due_on < today) return "overdue";
  const week = parseDay(today);
  week?.setDate(week.getDate() + 7);
  return week && item.due_on < toDay(week) ? "week" : "later";
}

/** Open items: by group, then the team's order within it, then by date, then as added. */
export const openOrder = (today: string) => (a: Dated, b: Dated) =>
  RANK[groupOf(a, today)] - RANK[groupOf(b, today)] ||
  (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) ||
  (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999") ||
  a.created_at.localeCompare(b.created_at);

/** "Today", "Tomorrow", "Nov 21" (the year only when it isn't this year). */
export function dueLabel(day: string, today: string) {
  if (day === today) return "Today";
  const date = parseDay(day);
  if (!date) return day;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (day === toDay(tomorrow)) return "Tomorrow";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

