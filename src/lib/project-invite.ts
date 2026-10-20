"use server";

import { headers } from "next/headers";

import { inviteEmail } from "@/lib/invite-email";
import { createClient } from "@/lib/supabase/server";

const SITE = "https://app.niatechnologies.co";

type Person = { kind: "owner" | "member" | "invite"; user_id: string | null; name: string; email: string; role: string };

// Emails the person a project was just shared with (Fix 8), through Resend. Called by the
// Share dialog after `share_project` succeeds. Sends only when the signed-in person owns the
// project and the address already has access or an invite, so it can't email anyone else.
// Replies go to the owner. Without RESEND_API_KEY it quietly sends nothing.
export async function sendProjectInvite(projectId: string, email: string): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sent: false };

  const [{ data: people }, { data: project }] = await Promise.all([
    supabase.rpc("project_people", { pid: projectId }),
    supabase.from("projects").select("title").eq("id", projectId).maybeSingle(),
  ]);
  const list = (people ?? []) as Person[];
  const owner = list.find((p) => p.kind === "owner");
  if (!owner || owner.user_id !== user.id) return { sent: false };

  const address = email.trim().toLowerCase();
  const person = list.find((p) => p.kind !== "owner" && p.email.toLowerCase() === address);
  if (!person || (person.role !== "editor" && person.role !== "viewer")) return { sent: false };

  const origin = (await headers()).get("origin") ?? SITE;
  const hasAccount = person.kind === "member";
  const { subject, html, text } = inviteEmail({
    actor: owner.name,
    projectTitle: project?.title ?? "",
    role: person.role,
    hasAccount,
    email: address,
    link: hasAccount ? `${origin}/projects/${projectId}` : `${origin}/sign-up`,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Nia <no-reply@niatechnologies.co>",
      to: [address],
      reply_to: owner.email,
      subject,
      html,
      text,
    }),
  });
  if (!response.ok) {
    console.error("Invitation email failed", response.status, await response.text());
    return { sent: false };
  }
  return { sent: true };
}
