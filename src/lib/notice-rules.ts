// Which notifications reach the computer, and where clicking one goes (FEEDBACK D6). Shared by
// the open page (desktop-notices.ts) and the server's sender (push.ts), so both pick the same.
// Shares and access requests are "shared" rows; comments and replies are "activity" rows told
// apart by their wording (20261112000000_comments.sql); other activity (edits) stays in Updates.

export type NoticeRow = { id: number; user_id?: string; project_id: string | null; kind: string; title: string; body: string };

export function noticeFor(row: NoticeRow): { href: string } | null {
  const project = row.project_id ? `/projects/${row.project_id}` : "/home";
  if (row.kind === "shared") return { href: project };
  if (row.kind === "activity" && / commented on | replied to your comment /.test(` ${row.title} `)) return { href: row.project_id ? `${project}?tab=comments` : project };
  return null;
}
