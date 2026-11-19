"use server";

import { z } from "zod";

import { accessToken, busy, createMeetEvent, disconnect, googleConfigured, GoogleError } from "@/lib/google";
import { emailAddress, rowId } from "@/lib/schemas";
import { getSession } from "@/lib/supabase/session";
import { MEETING_LIST_COLUMNS, toMeetingRow, type MeetingRow } from "@/features/meetings/data";

// Booking a production meeting through Google (docs/MEETINGS_SPEC.md, step 3), from the Schedule
// a Google Meet pop-up. Everything runs as the signed-in person: their Google connection
// (lib/google.ts) and their Nia access (the database rules decide who may add a meeting).

export type GoogleStatus = { configured: boolean; connected: boolean; email: string | null };

export async function googleStatus(): Promise<GoogleStatus> {
  const { supabase, user } = await getSession();
  if (!user || !googleConfigured()) return { configured: googleConfigured(), connected: false, email: null };
  const { data } = await supabase.from("google_connections").select("google_email").eq("user_id", user.id).maybeSingle();
  return { configured: true, connected: !!data, email: data?.google_email ?? null };
}

export async function disconnectGoogle() {
  const { user } = await getSession();
  if (user) await disconnect(user.id);
}

const slot = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  emails: z.array(emailAddress).max(50),
});

/** Who's busy then: "you" for the organiser, else the guests' emails Google lets them see. */
export async function clashes(input: z.input<typeof slot>): Promise<string[] | null> {
  const parsed = slot.safeParse(input);
  if (!parsed.success) return null;
  const { user } = await getSession();
  const token = user ? await accessToken(user.id) : null;
  if (!token) return null;
  try {
    return (await busy(token, parsed.data.start, parsed.data.end, parsed.data.emails)).map((id) => (id === "primary" ? "you" : id));
  } catch {
    return null;
  }
}

const booking = slot.extend({
  projectId: rowId,
  title: z.string().trim().min(1).max(200),
  /** The day in the organiser's time zone ("2026-11-20"). */
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1).max(64),
  guests: z.array(z.object({ email: emailAddress, name: z.string().trim().max(120) })).max(50),
  note: z.string().max(2000),
});

export type BookResult = { ok: true; meeting: MeetingRow } | { ok: false; message: string; reconnect?: boolean };

export async function bookMeet(input: z.input<typeof booking>): Promise<BookResult> {
  const parsed = booking.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the date, time and guests' emails." };
  const b = parsed.data;
  if (Date.parse(b.end) <= Date.parse(b.start)) return { ok: false, message: "The meeting has to end after it starts." };
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, message: "Sign in again to book." };
  const token = await accessToken(user.id);
  if (!token) return { ok: false, message: "Connect Google Calendar to book a Google Meet.", reconnect: true };

  // The meeting first: the database checks this person can edit the project.
  const { data: row, error } = await supabase
    .from("meetings")
    .insert({
      project_id: b.projectId,
      title: b.title,
      held_on: b.day,
      source: "google_meet",
      source_app: "Google Meet",
      attendees: b.guests.map((g) => ({ name: g.name || g.email })),
      starts_at: b.start,
      ends_at: b.end,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, message: error?.code === "42501" ? "Only people who can edit this project can book its meetings." : `Couldn't save the meeting: ${error?.message ?? "try again"}` };

  const { data: project } = await supabase.from("projects").select("title").eq("id", b.projectId).single();
  try {
    const event = await createMeetEvent(token, {
      title: b.title,
      description: [b.note.trim(), `Production meeting for ${project?.title || "a project"} on Nia.`].filter(Boolean).join("\n\n"),
      start: b.start,
      end: b.end,
      timeZone: b.timeZone,
      attendees: b.guests.map((g) => g.email),
      requestId: row.id,
    });
    const { data: saved, error: linkError } = await supabase
      .from("meetings")
      .update({ calendar_event_id: event.eventId, meet_link: event.meetLink, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select(MEETING_LIST_COLUMNS)
      .single();
    if (linkError || !saved) return { ok: false, message: "The meeting is booked in Google Calendar, but Nia couldn't save its link. Refresh the page." };
    return { ok: true, meeting: toMeetingRow(saved) };
  } catch (e) {
    // No event, no meeting: take the half-made one back out.
    await supabase.rpc("remove_meeting", { meeting_id: row.id });
    if (e instanceof GoogleError && (e.status === 401 || e.status === 403)) return { ok: false, message: "Google didn't allow that. Connect Google Calendar again.", reconnect: true };
    return { ok: false, message: "Google Calendar couldn't book it just now. Try again." };
  }
}
