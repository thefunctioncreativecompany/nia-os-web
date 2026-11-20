import "server-only";

import { getSession } from "@/lib/supabase/session";
import type { UpcomingItem } from "./shared";

// Home's Upcoming schedule (Ika, 2026-11-19: "show booked meetings and productions"): the meetings
// booked through Google Meet that haven't ended, and the projects whose shoot hasn't wrapped, in
// one list, soonest first. Read as the signed-in person, so the database rules decide what's
// theirs (meetings: editors of the project only). Times stay as stored: the list shows them in
// the person's own time zone (upcoming-schedule.tsx).

/** How far ahead the panel goes: this many of each. */
const LOAD = 30;

export async function listUpcoming(): Promise<UpcomingItem[]> {
  const { supabase, user } = await getSession();
  if (!user) return [];
  const now = new Date();
  // A day of slack either side of UTC: the browser decides what "today" is.
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const [meetings, shoots] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, project_id, starts_at, ends_at, meet_link, project:projects!inner(title, deleted_at)")
      .is("deleted_at", null)
      .is("project.deleted_at", null)
      .not("starts_at", "is", null)
      .gte("ends_at", now.toISOString())
      .order("starts_at")
      .limit(LOAD),
    supabase
      .from("projects")
      .select("id, title, shoot_start, shoot_end")
      .is("deleted_at", null)
      .not("shoot_start", "is", null)
      .or(`shoot_end.gte.${yesterday},and(shoot_end.is.null,shoot_start.gte.${yesterday})`)
      .order("shoot_start")
      .limit(LOAD),
  ]);

  const items: UpcomingItem[] = [
    ...(meetings.data ?? []).map((m) => ({
      kind: "meeting" as const,
      id: m.id as string,
      projectId: m.project_id as string,
      project: ((m.project as unknown as { title: string } | null)?.title || "Untitled project") as string,
      title: m.title as string,
      startsAt: m.starts_at as string,
      endsAt: (m.ends_at as string | null) ?? null,
      meetLink: (m.meet_link as string | null) ?? null,
    })),
    ...(shoots.data ?? []).map((p) => ({
      kind: "shoot" as const,
      id: p.id as string,
      projectId: p.id as string,
      project: (p.title as string) || "Untitled project",
      start: p.shoot_start as string,
      end: (p.shoot_end as string | null) ?? null,
    })),
  ];
  return items;
}
