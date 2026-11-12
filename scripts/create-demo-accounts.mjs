// Five demo accounts for mentors and investors (Ika). Each is a finished sign-up: email
// confirmed, onboarding done (the welcome tour waits for the first visit), its own workspace on Pro,
// and Explore access. Safe to run twice: existing accounts are topped up, not duplicated, and keep
// their passwords. New passwords are written to .env.local only, never printed.
import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const envText = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(envText.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const password = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(16), (b) => chars[b % chars.length]).join("");
};

const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
let envOut = envText.endsWith("\n") ? envText : envText + "\n";

for (let n = 1; n <= 5; n++) {
  const email = `demo${n}@niatechnologies.co`;
  const name = `Demo ${n}`;
  const meta = { full_name: name, onboarded: true, tour_pending: true };
  let user = list.users.find((u) => u.email === email);
  let pass = env[`DEMO_USER${n}_PASSWORD`];
  if (!user) {
    pass = password();
    const { data, error } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: meta });
    if (error) throw new Error(`${email}: ${error.message}`);
    user = data.user;
    envOut += `DEMO_USER${n}_EMAIL=${email}\nDEMO_USER${n}_PASSWORD=${pass}\n`;
    // Saved straight away, so a later failure never leaves an account nobody can sign in to.
    fs.writeFileSync(".env.local", envOut);
  } else {
    await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, ...meta, tour_pending: user.user_metadata?.tour_pending ?? true } });
  }
  if (!pass) throw new Error(`${email} exists but its password isn't in .env.local`);

  // Profile: the onboarding answers.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: name, username: `nia.demo${n}`, profession: "Producer", onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
  if (profileError) throw new Error(`${email} profile: ${profileError.message}`);

  // Their own workspace (made the way the app makes it), on Pro.
  const self = createClient(url, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: signInError } = await self.auth.signInWithPassword({ email, password: pass });
  if (signInError) throw new Error(`${email} sign-in: ${signInError.message}`);
  const { data: workspaceId, error: wsError } = await self.rpc("my_workspace_id");
  if (wsError) throw new Error(`${email} workspace: ${wsError.message}`);
  const { error: planError } = await admin.from("workspaces").update({ plan: "pro" }).eq("id", workspaceId);
  if (planError) throw new Error(`${email} plan: ${planError.message}`);

  // Explore, as an invited member.
  const { error: exploreError } = await admin.from("explore_access").upsert({ user_id: user.id, via: "invite" }, { onConflict: "user_id" });
  if (exploreError) throw new Error(`${email} explore: ${exploreError.message}`);

  const { data: ws } = await admin.from("workspaces").select("plan").eq("id", workspaceId).single();
  console.log(`${email}: ready (plan ${ws.plan})`);
}

fs.writeFileSync(".env.local", envOut);
