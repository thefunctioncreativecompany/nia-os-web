"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, MailOpen } from "lucide-react";

import { describeActivity, timeAgo, type ActivityItem } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { SwipeActions, SwipeActionsRow } from "@/components/arc/swipe-actions/swipe-actions";
import { FileText } from "lucide-react";

type Note = { id: number; project_id: string | null; kind: "shared" | "activity"; title: string; body: string; read_at: string | null; archived_at: string | null; created_at: string };

type Row =
  | { kind: "note"; key: string; at: number; note: Note }
  | { kind: "activity"; key: string; at: number; item: ActivityItem };

// A notification and the activity row it came from are written together: the same project,
// the same kind of change (as in notify_project_member / notify_project_activity) and within
// this window. That change shows once, as the notification.
const SAME_CHANGE_MS = 5_000;
const NOTIFIED = { shared: ["shared"], activity: ["renamed", "updated", "cover_changed", "link_on", "link_off", "doc_added", "doc_removed", "doc_deleted", "files_added"] };
const LIMIT = 12;

// Activity on Home (H3): what's for you (shared with you, collaborators' changes, from
// `notifications`) merged with everything else from your projects, newest first, each change
// once. Notifications keep the gold dot and swipe to mark read or archive (U1); other rows open
// their project. New ones arrive live.
export function ActivityFeed({ items, now: serverNow }: { items: ActivityItem[]; now: number }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const supabase = createClient();
    let live = true;
    const load = async () => {
      // Archived ones too, so the activity row of an archived notification stays hidden.
      const { data, error } = await supabase
        .from("notifications")
        .select("id, project_id, kind, title, body, read_at, archived_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!live) return;
      setNow(Date.now());
      setNotes(error ? [] : (data as Note[]));
    };
    void load();
    // Row Level Security sends each person only their own notifications and their projects' activity.
    const channel = supabase
      .channel("home-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => void load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity" }, () => router.refresh())
      .subscribe();
    return () => {
      live = false;
      void supabase.removeChannel(channel);
    };
  }, [router]);

  if (notes === null) return <Skeleton className="h-60 rounded-xl" />;

  const fromNote = (item: ActivityItem) =>
    !item.isYou &&
    notes.some((n) => n.project_id === item.projectId && NOTIFIED[n.kind]?.includes(item.action) && Math.abs(Date.parse(n.created_at) - Date.parse(item.createdAt)) < SAME_CHANGE_MS);
  const rows: Row[] = [
    ...notes.filter((n) => !n.archived_at).map((note): Row => ({ kind: "note", key: `n${note.id}`, at: Date.parse(note.created_at), note })),
    ...items.filter((item) => !fromNote(item)).map((item): Row => ({ kind: "activity", key: `a${item.id}`, at: Date.parse(item.createdAt), item })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, LIMIT);
  const unread = notes.filter((n) => !n.read_at && !n.archived_at).length;

  const mark = (id: number, patch: { read_at?: string; archived_at?: string }) => {
    const before = notes;
    setNotes((list) => (list ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)));
    // A Supabase query only runs once it is awaited or `.then` is called.
    void createClient()
      .from("notifications")
      .update(patch)
      .eq("id", id)
      .then(({ error }) => {
        if (error) setNotes(before);
      });
  };

  return (
    <section aria-labelledby="activity" className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 id="activity" className="text-xl leading-[1.4] font-bold text-foreground">
          Activity
        </h2>
        {unread > 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-micro font-bold text-foreground">{unread} new</span>}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={FileText} message="No activity yet. Your projects' updates will appear here." />
      ) : (
        <SwipeActions label="Activity">
          {rows.map((row) =>
            row.kind === "note" ? (
              <SwipeActionsRow
                key={row.key}
                label={row.note.title}
                leading={row.note.read_at ? [] : [{ label: "Mark read", icon: <MailOpen />, keepRow: true, onSelect: () => mark(row.note.id, { read_at: new Date().toISOString() }) }]}
                trailing={[{ label: "Archive", icon: <Archive />, onSelect: () => mark(row.note.id, { archived_at: new Date().toISOString() }) }]}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!row.note.read_at) mark(row.note.id, { read_at: new Date().toISOString() });
                    if (row.note.project_id) router.push(`/projects/${row.note.project_id}`);
                  }}
                  className="flex w-full min-w-0 items-center gap-3 text-left outline-none"
                >
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center">
                    <span className={cn("size-2 rounded-full", row.note.read_at ? "bg-border" : "bg-gold")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm text-foreground", !row.note.read_at && "font-semibold")}>{row.note.title}</span>
                    <span className="block truncate text-small text-muted-foreground">
                      {row.note.body ? `${row.note.body} · ` : ""}
                      {timeAgo(row.note.created_at, now)}
                    </span>
                  </span>
                </button>
              </SwipeActionsRow>
            ) : (
              <SwipeActionsRow key={row.key} label={activityLabel(row.item)}>
                <ActivityRow item={row.item} now={now} onOpen={() => router.push(`/projects/${row.item.projectId}`)} />
              </SwipeActionsRow>
            ),
          )}
        </SwipeActions>
      )}
    </section>
  );
}

const who = (item: ActivityItem) => (item.isYou ? "You" : item.actorName || "Someone");

function activityLabel(item: ActivityItem) {
  const { verb, object } = describeActivity(item);
  return `${who(item)} ${verb} ${object}`;
}

function ActivityRow({ item, now, onOpen }: { item: ActivityItem; now: number; onOpen: () => void }) {
  const { verb, object } = describeActivity(item);
  const name = who(item);
  const content = (
    <>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-accent text-micro font-bold text-foreground">{getInitials(name === "You" ? item.actorName : name, name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          <strong className="font-bold">{name}</strong> {verb} <strong className="font-bold">{object}</strong>
        </span>
        <span className="block truncate text-small text-muted-foreground">{timeAgo(item.createdAt, now)}</span>
      </span>
    </>
  );
  // A deleted project has nowhere to open.
  if (item.action === "deleted") return <div className="flex w-full min-w-0 items-center gap-3">{content}</div>;
  return (
    <button type="button" onClick={onOpen} className="flex w-full min-w-0 items-center gap-3 text-left outline-none">
      {content}
    </button>
  );
}
