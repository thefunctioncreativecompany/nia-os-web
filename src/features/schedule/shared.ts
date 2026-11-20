// What Home's Upcoming schedule shows (upcoming.ts reads it, upcoming-schedule.tsx draws it).

export type UpcomingItem =
  | { kind: "meeting"; id: string; projectId: string; project: string; title: string; startsAt: string; endsAt: string | null; meetLink: string | null }
  | { kind: "shoot"; id: string; projectId: string; project: string; start: string; end: string | null };

/** How many Home shows; the rest open in the right panel (View all). */
export const UPCOMING_MAX = 6;
