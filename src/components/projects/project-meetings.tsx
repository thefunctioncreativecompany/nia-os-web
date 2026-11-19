"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, ChevronDown, FileUp, NotebookText, Plus, Video } from "lucide-react";
import { toast } from "sonner";

import { formatDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { byNewest, peopleText, type MeetingRow } from "@/features/meetings/data";

// The pop-up and the panel load the first time they're needed.
const AddMeetingDialog = dynamic(() => import("./add-meeting-dialog").then((m) => m.AddMeetingDialog), { ssr: false });
const MeetingPanel = dynamic(() => import("./meeting-panel").then((m) => m.MeetingPanel), { ssr: false });
const ScheduleMeetDialog = dynamic(() => import("./schedule-meet-dialog").then((m) => m.ScheduleMeetDialog), { ssr: false });

/** "10:00 AM – 10:30 AM" in the viewer's own time zone. */
export const meetingTime = (m: MeetingRow) => {
  if (!m.startsAt) return "";
  const t = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return m.endsAt ? `${t(m.startsAt)} – ${t(m.endsAt)}` : t(m.startsAt);
};

export const meetingMeta = (m: MeetingRow) => [m.heldOn && formatDay(m.heldOn), meetingTime(m), m.sourceApp, peopleText(m.attendees)].filter(Boolean).join(" · ");

// What happened at Google, after Connect Google Calendar (api/google/callback).
const GOOGLE_RESULT: Record<string, string> = {
  denied: "Google Calendar wasn't connected.",
  failed: "Google Calendar couldn't be connected. Try again.",
  calendar: "Nia needs to add events to your calendar to book meetings. Connect again and tick the calendar boxes.",
  off: "Google Calendar opens later in the beta.",
};

// Meetings under the project's Details on Overview (docs/MEETINGS_SPEC.md, step 1; Ika 2026-11-18): notes
// from production meetings, added from any notetaker's export or pasted. Opening one shows its
// summary and transcript in the right panel (like the template preview), named in the address
// (?meeting=…) so a search result or a link opens it. Only editors get here (the page leaves it
// out for viewers; the database rules agree).
export function ProjectMeetings({
  projectId,
  meetings: initial,
  aiReady,
  googleReady,
}: {
  projectId: string;
  meetings: MeetingRow[];
  /** Suggested changes are switched on (ANTHROPIC_API_KEY). */
  aiReady: boolean;
  /** Google Calendar is set up (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_KEY). */
  googleReady: boolean;
}) {
  const params = useSearchParams();
  const [meetings, setMeetings] = useState(() => initial.toSorted(byNewest));
  // Asked to add notes (?notes=1, from Home's Get started with): the notes pop-up starts open.
  const [adding, setAdding] = useState(() => !!params.get("notes"));
  // Back from Google, or asked to book: the booking pop-up starts open.
  const [scheduling, setScheduling] = useState(() => googleReady && (!!params.get("schedule") || params.get("google") === "connected"));

  // Back from Google (?google=connected, or why not) or asked to book (?schedule=1): say what
  // happened, then tidy the address.
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("google");
    const schedule = url.searchParams.get("schedule");
    const notes = url.searchParams.get("notes");
    if (!result && !schedule && !notes) return;
    if (result === "connected") toast.success("Google Calendar connected");
    else if (result && GOOGLE_RESULT[result]) toast.error(GOOGLE_RESULT[result]);
    url.searchParams.delete("google");
    url.searchParams.delete("schedule");
    url.searchParams.delete("notes");
    window.history.replaceState(window.history.state, "", url);
  }, []);
  const asked = params.get("meeting");
  const [openId, setOpenId] = useState<string | null>(asked);
  // A link to a meeting while this project is already open (a search result) changes only the address.
  const [seen, setSeen] = useState(asked);
  if (asked !== seen) {
    setSeen(asked);
    setOpenId(asked);
  }
  const open = meetings.find((m) => m.id === openId) ?? null;
  // The meeting just added reads its notes for suggested changes straight away.
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const show = (id: string | null) => {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("meeting", id);
    else url.searchParams.delete("meeting");
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <section aria-labelledby="meetings" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="meetings" className="text-subtitle font-semibold text-foreground">
          Meetings
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="compact">
              <Plus aria-hidden /> Add meeting <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem disabled={!googleReady} onSelect={() => setScheduling(true)} className="items-start gap-2.5 py-2">
              <CalendarPlus aria-hidden className="mt-0.5" />
              <span className="flex flex-col">
                Schedule a Google Meet
                {!googleReady && <span className="text-caption text-muted-foreground">Opens later in the beta</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAdding(true)} className="gap-2.5 py-2">
              <FileUp aria-hidden /> Add notes from a meeting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {meetings.length === 0 ? (
        <p className="text-small text-muted-foreground">Book a production meeting on Google Meet, or add notes from Otter, Fireflies, Granola, Gemini, Zoom or Teams.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {meetings.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => show(m.id)}
                aria-current={m.id === openId ? "true" : undefined}
                className="hover-sweep group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:border-nia-blue/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                  {m.meetLink ? <Video aria-hidden className="size-5 text-foreground" /> : <NotebookText aria-hidden className="size-5 text-foreground" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground group-hover:underline">{m.title}</span>
                  <span className="block truncate text-caption text-muted-foreground" suppressHydrationWarning>
                    {meetingMeta(m) || "Meeting notes"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {googleReady && (
        <ScheduleMeetDialog
          projectId={projectId}
          open={scheduling}
          onOpenChange={setScheduling}
          onBooked={(m) => {
            setMeetings((list) => [m, ...list].toSorted(byNewest));
            show(m.id);
          }}
        />
      )}
      <AddMeetingDialog
        projectId={projectId}
        open={adding}
        onOpenChange={setAdding}
        onAdded={(m) => {
          setMeetings((list) => [m, ...list].toSorted(byNewest));
          if (aiReady) setJustAdded(m.id);
          show(m.id);
        }}
      />
      {open && (
        <MeetingPanel
          key={open.id}
          projectId={projectId}
          meeting={open}
          autoPropose={open.id === justAdded}
          aiReady={aiReady}
          list={meetings}
          onNavigate={(m) => show(m.id)}
          onClose={() => show(null)}
          onChange={(next) => setMeetings((list) => list.map((m) => (m.id === next.id ? next : m)).toSorted(byNewest))}
          onRemoved={(id) => {
            show(null);
            setMeetings((list) => list.filter((m) => m.id !== id));
          }}
        />
      )}
    </section>
  );
}
