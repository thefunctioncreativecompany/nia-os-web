// Which notifications reach the computer, and where clicking one goes (FEEDBACK D6). Shared by
// the open page (desktop-notices.ts), the server's sender (push.ts) and Updates, so all pick the same.
// Each notification says what it's about (`event`, 20261128000000_more_notifications.sql). Older
// rows, or a database the migration hasn't reached, are told apart by their wording instead.

export type NoticeRow = { id: number; user_id?: string; project_id: string | null; kind: string; title: string; body: string; event?: string | null; link?: string | null };

/** What a notification is about. */
export function noticeEvent(row: Pick<NoticeRow, "kind" | "title" | "event">): string {
  if (row.event) return row.event;
  const t = ` ${row.title} `;
  if (row.kind === "shared") return / asked to (edit|open) /.test(t) ? "access_request" : /^ You can now (edit|open) /.test(t) ? "access_granted" : "shared";
  if (/ replied to your comment /.test(t)) return "reply";
  if (/ commented on /.test(t)) return "comment";
  return "activity";
}

/** These show on the computer; the rest (renames, covers, uploads, other edits) stay in Updates. */
const ON_COMPUTER = new Set([
  "shared",
  "access_request",
  "access_granted",
  "comment",
  "reply",
  "mention",
  "doc_added",
  "crew_added",
  "shoot_dates",
  "deliverables",
  "budget",
]);

const TAB: Record<string, string> = { comment: "comments", reply: "comments", mention: "comments", doc_added: "documents", crew_added: "crew" };

/** Where a notification opens: its own page when it has one (a meeting, a document), else the
 * project's tab it's about, else the project, else Home. */
export function noteHref(row: Pick<NoticeRow, "project_id" | "kind" | "title" | "event" | "link">): string {
  // Only a page inside Nia ("/…", never "//other.site").
  if (row.link && /^\/[A-Za-z0-9]/.test(row.link)) return row.link;
  if (!row.project_id) return "/home";
  const tab = TAB[noticeEvent(row)];
  return `/projects/${row.project_id}${tab ? `?tab=${tab}` : ""}`;
}

export function noticeFor(row: NoticeRow): { href: string } | null {
  return ON_COMPUTER.has(noticeEvent(row)) ? { href: noteHref(row) } : null;
}
