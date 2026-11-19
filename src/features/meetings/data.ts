import { createClient } from "@/lib/supabase/client";
import type { TranscriptLine } from "@/features/meetings/parse";

// Meetings on a project (docs/MEETINGS_SPEC.md, step 1; table `meetings`,
// 20261120000000_meetings.sql). Only people who can edit the project see them (Ika, 2026-11-18).

/** A meeting as the Documents tab lists it (the words load when it's opened). */
export type MeetingRow = {
  id: string;
  title: string;
  /** "2026-11-18", or null. */
  heldOn: string | null;
  sourceApp: string | null;
  attendees: string[];
  createdAt: string;
};

/** A meeting opened in the panel. */
export type Meeting = MeetingRow & { summary: string; originalSummary: string; transcript: TranscriptLine[]; fileName: string | null };

export const MEETING_LIST_COLUMNS = "id, title, held_on, source_app, attendees, created_at";

type ListRow = { id: string; title: string; held_on: string | null; source_app: string | null; attendees: unknown; created_at: string };

const names = (attendees: unknown) =>
  Array.isArray(attendees) ? attendees.flatMap((a) => (a && typeof a === "object" && typeof (a as { name?: unknown }).name === "string" ? [(a as { name: string }).name] : [])) : [];

export const toMeetingRow = (m: ListRow): MeetingRow => ({
  id: m.id,
  title: m.title,
  heldOn: m.held_on,
  sourceApp: m.source_app,
  attendees: names(m.attendees),
  createdAt: m.created_at,
});

/** Who was there, briefly: "Thandi, Sam and 2 others". */
export function peopleText(names: string[]) {
  if (!names.length) return "";
  if (names.length <= 2) return names.join(" and ");
  return `${names[0]}, ${names[1]} and ${names.length - 2} ${names.length === 3 ? "other" : "others"}`;
}

/** Newest meeting first: by its day, then when it was added. */
export const byNewest = (a: MeetingRow, b: MeetingRow) => (b.heldOn ?? "").localeCompare(a.heldOn ?? "") || b.createdAt.localeCompare(a.createdAt);

export async function loadMeeting(id: string): Promise<Meeting> {
  const { data, error } = await createClient()
    .from("meetings")
    .select(`${MEETING_LIST_COLUMNS}, summary, original_summary, transcript, file_name`)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...toMeetingRow(data),
    summary: data.summary,
    originalSummary: data.original_summary,
    transcript: Array.isArray(data.transcript) ? (data.transcript as TranscriptLine[]) : [],
    fileName: data.file_name,
  };
}

export async function addMeeting(input: {
  projectId: string;
  title: string;
  heldOn: string | null;
  sourceApp: string | null;
  fileName: string | null;
  attendees: string[];
  summary: string;
  transcript: TranscriptLine[];
}): Promise<MeetingRow> {
  const { data, error } = await createClient()
    .from("meetings")
    .insert({
      project_id: input.projectId,
      title: input.title,
      held_on: input.heldOn,
      source_app: input.sourceApp,
      file_name: input.fileName,
      attendees: input.attendees.map((name) => ({ name })),
      summary: input.summary,
      original_summary: input.summary,
      transcript: input.transcript,
    })
    .select(MEETING_LIST_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toMeetingRow(data);
}

export async function updateMeeting(id: string, changes: { title?: string; held_on?: string | null; summary?: string }) {
  const { error } = await createClient()
    .from("meetings")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeMeeting(id: string) {
  const { error } = await createClient().rpc("remove_meeting", { meeting_id: id });
  if (error) throw new Error(error.message);
}
