"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, History } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { describeActivity, type ActivityItem } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { FilterChip, ResultCount } from "@/components/nia/filter-bar";

type Kind = "projects" | "documents" | "files" | "sharing";

const KINDS: { id: Kind; label: string; actions: string[]; words: RegExp; dot: string }[] = [
  { id: "projects", label: "Projects", actions: ["created", "renamed", "updated", "cover_changed", "deleted"], words: /project|renamed|cover|details/i, dot: "bg-phase-pre-foreground" },
  { id: "documents", label: "Documents", actions: ["doc_added", "doc_removed", "doc_deleted"], words: /document|call sheet|shotlist|invoice|script/i, dot: "bg-phase-production-foreground" },
  { id: "files", label: "Files", actions: ["files_added"], words: /file|upload/i, dot: "bg-phase-post-foreground" },
  { id: "sharing", label: "Sharing", actions: ["shared", "unshared", "link_on", "link_off"], words: /shared|invited|link/i, dot: "bg-phase-soon-foreground" },
];

type Note = { id: number; project_id: string | null; kind: "shared" | "activity"; title: string; body: string; read_at: string | null; archived_at: string | null; created_at: string };

// Notifications and activity rows, as one list (as on Home).
type Entry = {
  key: string;
  at: string;
  kind: Kind;
  projectId: string | null;
  projectTitle: string;
  person: string;
  line: ReactNode;
  unread: boolean;
  noteId?: number;
};

// A notification and the activity row it came from are written together (same project, same kind
// of change, within this window); that change shows once, as the notification. Same rule as Home.
const SAME_CHANGE_MS = 5_000;
const NOTIFIED = { shared: ["shared"], activity: ["renamed", "updated", "cover_changed", "link_on", "link_off", "doc_added", "doc_removed", "doc_deleted", "files_added"] };

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const monthShort = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short" });
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function fromActivity(item: ActivityItem): Entry {
  const { verb, object } = describeActivity(item);
  const person = item.isYou ? "You" : item.actorName || "Someone";
  return {
    key: `a${item.id}`,
    at: item.createdAt,
    kind: KINDS.find((k) => k.actions.includes(item.action))?.id ?? "projects",
    projectId: item.action === "deleted" ? null : item.projectId,
    projectTitle: item.projectTitle,
    person: person === "You" ? item.actorName || "You" : person,
    line: (
      <>
        <strong className="font-semibold">{person}</strong> {verb} <strong className="font-semibold">{object}</strong>
      </>
    ),
    unread: false,
  };
}

function fromNote(note: Note): Entry {
  const text = `${note.title} ${note.body}`;
  return {
    key: `n${note.id}`,
    at: note.created_at,
    kind: note.kind === "shared" ? "sharing" : (KINDS.find((k) => k.id !== "projects" && k.words.test(text))?.id ?? "projects"),
    projectId: note.project_id,
    projectTitle: "",
    person: note.title,
    line: (
      <>
        <span className={cn(!note.read_at && "font-semibold")}>{note.title}</span>
        {note.body && <span className="block text-small text-muted-foreground">{note.body}</span>}
      </>
    ),
    unread: !note.read_at,
    noteId: note.id,
  };
}

