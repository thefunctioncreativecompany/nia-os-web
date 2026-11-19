"use client";

import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { parseDay, toDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/nia/date-time-fields";
import { fieldClassName, fieldLabelClassName, selectTriggerClassName } from "@/components/projects/project-form";
import { addMeeting, type MeetingRow } from "@/features/meetings/data";
import { SOURCE_APPS, parseNotes } from "@/features/meetings/parse";
import { NOTES_ACCEPT, readNotesFile } from "@/features/meetings/read-file";

const UNKNOWN = "unknown";
const PASTE_MAX = 400_000;

// Adding a meeting's notes (docs/MEETINGS_SPEC.md, step 1): a file from any notetaker, or pasted
// text. Nia reads the title, the day, the summary and the transcript (parse.ts) and shows what it
// found to check before saving; everyone in the meeting must have known it was noted (POPIA, GDPR).
export function AddMeetingDialog({
  projectId,
  open,
  onOpenChange,
  onAdded,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (meeting: MeetingRow) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  // What the person changed; the rest follows the notes.
  const [title, setTitle] = useState<string | null>(null);
  const [day, setDay] = useState<string | null | undefined>(undefined);
  const [source, setSource] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const words = useDeferredValue(text);
  const notes = useMemo(() => (words.trim() ? parseNotes(words, fileName ?? "") : null), [words, fileName]);
  const finalTitle = (title ?? notes?.title ?? "").trim();
  const finalDay = day === undefined ? (notes?.heldOn ?? null) : day;
  const finalSource = source ?? notes?.sourceApp ?? UNKNOWN;

  const reset = () => {
    setText("");
    setFileName(null);
    setTitle(null);
    setDay(undefined);
    setSource(null);
    setConsent(false);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      const read = await readNotesFile(file);
      if (!read.trim()) throw new Error("There are no words in that file. Try another export, or paste the notes.");
      setFileName(file.name);
      setText(read);
      setTitle(null);
      setDay(undefined);
      setSource(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setReading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes || !finalTitle || !consent) return;
    setSaving(true);
    try {
      const meeting = await addMeeting({
        projectId,
        title: finalTitle.slice(0, 200),
        heldOn: finalDay,
        sourceApp: finalSource === UNKNOWN ? null : finalSource,
        fileName,
        attendees: notes.attendees,
        summary: notes.summary,
        transcript: notes.transcript,
      });
      toast.success(`${meeting.title} added`);
      onAdded(meeting);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(`Couldn't add the meeting: ${err instanceof Error ? err.message : "please try again"}`);
    } finally {
      setSaving(false);
    }
  };

  const found = notes
    ? [
        notes.summary && "a summary",
        notes.transcript.length > 0 && `a transcript (${notes.transcript.length} ${notes.transcript.length === 1 ? "turn" : "turns"}${notes.attendees.length ? `, ${notes.attendees.length} ${notes.attendees.length === 1 ? "person" : "people"}` : ""})`,
      ].filter(Boolean)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next && !saving) reset();
      }}
    >
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-xl flex-col gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-xl sm:p-8">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-h3 font-semibold tracking-tight">Add meeting notes</DialogTitle>
          <DialogDescription className="text-small text-muted-foreground">A file from Otter, Fireflies, Granola, Gemini, Zoom or Teams, or paste the notes.</DialogDescription>
        </div>

        <form onSubmit={save} className="flex flex-col gap-5">
          <input ref={input} type="file" accept={NOTES_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }} />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pick(e.dataTransfer.files?.[0]);
            }}
            className={cn("flex flex-col items-center gap-2 rounded-2xl border border-dashed p-5 text-center transition-colors duration-fast", dragging ? "border-nia-blue bg-nia-blue/5" : "border-border")}
          >
            <Button type="button" variant="secondary" disabled={reading} onClick={() => input.current?.click()}>
              <FileUp aria-hidden /> {reading ? "Reading…" : fileName ? "Choose another file" : "Choose a file"}
            </Button>
            <p className="text-caption text-muted-foreground">{fileName ?? ".txt, .md, .docx, .pdf, .vtt or .srt"}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-text`} className={fieldLabelClassName}>
              {fileName ? "The notes" : "Or paste the notes"}
            </Label>
            <Textarea
              id={`${id}-text`}
              value={text}
              maxLength={PASTE_MAX}
              onChange={(e) => {
                setText(e.target.value);
                if (!e.target.value) setFileName(null);
              }}
              placeholder="Paste the summary, the transcript or both"
              className="max-h-60 min-h-28 text-sm"
            />
            {found.length > 0 && <p className="text-caption text-muted-foreground">Found {found.join(" and ")}.</p>}
          </div>

          {notes && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-title`} className={fieldLabelClassName}>
                  Title
                </Label>
                <Input id={`${id}-title`} required maxLength={200} value={title ?? notes.title} onChange={(e) => setTitle(e.target.value)} className={fieldClassName} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${id}-day`} className={fieldLabelClassName}>
                    Date
                  </Label>
                  <DateField id={`${id}-day`} value={finalDay ? parseDay(finalDay) : undefined} onChange={(d) => setDay(d ? toDay(d) : null)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${id}-source`} className={fieldLabelClassName}>
                    Notes from
                  </Label>
                  <Select value={finalSource} onValueChange={setSource}>
                    <SelectTrigger id={`${id}-source`} className={selectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {SOURCE_APPS.map((app) => (
                        <SelectItem key={app} value={app}>
                          {app}
                        </SelectItem>
                      ))}
                      <SelectItem value={UNKNOWN}>Somewhere else</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-start gap-3 text-small text-foreground">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                Everyone in this meeting knew it was being recorded or noted.
              </label>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!notes || !finalTitle || !consent || saving}>
              {saving ? "Adding…" : "Add meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
