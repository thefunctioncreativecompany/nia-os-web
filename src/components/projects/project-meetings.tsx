"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { NotebookText, Plus } from "lucide-react";

import { formatDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { byNewest, peopleText, type MeetingRow } from "@/features/meetings/data";

// The pop-up and the panel load the first time they're needed.
const AddMeetingDialog = dynamic(() => import("./add-meeting-dialog").then((m) => m.AddMeetingDialog), { ssr: false });
const MeetingPanel = dynamic(() => import("./meeting-panel").then((m) => m.MeetingPanel), { ssr: false });

export const meetingMeta = (m: MeetingRow) => [m.heldOn && formatDay(m.heldOn), m.sourceApp, peopleText(m.attendees)].filter(Boolean).join(" · ");

// Meetings under the project's Details on Overview (docs/MEETINGS_SPEC.md, step 1; Ika 2026-11-18): notes
// from production meetings, added from any notetaker's export or pasted. Opening one shows its
// summary and transcript in the right panel (like the template preview), named in the address
// (?meeting=…) so a search result or a link opens it. Only editors get here (the page leaves it
// out for viewers; the database rules agree).
export function ProjectMeetings({ projectId, meetings: initial, aiReady }: { projectId: string; meetings: MeetingRow[]; /** Suggested changes are switched on (ANTHROPIC_API_KEY). */ aiReady: boolean }) {
  const params = useSearchParams();
  const [meetings, setMeetings] = useState(() => initial.toSorted(byNewest));
  const [adding, setAdding] = useState(false);
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
        <Button variant="outline" size="compact" onClick={() => setAdding(true)}>
          <Plus aria-hidden /> Add meeting
        </Button>
      </div>
      {meetings.length === 0 ? (
        <p className="text-small text-muted-foreground">Add notes from a production meeting: a file from Otter, Fireflies, Granola, Gemini, Zoom or Teams, or paste them.</p>
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
                  <NotebookText aria-hidden className="size-5 text-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground group-hover:underline">{m.title}</span>
                  <span className="block truncate text-caption text-muted-foreground">{meetingMeta(m) || "Meeting notes"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
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
