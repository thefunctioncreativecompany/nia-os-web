"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Bell, MailOpen } from "lucide-react";

import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SwipeActions, SwipeActionsRow } from "@/components/arc/swipe-actions/swipe-actions";

type Note = { id: number; project_id: string | null; title: string; body: string; read_at: string | null; created_at: string };

// Updates on Home (U1, Fix 8): who shared a project with you and what collaborators changed,
// as uiarc swipe rows: swipe to mark read or archive (a full swipe archives), tap to open the
// project. New ones arrive live. Hidden until the notifications table exists.
export function Updates() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let live = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, project_id, title, body, read_at, created_at")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!live) return;
      setNow(Date.now());
      setNotes(error ? null : (data as Note[]));
    };
    void load();
    // Row Level Security sends each person only their own new notifications.
    const channel = supabase
      .channel("home-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => void load())
      .subscribe();
    return () => {
      live = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  if (notes === null) return null;

  // Changes the list straight away; puts it back if the save fails, so it never shows what wasn't saved.
  // (A Supabase query only runs once it is awaited or `.then` is called.)
  const mark = (id: number, patch: { read_at?: string; archived_at?: string }) => {
    const before = notes;
    setNotes((list) => (list ?? []).flatMap((n) => (n.id !== id ? [n] : patch.archived_at ? [] : [{ ...n, read_at: patch.read_at ?? n.read_at }])));
    void createClient()
      .from("notifications")
      .update(patch)
      .eq("id", id)
      .then(({ error }) => {
        if (error) setNotes(before);
      });
  };
  const unread = notes.filter((n) => !n.read_at).length;

  return (
    <section aria-labelledby="updates" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bell aria-hidden className="size-4.5 text-muted-foreground" />
        <h2 id="updates" className="text-base leading-normal font-bold text-foreground">Updates</h2>
        {unread > 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-micro font-bold text-foreground">{unread} new</span>}
      </div>
      {notes.length === 0 ? (
        <p className="text-small text-muted-foreground">You&rsquo;re all caught up.</p>
      ) : (
        <SwipeActions label="Updates">
          {notes.map((n) => (
            <SwipeActionsRow
              key={n.id}
              label={n.title}
              leading={n.read_at ? [] : [{ label: "Mark read", icon: <MailOpen />, keepRow: true, onSelect: () => mark(n.id, { read_at: new Date().toISOString() }) }]}
              trailing={[{ label: "Archive", icon: <Archive />, onSelect: () => mark(n.id, { archived_at: new Date().toISOString() }) }]}
            >
              <button
                type="button"
                onClick={() => {
                  if (!n.read_at) mark(n.id, { read_at: new Date().toISOString() });
                  if (n.project_id) router.push(`/projects/${n.project_id}`);
                }}
                className="flex w-full min-w-0 items-start gap-3 text-left outline-none"
              >
                <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-gold")} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm text-foreground", !n.read_at && "font-semibold")}>{n.title}</span>
                  <span className="block truncate text-small text-muted-foreground">
                    {n.body ? `${n.body} · ` : ""}
                    {timeAgo(n.created_at, now)}
                  </span>
                </span>
              </button>
            </SwipeActionsRow>
          ))}
        </SwipeActions>
      )}
    </section>
  );
}
