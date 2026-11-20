"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { toDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateField, TimeField } from "@/components/nia/date-time-fields";
import { LoadingDots } from "@/components/nia/loading-dots";
import { MultiSelect } from "@/components/nia/multi-select";
import { RecipientInput } from "@/components/nia/recipient-input";
import type { TimeValue } from "@/components/nia/time-wheel";
import { fieldClassName, fieldLabelClassName, selectTriggerClassName } from "@/components/projects/project-form";
import type { MeetingRow } from "@/features/meetings/data";
import { bookMeet, clashes, disconnectGoogle, googleStatus, type GoogleStatus } from "@/features/meetings/google-actions";

const LENGTHS = [15, 30, 45, 60, 90, 120];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Person = { id: string; name: string; role: string; kind: string; email: string | null };

/** The start as a Date in the person's own time zone. */
function startOf(day: Date, t: TimeValue) {
  const hour = (t.hour % 12) + (t.period === "PM" ? 12 : 0);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, t.minute);
}

const lengthText = (m: number) => (m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`.replace(".5", "½"));

// Schedule a Google Meet (docs/MEETINGS_SPEC.md, step 3): connect Google Calendar once (inside
// this pop-up), then book a production meeting: title, day, start, length and who's invited (the
// project's whole cast and crew, asking for an email where one's missing and keeping it on their
// profile; or any email). Before booking, Nia checks who's busy then
// and says so (rule: prevent mistakes, not report them); the button becomes "Book anyway". Google
// creates the event with a Meet link and emails the invites.
export function ScheduleMeetDialog({
  projectId,
  open,
  onOpenChange,
  onBooked,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: (meeting: MeetingRow) => void;
}) {
  const id = useId();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  // Empty with the suggestion greyed out and the cursor waiting (Ika, 2026-11-19); booked as
  // "Production meeting" if nothing is typed.
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [time, setTime] = useState<TimeValue>({ hour: 10, minute: 0, period: "AM" });
  const [length, setLength] = useState(30);
  const [crew, setCrew] = useState<string[]>([]);
  // Emails typed for picked people who had none, by person.
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [others, setOthers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busyNow, setBusyNow] = useState<string[] | null>(null);
  const [past, setPast] = useState(false);
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);

  // The connection and the project's cast and crew (as in Crew & talent), when the pop-up opens.
  useEffect(() => {
    if (!open) return;
    let live = true;
    googleStatus().then((s) => live && setStatus(s));
    createClient()
      .from("cast_crew")
      .select("role, kind, person:people(id, name, email)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("position")
      .then(({ data }) => {
        if (!live) return;
        const list = (data ?? []).flatMap((r) => {
          const p = r.person as unknown as { id: string; name: string; email: string | null } | null;
          return p ? [{ id: p.id, name: p.name, role: r.role as string, kind: r.kind as string, email: p.email }] : [];
        });
        // Someone with two roles is listed once.
        setPeople(list.filter((p, i) => list.findIndex((x) => x.id === p.id) === i));
      });
    return () => {
      live = false;
    };
  }, [open, projectId]);

  const picked = crew.flatMap((id) => people.filter((p) => p.id === id));
  // Picked people with no email yet: their email is asked for here.
  const needEmail = picked.filter((p) => !p.email);
  const missing = needEmail.filter((p) => !EMAIL.test((typed[p.id] ?? "").trim()));
  const badEmails = others.filter((e) => !EMAIL.test(e));
  const guests = useMemo(() => {
    const fromCrew = picked.map((p) => ({ email: (p.email ?? typed[p.id] ?? "").trim(), name: p.name })).filter((g) => EMAIL.test(g.email));
    const seen = new Set(fromCrew.map((g) => g.email.toLowerCase()));
    return [...fromCrew, ...others.filter((e) => EMAIL.test(e) && !seen.has(e.toLowerCase())).map((email) => ({ email, name: "" }))];
    // `picked` follows crew and people.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crew, people, typed, others]);
  const start = day ? startOf(day, time) : null;
  const end = start ? new Date(start.getTime() + length * 60_000) : null;

  // Who's busy then, a moment after the time or guests change.
  const slotKey = `${start?.toISOString()}|${end?.toISOString()}|${guests.map((g) => g.email).join(",")}`;
  useEffect(() => {
    if (!open || !status?.connected || !start || !end) return;
    let live = true;
    const timer = window.setTimeout(() => {
      setPast(start.getTime() < Date.now());
      clashes({ start: start.toISOString(), end: end.toISOString(), emails: guests.map((g) => g.email) }).then((list) => live && setBusyNow(list));
    }, 600);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // The slot's own key stands for start, end and guests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status?.connected, slotKey]);

  const busyNames = (busyNow ?? []).map((who) => (who === "you" ? "You" : (guests.find((g) => g.email === who)?.name || who)));
  // To Google and back to this project, where the booking pop-up opens again (?schedule=1).
  const connectHref = `/api/google/connect?next=${encodeURIComponent(`${pathname}?schedule=1`)}`;

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || !day || badEmails.length || missing.length) return;
    setSaving(true);
    try {
      const result = await bookMeet({
        projectId,
        title: title.trim() || "Production meeting",
        day: toDay(day),
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        emails: guests.map((g) => g.email),
        guests,
        note,
      });
      if (!result.ok) {
        toast.error(result.message);
        if (result.reconnect) setStatus((s) => (s ? { ...s, connected: false } : s));
        return;
      }
      toast.success(guests.length ? `${result.meeting.title} booked: invites sent` : `${result.meeting.title} booked`);
      // Emails typed here are kept on each person's profile, for next time.
      const db = createClient();
      await Promise.all(needEmail.map((p) => db.from("people").update({ email: typed[p.id].trim() }).eq("id", p.id)));
      onBooked(result.meeting);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-xl flex-col gap-6 overflow-y-auto rounded-2xl p-6 sm:max-w-xl sm:p-8">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-h3 font-semibold tracking-tight">Schedule a Google Meet</DialogTitle>
          <DialogDescription className="text-small text-muted-foreground">A Calendar event with a Meet link, and invites for everyone you add.</DialogDescription>
        </div>

        {!status ? (
          <LoadingDots label="Checking Google Calendar" />
        ) : !status.connected ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">Connect your Google Calendar once. Nia only creates the meetings you book here and checks when people are busy.</p>
            <Button asChild>
              {/* A full page visit: the address sends the browser on to Google. */}
              <a href={connectHref}>
                <CalendarPlus aria-hidden /> Connect Google Calendar
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={book} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-title`} className={fieldLabelClassName}>
                Title
              </Label>
              <Input id={`${id}-title`} autoFocus maxLength={200} placeholder="Production meeting" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClassName} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-day`} className={fieldLabelClassName}>
                  Date
                </Label>
                <DateField id={`${id}-day`} value={day} onChange={setDay} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-time`} className={fieldLabelClassName}>
                  Starts
                </Label>
                <TimeField id={`${id}-time`} value={time} onChange={setTime} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-length`} className={fieldLabelClassName}>
                  Length
                </Label>
                <Select value={String(length)} onValueChange={(v) => setLength(Number(v))}>
                  <SelectTrigger id={`${id}-length`} className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {LENGTHS.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {lengthText(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {people.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className={fieldLabelClassName}>From the cast and crew</span>
                <MultiSelect
                  label="Cast and crew"
                  placeholder="Choose people"
                  value={crew}
                  onChange={setCrew}
                  maxChips={4}
                  options={people.map((p) => ({ value: p.id, label: `${p.name} · ${p.role}`, group: p.kind === "cast" ? "Cast" : "Crew" }))}
                />
                {needEmail.map((p) => (
                  <div key={p.id} className="flex flex-col gap-1">
                    <Label htmlFor={`${id}-email-${p.id}`} className="text-caption text-muted-foreground">
                      {p.name}&apos;s email
                    </Label>
                    <Input
                      id={`${id}-email-${p.id}`}
                      type="email"
                      placeholder="name@example.com"
                      value={typed[p.id] ?? ""}
                      onChange={(e) => setTyped((t) => ({ ...t, [p.id]: e.target.value }))}
                      className={fieldClassName}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className={fieldLabelClassName}>{people.length ? "Other guests" : "Guests"}</span>
              <RecipientInput label="Guests' emails" placeholder="Add an email…" value={others} onChange={setOthers} />
              {badEmails.length > 0 && <p className="text-caption text-nia-danger">Check {badEmails.join(", ")}: that isn&apos;t an email address.</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-note`} className={fieldLabelClassName}>
                Agenda (optional)
              </Label>
              <Textarea id={`${id}-note`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} placeholder="What the meeting is for" className="min-h-20 text-sm" />
            </div>

            {(busyNames.length > 0 || past) && (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-status-pending px-3 py-2 text-small text-status-pending-foreground">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {past ? "That time has already passed." : `${busyNames.join(", ")} ${busyNames.length === 1 && busyNames[0] !== "You" ? "is" : "are"} busy then.`}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-caption text-muted-foreground">
                {status.email}
                {" · "}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={async () => {
                    await disconnectGoogle();
                    setStatus({ ...status, connected: false, email: null });
                    toast.success("Google Calendar disconnected");
                  }}
                >
                  Disconnect
                </button>
              </span>
              <span className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !day || badEmails.length > 0 || missing.length > 0 || past}>
                  {saving ? "Booking…" : busyNames.length ? "Book anyway" : "Book meeting"}
                </Button>
              </span>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
