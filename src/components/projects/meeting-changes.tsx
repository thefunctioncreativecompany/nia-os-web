"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { formatDay } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingDots } from "@/components/nia/loading-dots";
import { NotYet } from "@/components/nia/not-yet";
import { applyProposals, dismissProposals } from "@/features/meetings/apply";
import { proposeChanges } from "@/features/meetings/propose";
import { DATE_FIELDS, PROJECT_FIELDS, type Proposal } from "@/features/meetings/proposals";

const GROUPS: { label: string; kinds: Proposal["kind"][] }[] = [
  { label: "Milestones and actions", kinds: ["action", "milestone"] },
  { label: "Cast and crew", kinds: ["person"] },
  { label: "Project details", kinds: ["project"] },
];

/** The "AI draft" marker (Ika, 2026-11-18: a Nia Blue tint chip; gold is banned). */
export function AiDraftChip() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-nia-blue/10 px-2.5 text-caption font-medium text-nia-blue">
      <Sparkles aria-hidden className="size-3.5" />
      AI draft
    </span>
  );
}

const dayText = (d: string | null) => (d ? formatDay(d) : "");

/** Where it lands, in a few words: "Action · due Dec 12, 2026". */
function landing(p: Proposal) {
  if (p.kind === "action" || p.kind === "milestone") return [p.kind === "action" ? "Action" : "Milestone", p.dueOn && `due ${dayText(p.dueOn)}`].filter(Boolean).join(" · ");
  if (p.kind !== "project") return ["Cast and crew", p.email].filter(Boolean).join(" · ");
  const show = (v: string) => (DATE_FIELDS.has(p.field) ? dayText(v) : v);
  return `${PROJECT_FIELDS[p.field]}${p.was ? ` · was ${show(p.was)}` : ""}`;
}

/** What it changes, in a line: the action's words, "Name, Role", or the new value. */
function headline(p: Proposal) {
  if (p.kind === "action" || p.kind === "milestone") return p.title;
  if (p.kind !== "project") return `${p.name}, ${p.role}`;
  return DATE_FIELDS.has(p.field) ? dayText(p.value) : p.value;
}

