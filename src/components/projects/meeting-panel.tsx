"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { parseDay, toDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/nia/confirm-dialog";
import { DateField } from "@/components/nia/date-time-fields";
import { SavedIndicator } from "@/components/nia/saved-indicator";
import { SearchInput } from "@/components/nia/search-input";
import { SectionTabs } from "@/components/nia/section-tabs";
import { PrevNext, SidePanel } from "@/components/nia/side-panel";
import { EditableText } from "@/components/projects/editable-text";
import { MeetingChanges } from "@/components/projects/meeting-changes";
import { loadMeeting, peopleText, removeMeeting, updateMeeting, type Meeting, type MeetingRow } from "@/features/meetings/data";
import { clock } from "@/features/meetings/parse";

type Tab = "summary" | "transcript" | "changes";
const PANEL_ID = "meeting-panel-body";

// A meeting in the right panel (docs/MEETINGS_SPEC.md, step 1), like the template preview: the
// title, the day and who was there, then the Summary (editable, saved as you leave it, with the
// original a tap away) and the Transcript (the record: read-only, with a find box). Previous /
// next and the arrow keys step through the project's meetings. Full width on phones and tablets.
export function MeetingPanel({
  projectId,
  meeting: row,
  autoPropose = false,
  aiReady,
  list,
  onNavigate,
  onClose,
  onChange,
  onRemoved,
}: {
  projectId: string;
  meeting: MeetingRow;
  /** A meeting just added: open on Changes and read the notes for suggestions straight away. */
  autoPropose?: boolean;
  /** Suggested changes are switched on. */
  aiReady: boolean;
  list: MeetingRow[];
  onNavigate: (meeting: MeetingRow) => void;
  onClose: () => void;
  onChange: (meeting: MeetingRow) => void;
  onRemoved: (id: string) => void;
}) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>(autoPropose ? "changes" : "summary");
  const [find, setFind] = useState("");
  const [savedAt, setSavedAt] = useState<number>();

  useEffect(() => {
    let live = true;
    loadMeeting(row.id).then(
      (m) => live && setMeeting(m),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [row.id]);

  const named = (m: MeetingRow | undefined) => (m ? { ...m, name: m.title } : null);
  const index = list.findIndex((m) => m.id === row.id);
  const prev = named(index > 0 ? list[index - 1] : undefined);
  const next = named(index >= 0 ? list[index + 1] : undefined);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, [contenteditable=true]")) return;
    if (e.key === "ArrowRight" && next) onNavigate(next);
    if (e.key === "ArrowLeft" && prev) onNavigate(prev);
  };

  const save = async (changes: { title?: string; held_on?: string | null; summary?: string }) => {
    try {
      await updateMeeting(row.id, changes);
    } catch (e) {
      toast.error(`Couldn't save: ${e instanceof Error ? e.message : "please try again"}`);
      throw e;
    }
    setSavedAt(Date.now());
    const updated = {
      ...row,
      ...(changes.title !== undefined && { title: changes.title }),
      ...(changes.held_on !== undefined && { heldOn: changes.held_on }),
    };
    onChange(updated);
    setMeeting((m) => (m ? { ...m, ...updated, ...(changes.summary !== undefined && { summary: changes.summary }) } : m));
  };

  const lines = useMemo(() => {
    const all = meeting?.transcript ?? [];
    const q = find.trim().toLowerCase();
    return q ? all.filter((l) => l.text.toLowerCase().includes(q) || l.speaker.toLowerCase().includes(q)) : all;
  }, [meeting, find]);

  const hasTranscript = (meeting?.transcript.length ?? 0) > 0;
  const waiting = meeting?.proposals?.filter((p) => p.status === "proposed").length ?? 0;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "summary", label: "Summary" },
    ...(hasTranscript ? [{ id: "transcript" as const, label: "Transcript", count: meeting!.transcript.length }] : []),
    { id: "changes", label: "Changes", count: waiting },
  ];
  const people = peopleText(row.attendees);

  return (
    <div className="max-lg:[--preview-panel-w:100vw]">
      <SidePanel
        label={`${row.title}, meeting notes`}
        onClose={onClose}
        onKeyDown={onKeyDown}
        tools={
          <>
            <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
            <ConfirmDialog
              title="Remove this meeting?"
              description="Its notes and transcript are removed from the project for everyone."
              confirmLabel="Remove"
              pendingLabel="Removing…"
              onConfirm={async () => {
                try {
                  await removeMeeting(row.id);
                } catch (e) {
                  toast.error(`Couldn't remove it: ${e instanceof Error ? e.message : "please try again"}`);
                  throw e;
                }
                toast.success(`${row.title} removed`);
                onRemoved(row.id);
              }}
            >
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${row.title}`}>
                <Trash2 />
              </Button>
            </ConfirmDialog>
          </>
        }
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 px-6 pt-6 pb-14 xl:px-9.5">
            <EditableText
              value={row.title}
              label="Meeting title"
              placeholder="Meeting title"
              maxLength={200}
              onSave={(title) => save({ title })}
              className="-mx-2 px-2 text-h2 font-semibold tracking-tight text-foreground"
            />
            <div className="flex flex-wrap items-center gap-2">
              <DateField
                value={row.heldOn ? parseDay(row.heldOn) : undefined}
                onChange={(d) => void save({ held_on: d ? toDay(d) : null }).catch(() => {})}
                placeholder="Add a date"
                className="h-8 w-auto gap-2 rounded-full px-3 text-small"
              />
              {people && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-small text-foreground">
                  <Users aria-hidden className="size-4 text-muted-foreground" />
                  {people}
                </span>
              )}
              {row.sourceApp && <span className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-small text-muted-foreground">From {row.sourceApp}</span>}
            </div>

            <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Meeting" panelId={PANEL_ID} end={savedAt ? <SavedIndicator savedAt={savedAt} /> : null} />

            <div id={PANEL_ID} role="tabpanel" aria-labelledby={`${PANEL_ID}-tab-${tab}`}>
              {failed ? (
                <p className="text-sm text-muted-foreground">Couldn&apos;t open these notes. Close the panel and try again.</p>
              ) : !meeting ? (
                <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading the notes">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : tab === "changes" ? (
                <MeetingChanges
                  projectId={projectId}
                  meetingId={row.id}
                  proposals={meeting.proposals}
                  auto={autoPropose}
                  ready={aiReady}
                  onChange={(proposals) => setMeeting((m) => (m ? { ...m, proposals } : m))}
                />
              ) : tab === "summary" ? (
                <div className="flex flex-col gap-3">
                  <EditableText
                    rich
                    value={meeting.summary}
                    label="Summary"
                    placeholder={hasTranscript ? "No summary came with these notes. Click to write one." : "Click to write a summary."}
                    maxLength={100000}
                    onSave={(summary) => save({ summary })}
                    className="-mx-2 px-2 py-1 text-sm leading-relaxed text-foreground"
                  />
                  {meeting.originalSummary && meeting.summary !== meeting.originalSummary && (
                    <Button variant="ghost" size="compact" className="w-fit" onClick={() => void save({ summary: meeting.originalSummary }).catch(() => {})}>
                      <RotateCcw aria-hidden /> Restore original
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <SearchInput value={find} onChange={setFind} placeholder="Find in the transcript" label="Find in the transcript" />
                  {find.trim() && (
                    <p className="text-caption text-muted-foreground" aria-live="polite">
                      {lines.length} {lines.length === 1 ? "match" : "matches"}
                    </p>
                  )}
                  <ol className="flex flex-col gap-4">
                    {lines.map((l, i) => (
                      <li key={i} className="flex flex-col gap-0.5">
                        <span className="flex items-baseline gap-2">
                          {l.speaker && <span className="text-small font-semibold text-foreground">{l.speaker}</span>}
                          {l.at !== null && <span className="text-caption text-muted-foreground tabular-nums">{clock(l.at)}</span>}
                        </span>
                        <p className="text-sm leading-relaxed text-foreground/85">{l.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}
