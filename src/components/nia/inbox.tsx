import { AtSign, CircleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Inbox and notification rows (design system Section 19).

// One message in the inbox: unread dot, sender, first line, when (19.1).
export function InboxItem({
  sender,
  preview,
  time,
  unread = false,
  href,
}: {
  sender: string;
  preview: string;
  time: string;
  unread?: boolean;
  href?: string;
}) {
  const Root = href ? "a" : "div";
  return (
    <Root
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-white py-3 pr-3.5 pl-3 outline-none transition-colors duration-fast hover:bg-nia-panel focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", unread ? "bg-foreground" : "bg-transparent")} />
      <Avatar className="size-8">
        <AvatarFallback className="bg-muted text-micro font-bold">{sender[0]}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm text-foreground", unread && "font-bold")}>
          {unread && <span className="sr-only">Unread: </span>}
          {sender}
        </span>
        <span className="truncate text-small text-muted-foreground">{preview}</span>
      </span>
      <span className="shrink-0 self-start pt-0.5 text-micro text-muted-foreground">{time}</span>
    </Root>
  );
}

export type TimelineEntry = { id: string; text: React.ReactNode; object?: string; time: string };

// A vertical activity log with a connecting line (19.2).
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {entries.map((entry, i) => (
        <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < entries.length - 1 && <span aria-hidden className="absolute top-3 bottom-0 left-[3px] w-px bg-border" />}
          <span aria-hidden className="mt-1.5 size-[7px] shrink-0 rounded-full bg-foreground" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm text-foreground">
              {entry.text}
              {entry.object && <span className="text-muted-foreground"> {entry.object}</span>}
            </p>
            <span className="text-micro text-muted-foreground">{entry.time}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

// "TODAY · Mark all read" above a group of notifications (19.3).
export function NotificationGroup({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-micro font-bold tracking-wide text-muted-foreground uppercase">{label}</h4>
        {action}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

export function NotificationItem({
  title,
  description,
  icon: Icon = CircleAlert,
  tone = "danger",
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  tone?: "danger" | "info" | "default";
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3">
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "danger" && "text-nia-danger",
          tone === "info" && "text-status-on-hold-foreground",
          tone === "default" && "text-foreground",
        )}
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-bold text-foreground">{title}</span>
        <span className="text-small text-muted-foreground">{description}</span>
      </span>
    </li>
  );
}

export type ChatMessage = { id: string; author: string; text: string; mine?: boolean };

// A short preview of a crew channel (19.4). Your messages sit in dark bubbles.
export function ChatThread({
  channel,
  online = false,
  messages,
  className,
}: {
  channel: string;
  online?: boolean;
  messages: ChatMessage[];
  className?: string;
}) {
  return (
    <section aria-label={channel} className={cn("flex flex-col gap-4 rounded-xl border border-border bg-white p-4", className)}>
      <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <span aria-hidden className={cn("size-2 rounded-full", online ? "bg-nia-success" : "bg-border")} />
        {channel}
        {online && <span className="sr-only">(active)</span>}
      </h4>
      <ol className="flex flex-col gap-3">
        {messages.map((m) => (
          <li key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", m.mine && "self-start")}>
            {!m.mine && <span className="text-micro font-bold text-muted-foreground">{m.author}</span>}
            <p
              className={cn(
                "w-fit rounded-lg text-sm",
                m.mine ? "bg-foreground px-2.5 py-2 text-primary-foreground" : "px-0 text-foreground",
              )}
            >
              {m.mine && <span className="sr-only">You: </span>}
              {m.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Someone tagged you in a note (19.5).
export function MentionCard({
  title,
  time,
  quote,
  action,
}: {
  title: string;
  time: string;
  quote: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
      <header className="flex items-center gap-2">
        <AtSign aria-hidden className="size-4 shrink-0 text-foreground" />
        <h4 className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{title}</h4>
        <span className="shrink-0 text-micro text-muted-foreground">{time}</span>
      </header>
      <blockquote className="text-sm text-muted-foreground">{quote}</blockquote>
      {action}
    </article>
  );
}