// The Changes tab of a meeting (docs/MEETINGS_SPEC.md, step 2): what Nia suggests from the notes,
// marked AI draft, grouped by where it goes. Each is ticked to start; the words of an action or
// milestone can be changed before applying (Modify). Apply (the panel's one blue button) makes the
// ticked ones; Dismiss sets the rest aside. Nothing changes in the project without Apply.
export function MeetingChanges({
  projectId,
  meetingId,
  proposals,
  auto,
  ready,
  onChange,
}: {
  projectId: string;
  meetingId: string;
  proposals: Proposal[] | null;
  /** Read the notes straight away (a meeting just added). */
  auto?: boolean;
  /** Claude is switched on (ANTHROPIC_API_KEY); until then the tab says it's coming. */
  ready: boolean;
  onChange: (proposals: Proposal[]) => void;
}) {
  const router = useRouter();
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const read = async () => {
    setReading(true);
    setProblem(null);
    try {
      const result = await proposeChanges(meetingId);
      if (result.ok) {
        setOff(new Set());
        setEdits({});
        onChange(result.proposals);
      } else setProblem(result.message);
    } catch {
      setProblem("Nia couldn't read the notes just now. Try again.");
    } finally {
      setReading(false);
    }
  };

  useEffect(() => {
    if (auto && proposals === null && !started.current) {
      started.current = true;
      void read();
    }
    // Once, when a meeting has just been added.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, proposals]);

  if (!ready && !proposals?.length)
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <p className="text-sm text-muted-foreground">Nia will read the notes and suggest milestones, actions, people and dates to add to the project. Nothing changes until you apply it.</p>
        <Button disabled>
          <Sparkles aria-hidden /> Suggest changes
        </Button>
        <NotYet>Opens with Nia&apos;s AI, later in the beta</NotYet>
      </div>
    );

  if (reading)
    return (
      <div className="flex flex-col items-start gap-2 py-2" aria-live="polite">
        <LoadingDots label="Reading the notes" />
        <p className="text-small text-muted-foreground">Reading the notes for milestones, people and dates…</p>
      </div>
    );

  if (proposals === null || problem)
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <p className="text-sm text-muted-foreground">{problem ?? "Nia reads the notes and suggests milestones, actions, people and dates to add to the project. Nothing changes until you apply it."}</p>
        <Button onClick={() => void read()}>
          <Sparkles aria-hidden /> {problem ? "Try again" : "Suggest changes"}
        </Button>
      </div>
    );

  const open = proposals.filter((p) => p.status === "proposed");
  const applied = proposals.filter((p) => p.status === "applied");
  const chosen = open.filter((p) => !off.has(p.id));
  const withEdits = (p: Proposal): Proposal => ((p.kind === "action" || p.kind === "milestone") && edits[p.id]?.trim() ? { ...p, title: edits[p.id].trim().slice(0, 300) } : p);

  const apply = async () => {
    setBusy(true);
    try {
      const { proposals: next, failed } = await applyProposals(projectId, meetingId, proposals, chosen.map(withEdits));
      onChange(next);
      setOff(new Set());
      const n = chosen.length - failed.length;
      if (n) toast.success(`${n} ${n === 1 ? "change" : "changes"} applied to the project`);
      if (failed.length) toast.error(`Couldn't apply: ${failed.join(", ")}`);
      router.refresh();
    } catch (e) {
      toast.error(`Couldn't apply the changes: ${e instanceof Error ? e.message : "please try again"}`);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    setBusy(true);
    try {
      onChange(await dismissProposals(meetingId, proposals));
    } catch (e) {
      toast.error(`Couldn't dismiss them: ${e instanceof Error ? e.message : "please try again"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {open.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <AiDraftChip />
            <span className="text-caption text-muted-foreground">
              {chosen.length} of {open.length} ticked
            </span>
          </div>
          {GROUPS.map((g) => {
            const items = open.filter((p) => g.kinds.includes(p.kind));
            if (!items.length) return null;
            return (
              <section key={g.label} aria-label={g.label} className="flex flex-col gap-3">
                <h3 className="text-small font-semibold text-foreground">{g.label}</h3>
                <ul className="flex flex-col gap-2">
                  {items.map((p) => {
                    const on = !off.has(p.id);
                    const editable = p.kind === "action" || p.kind === "milestone";
                    return (
                      <li key={p.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                        <Checkbox
                          checked={on}
                          aria-label={`Apply: ${headline(p)}`}
                          onCheckedChange={(v) =>
                            setOff((s) => {
                              const next = new Set(s);
                              if (v === true) next.delete(p.id);
                              else next.add(p.id);
                              return next;
                            })
                          }
                          className="mt-1"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          {editable ? (
                            <input
                              value={edits[p.id] ?? headline(p)}
                              onChange={(e) => setEdits((x) => ({ ...x, [p.id]: e.target.value }))}
                              maxLength={300}
                              aria-label="Change the words"
                              className="-mx-1 rounded-md bg-transparent px-1 text-sm font-medium text-foreground outline-none hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                          ) : (
                            <span className="text-sm font-medium text-foreground">{headline(p)}</span>
                          )}
                          <span className="text-caption text-muted-foreground">{landing(p)}</span>
                          {p.quote && <q className="text-caption text-muted-foreground/80 italic">{p.quote}</q>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <div className="sticky bottom-0 -mx-1 flex justify-end gap-3 bg-background/90 px-1 py-3 backdrop-blur-md">
            <Button variant="secondary" disabled={busy} onClick={() => void dismiss()}>
              Dismiss
            </Button>
            <Button disabled={busy || chosen.length === 0} onClick={() => void apply()}>
              {busy ? "Applying…" : `Apply ${chosen.length === open.length ? "all" : chosen.length}`}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {proposals.length === 0 ? "Nia found nothing to change in these notes." : applied.length ? "All set: the changes you chose are on the project." : "Suggestions dismissed."}
          </p>
          {ready && (
            <Button variant="secondary" onClick={() => void read()}>
              <Sparkles aria-hidden /> Suggest again
            </Button>
          )}
        </div>
      )}
      {applied.length > 0 && (
        <section aria-label="Applied" className="flex flex-col gap-2">
          <h3 className="text-small font-semibold text-muted-foreground">Applied</h3>
          <ul className="flex flex-col gap-1.5">
            {applied.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-small text-muted-foreground">
                <Check aria-hidden className="size-4 shrink-0" />
                <span className="truncate">
                  {headline(p)} · {landing(p)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