// All activity, full screen (Ika, 2026-10-20; after uiarc's changelog feed): what's for you and
// everything else from your projects, as on Home but complete. Filter by kind, a month bar that
// follows the scroll and jumps to a month, rows grouped by month that open to show the exact time
// and a way into the project. "Home" goes back.
export function ActivityPage({ items }: { items: ActivityItem[] }) {
  const reduce = useReducedMotion() ?? false;
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [filters, setFilters] = useState<Kind[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const groupRefs = useRef(new Map<string, HTMLElement>());
  const frame = useRef(0);

  useEffect(() => {
    let live = true;
    void createClient()
      .from("notifications")
      .select("id, project_id, kind, title, body, read_at, archived_at, created_at")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data, error }) => live && setNotes(error ? [] : (data as Note[])));
    return () => {
      live = false;
    };
  }, []);

  const entries = useMemo(() => {
    if (!notes) return null;
    const notified = (item: ActivityItem) =>
      !item.isYou &&
      notes.some((n) => n.project_id === item.projectId && NOTIFIED[n.kind]?.includes(item.action) && Math.abs(Date.parse(n.created_at) - Date.parse(item.createdAt)) < SAME_CHANGE_MS);
    return [...notes.filter((n) => !n.archived_at).map(fromNote), ...items.filter((i) => !notified(i)).map(fromActivity)].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }, [notes, items]);

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.id, (entries ?? []).filter((e) => e.kind === k.id).length])) as Record<Kind, number>, [entries]);
  const visible = useMemo(() => (entries ?? []).filter((e) => !filters.length || filters.includes(e.kind)), [entries, filters]);
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; short: string; entries: Entry[] }>();
    for (const entry of visible) {
      const key = monthKey(entry.at);
      if (!map.has(key)) map.set(key, { key, label: monthLabel(entry.at), short: monthShort(entry.at), entries: [] });
      map.get(key)!.entries.push(entry);
    }
    return [...map.values()];
  }, [visible]);
  const current = groups.find((g) => g.key === active) ?? groups[0];

  // The month bar follows the page as it scrolls.
  useEffect(() => {
    const sync = () => {
      frame.current = 0;
      let key = groups[0]?.key ?? "";
      for (const g of groups) {
        const el = groupRefs.current.get(g.key);
        if (el && el.getBoundingClientRect().top <= 180) key = g.key;
      }
      setActive(key);
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [groups]);

  const jumpTo = (key: string) => {
    const el = groupRefs.current.get(key);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 150, behavior: reduce ? "auto" : "smooth" });
  };
  const toggleFilter = (kind: Kind) => setFilters((f) => (f.includes(kind) ? f.filter((k) => k !== kind) : [...f, kind]));
  const toggle = (entry: Entry) => {
    setOpen((o) => (o.includes(entry.key) ? o.filter((x) => x !== entry.key) : [...o, entry.key]));
    // Opening a notification marks it read.
    if (entry.unread && entry.noteId) {
      setNotes((list) => (list ?? []).map((n) => (n.id === entry.noteId ? { ...n, read_at: new Date().toISOString() } : n)));
      void createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", entry.noteId).then(() => undefined);
    }
  };
  const ease: Transition = { duration: reduce ? 0 : DURATION.base, ease: [...EASE_OUT] };

  return (
    <div className="mx-auto flex w-full max-w-200 flex-col px-4 pt-8 pb-24 md:px-11">
      <Button variant="ghost" size="compact" asChild className="-ml-2.5 w-fit text-muted-foreground">
        <Link href="/home">
          <ArrowLeft aria-hidden /> Home
        </Link>
      </Button>
      <header className="mt-4 flex flex-col gap-1">
        <h1 className="text-display font-extrabold tracking-tight text-foreground">Activity</h1>
        <p className="text-lead text-muted-foreground">What&rsquo;s for you, and everything else from your projects, newest first.</p>
      </header>

      {entries === null ? (
        <Skeleton className="mt-8 h-96 rounded-xl" />
      ) : entries.length === 0 ? (
        <EmptyState icon={History} message="No activity yet. Your projects' updates will appear here." className="mt-10" />
      ) : (
        <>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Filter by kind" className="flex flex-wrap items-center gap-2">
              {KINDS.map((kind) => {
                const on = filters.includes(kind.id);
                return (
                  <FilterChip key={kind.id} on={on} onClick={() => toggleFilter(kind.id)} count={counts[kind.id]}>
                    <span aria-hidden className={cn("grid place-items-center rounded-full text-white transition-[width,height] duration-fast", kind.dot, on ? "size-4" : "size-1.75")}>
                      {on && <Check className="size-2.75" strokeWidth={3} />}
                    </span>
                    {kind.label}
                  </FilterChip>
                );
              })}
              {filters.length > 0 && (
                <button type="button" onClick={() => setFilters([])} className="rounded-sm px-1.5 text-small font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  Show all
                </button>
              )}
            </div>
            <ResultCount>{filters.length ? `${visible.length} of ${entries.length} updates` : `${entries.length} updates`}</ResultCount>
          </div>

          {/* The month bar: where you are, and a way to jump. Sticks to the top while scrolling. */}
          <div className="sticky top-0 z-10 -mx-4 mt-5 flex items-center justify-between gap-4 border-b border-border bg-white/90 px-4 py-3 backdrop-blur md:-mx-11 md:px-11">
            <span aria-hidden className="truncate text-lead font-semibold text-foreground">
              {current?.label ?? "No updates"}
              {current && <span className="ml-2 text-small font-normal text-muted-foreground">{current.entries.length} {current.entries.length === 1 ? "update" : "updates"}</span>}
            </span>
            <nav aria-label="Jump to month" className="flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none]">
              {groups.map((g) => {
                const selected = g.key === current?.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    aria-label={`Jump to ${g.label}`}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => jumpTo(g.key)}
                    className="relative isolate h-8 rounded-full px-3 text-small font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:text-foreground"
                  >
                    {selected && <motion.span layoutId="activity-month" aria-hidden className="absolute inset-0 -z-10 rounded-full bg-secondary" transition={ease} />}
                    {g.short}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col">
            {groups.map((g, i) => (
              <section
                key={g.key}
                ref={(el) => {
                  if (el) groupRefs.current.set(g.key, el);
                  else groupRefs.current.delete(g.key);
                }}
                aria-labelledby={`month-${g.key}`}
                className="pt-6"
              >
                <h2 id={`month-${g.key}`} className={i === 0 ? "sr-only" : "pb-2 text-small font-semibold text-muted-foreground"}>
                  {g.label}
                </h2>
                <ul className="flex flex-col">
                  {g.entries.map((entry) => (
                    <Row key={entry.key} entry={entry} open={open.includes(entry.key)} onToggle={() => toggle(entry)} ease={ease} />
                  ))}
                </ul>
              </section>
            ))}
            {visible.length > 0 ? (
              <p className="pt-8 text-small text-muted-foreground">That&rsquo;s everything since {monthLabel(visible[visible.length - 1].at)}.</p>
            ) : (
              <p className="pt-8 text-small text-muted-foreground">Nothing of that kind yet. Choose another, or Show all.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ entry, open, onToggle, ease }: { entry: Entry; open: boolean; onToggle: () => void; ease: Transition }) {
  const kind = KINDS.find((k) => k.id === entry.kind)!;
  const panel = `activity-${entry.key}`;

  return (
    <li className="border-b border-secondary">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={onToggle}
        className="flex w-full items-start gap-4 py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex w-14 shrink-0 flex-col pt-0.5 text-small text-muted-foreground">
          <time dateTime={entry.at}>{dayLabel(entry.at)}</time>
          <span className="text-caption">{timeLabel(entry.at)}</span>
        </span>
        <span className="relative shrink-0">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-micro font-bold text-foreground">{getInitials(entry.person, entry.person)}</AvatarFallback>
          </Avatar>
          {entry.unread && <span aria-label="New" className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-gold" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
            <i aria-hidden className={cn("size-1.75 rounded-full", kind.dot)} />
            {kind.label}
          </span>
          <span className="block text-sm text-foreground">{entry.line}</span>
        </span>
        <motion.span aria-hidden initial={false} animate={{ rotate: open ? 180 : 0 }} transition={ease} className="mt-1 shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="panel" id={panel} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={ease} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 sm:pl-30">
              <span className="text-small text-muted-foreground">
                {new Date(entry.at).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {entry.projectTitle ? ` · ${entry.projectTitle}` : ""}
              </span>
              {entry.projectId && (
                <Button variant="outline" size="compact" asChild>
                  <Link href={`/projects/${entry.projectId}`}>
                    Open project <ArrowRight aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
