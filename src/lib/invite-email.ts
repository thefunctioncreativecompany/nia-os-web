// The email someone gets when a project is shared with them (Fix 8). Same look as the sign-up
// email in supabase/email-templates/confirm-signup.html; email clients need inline styles and
// fixed colours, so the hex values here are the email copy of the theme, not page styles.

export type InviteEmail = {
  actor: string; // who shared it
  projectTitle: string;
  role: "editor" | "viewer";
  hasAccount: boolean; // false: they need to sign up with this address first
  email: string; // the address it goes to
  link: string; // the project page, or sign-up for people without an account
};

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// One line, so a name or title can't add lines to the subject.
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

export function inviteEmail({ actor, projectTitle, role, hasAccount, email, link }: InviteEmail) {
  const who = oneLine(actor) || "Someone";
  const title = oneLine(projectTitle) || "Untitled project";
  const access = role === "editor" ? "edit" : "view";
  const subject = `${who} shared ${title} with you`;
  const lead = hasAccount
    ? `You can ${access} it on Nia.`
    : `You can ${access} it on Nia. Sign up with ${email} and it will be waiting for you.`;
  const button = hasAccount ? "Open project" : "Join Nia";

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#F9F9F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9F9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:1px solid #E2E2E2;border-radius:16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0A0908;">
        <tr><td style="padding:32px 32px 0;">
          <div style="font-family:ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.02em;">NIA</div>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;">${escape(subject)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#73726C;">${escape(lead)}</p>
        </td></tr>
        <tr><td style="padding:28px 32px 0;">
          <a href="${escape(link)}" style="display:inline-block;background:#0A0908;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">${button}</a>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#73726C;">Reply to this email to reach ${escape(who)}. If you weren't expecting it, you can ignore it.</p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#73726C;">NIA is an AI-enabled content production operating system.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${subject}\n\n${lead}\n\n${button}: ${link}\n\nReply to this email to reach ${who}. If you weren't expecting it, you can ignore it.`;

  return { subject, html, text };
}
