"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Ellipsis } from "lucide-react";
import { toast } from "sonner";

import { cn, getInitials } from "@/lib/utils";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Comments (Ika, 2026-11-11, after YouTube's): under a project's cover and description, for the people on it
// (viewers too), and under Explore titles and films, for anyone signed in. Newest first; replies
// one level deep under "N replies". Authors edit and remove their own; a project's owner can
// remove any on it. Loads when the section comes near the screen. Hidden until
// 20261112000000_comments.sql is run.

export type CommentsSubject = { projectId: string } | { slug: string };

type Row = {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_avatar: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  removed: boolean;
  mine: boolean;
  can_remove: boolean;
};
type Me = { name: string; email: string; avatar: string | null };

const MAX = 2000;

export function Comments({ subject, className }: { subject: CommentsSubject; className?: string }) {
  const pid = "projectId" in subject ? subject.projectId : null;
  const slug = "slug" in subject ? subject.slug : null;
  const box = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [off, setOff] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc("list_comments", { pid, slug });
    if (error) return setOff(true);
    setNow(Date.now());
    setRows((data as Row[]) ?? []);
  }, [pid, slug]);

  // First use: when the section is about to come into view.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.disconnect();
        void load();
        void (async () => {
          const db = createClient();
          const user = await currentUser(db);
          if (!user) return;
          const { data } = await db.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
          setMe({ name: data?.full_name ?? "", email: user.email ?? "", avatar: data?.avatar_url ?? null });
        })();
      },
      { rootMargin: "400px" },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, [load]);

  const post = async (words: string, parent: string | null) => {
    const { error } = await createClient().rpc("post_comment", { pid, slug, parent, words });
    if (error) {
      toast.error(error.message);
      return false;
    }
    await load();
    return true;
  };
  const edit = async (cid: string, words: string) => {
    const { error } = await createClient().rpc("edit_comment", { cid, words });
    if (error) {
      toast.error(error.message);
      return false;
    }
    await load();
    return true;
  };
  const remove = async (cid: string) => {
    const { error } = await createClient().rpc("remove_comment", { cid });
    if (error) return void toast.error(error.message);
    toast.success("Comment removed");
    await load();
  };

  if (off) return null;
  // Until they've loaded: a marker that tells the page when the section is near.
  if (!rows) return <div ref={box} aria-hidden className="h-px" />;
  const top = rows.filter((r) => !r.parent_id).reverse();
  const repliesTo = (id: string) => rows.filter((r) => r.parent_id === id);
  const count = rows.filter((r) => !r.removed).length;

  return (
    <section aria-labelledby="comments" className={cn("flex max-w-3xl flex-col gap-6", className)}>
      <h2 id="comments" className="text-subtitle font-semibold text-foreground">
        Comments {count > 0 && <span className="text-micro font-normal text-muted-foreground">{count}</span>}
      </h2>
      <Composer me={me} placeholder="Add a comment…" submitLabel="Comment" onSubmit={(words) => post(words, null)} />
      {top.length > 0 && (
        <ul className="flex flex-col gap-6">
          {top.map((c) => (
            <Thread key={c.id} comment={c} replies={repliesTo(c.id)} me={me} now={now} onPost={post} onEdit={edit} onRemove={remove} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Thread({
  comment,
  replies,
  me,
  now,
  onPost,
  onEdit,
  onRemove,
}: {
  comment: Row;
  replies: Row[];
  me: Me | null;
  now: number;
  onPost: (words: string, parent: string | null) => Promise<boolean>;
  onEdit: (cid: string, words: string) => Promise<boolean>;
  onRemove: (cid: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  return (
    <li className="flex flex-col gap-3">
      <Comment comment={comment} now={now} onReply={() => setReplying(true)} onEdit={onEdit} onRemove={onRemove} />
      <div className="flex flex-col gap-3 pl-13">
        {replying && (
          <Composer
            me={me}
            small
            autoFocus
            placeholder="Add a reply…"
            submitLabel="Reply"
            onCancel={() => setReplying(false)}
            onSubmit={async (words) => {
              const ok = await onPost(words, comment.id);
              if (ok) {
                setReplying(false);
                setOpen(true);
              }
              return ok;
            }}
          />
        )}
        {replies.length > 0 && (
          <>
            <Button type="button" variant="ghost" size="compact" className="w-fit gap-1.5 text-nia-blue" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <ChevronDown aria-hidden className={cn("transition-transform duration-fast", open && "rotate-180")} />
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </Button>
            {open && (
              <ul className="flex flex-col gap-4">
                {replies.map((r) => (
                  <li key={r.id}>
                    <Comment comment={r} now={now} small onReply={() => setReplying(true)} onEdit={onEdit} onRemove={onRemove} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function Comment({
  comment: c,
  now,
  small = false,
  onReply,
  onEdit,
  onRemove,
}: {
  comment: Row;
  now: number;
  small?: boolean;
  onReply: () => void;
  onEdit: (cid: string, words: string) => Promise<boolean>;
  onRemove: (cid: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  if (c.removed)
    return (
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn("shrink-0 rounded-full bg-secondary", small ? "size-6" : "size-10")} />
        <p className="text-sm text-muted-foreground">Comment removed</p>
      </div>
    );
  return (
    <article className="flex gap-3">
      <Avatar className={small ? "size-6" : "size-10"}>
        {c.author_avatar && <AvatarImage src={c.author_avatar} alt="" />}
        <AvatarFallback className={small ? "text-meta" : "text-caption"}>{getInitials(c.author_name, "")}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-small">
          <span className="font-semibold text-foreground">{c.author_name}</span>
          <time dateTime={c.created_at} className="text-caption text-muted-foreground">
            {timeAgo(c.created_at, now)}
            {c.edited_at && " (edited)"}
          </time>
        </p>
        {editing ? (
          <Composer
            me={null}
            small
            autoFocus
            initial={c.body}
            placeholder="Edit your comment…"
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSubmit={async (words) => {
              const ok = await onEdit(c.id, words);
              if (ok) setEditing(false);
              return ok;
            }}
          />
        ) : (
          <p className="text-sm leading-relaxed break-words whitespace-pre-line text-foreground">{c.body}</p>
        )}
        {!editing && (
          <div className="-ml-3 flex items-center gap-1">
            <Button type="button" variant="ghost" size="compact" onClick={onReply}>
              Reply
            </Button>
            {(c.mine || c.can_remove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Comment options">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {c.mine && <DropdownMenuItem onSelect={() => setEditing(true)}>Edit</DropdownMenuItem>}
                  <DropdownMenuItem variant="destructive" onSelect={() => void onRemove(c.id)}>
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// "Add a comment…" on one line; it grows as you write and shows Cancel and Comment once you start.
// Cmd or Ctrl + Enter sends.
function Composer({
  me,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  initial = "",
  small = false,
  autoFocus = false,
}: {
  me: Me | null;
  placeholder: string;
  submitLabel: string;
  onSubmit: (words: string) => Promise<boolean>;
  onCancel?: () => void;
  initial?: string;
  small?: boolean;
  autoFocus?: boolean;
}) {
  const [words, setWords] = useState(initial);
  const [active, setActive] = useState(autoFocus);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  // Grow with the words.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [words]);

  const send = async () => {
    if (!words.trim() || busy) return;
    setBusy(true);
    const ok = await onSubmit(words);
    setBusy(false);
    if (ok) {
      setWords("");
      setActive(Boolean(onCancel));
    }
  };
  const cancel = () => {
    setWords(initial);
    setActive(false);
    onCancel?.();
  };

  return (
    <div className="flex gap-3">
      {me && (
        <Avatar className={small ? "size-6" : "size-10"}>
          {me.avatar && <AvatarImage src={me.avatar} alt="" />}
          <AvatarFallback className={small ? "text-meta" : "text-caption"}>{getInitials(me.name, me.email)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <textarea
          ref={field}
          rows={1}
          value={words}
          maxLength={MAX}
          autoFocus={autoFocus}
          aria-label={placeholder.replace("…", "")}
          placeholder={placeholder}
          onFocus={() => setActive(true)}
          onChange={(e) => setWords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
            if (e.key === "Escape") cancel();
          }}
          className="w-full resize-none overflow-hidden border-0 border-b border-border bg-transparent px-0 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-nia-blue"
        />
        {active && (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="compact" onClick={cancel}>
              Cancel
            </Button>
            <Button type="button" size="compact" disabled={!words.trim() || busy} onClick={() => void send()}>
              {busy ? "Sending…" : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
