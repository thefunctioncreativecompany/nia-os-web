"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";

// More than one account on this device (Ika, 2026-11-11: "signing in or up with a new account, and
// switching between accounts, without destroying anything"). Supabase keeps one signed-in session
// at a time, so the others wait here: each account's name, picture and refresh token, in this
// browser only. Switching trades the waiting token for a fresh session; the account switched away
// from is saved first with its latest token. Nothing is signed out on the server, so no account's
// session is ended by switching.
//
// Tokens rotate: Supabase ends a session when an old refresh token is used again. So a stored
// token is replaced whenever its account's session refreshes (`remember` on every auth change),
// and a token is removed from the list as soon as it has been used to switch.

const KEY = "nia-accounts";

export type SavedAccount = { id: string; email: string; name: string; avatar: string | null; refreshToken: string };

export function savedAccounts(): SavedAccount[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((a): a is SavedAccount => !!a?.id && !!a?.refreshToken) : [];
  } catch {
    return [];
  }
}

function write(list: SavedAccount[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

/** The saved accounts from a stored list's text (for useSyncExternalStore snapshots). */
export function parseAccounts(raw: string): SavedAccount[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((a): a is SavedAccount => !!a?.id && !!a?.refreshToken) : [];
  } catch {
    return [];
  }
}

/** Saves (or updates) an account from its current session. */
export function remember(session: Session | null) {
  if (!session?.refresh_token) return;
  const u = session.user;
  const meta = u.user_metadata ?? {};
  const entry: SavedAccount = {
    id: u.id,
    email: u.email ?? "",
    name: (meta.preferred_name as string) || (meta.full_name as string) || u.email || "",
    avatar: (meta.avatar_url as string) ?? null,
    refreshToken: session.refresh_token,
  };
  write([entry, ...savedAccounts().filter((a) => a.id !== u.id)]);
}

/** Forgets an account on this device (after it logs out). */
export function forget(id: string) {
  write(savedAccounts().filter((a) => a.id !== id));
}

/** Keeps the signed-in account's saved token current as Supabase refreshes it. */
export function keepRemembering(supabase: SupabaseClient) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") return;
    if (session) remember(session);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Switches to a saved account. The current one is saved first; if the saved token no longer works
 * (it was signed out elsewhere), that account is forgotten and the current one stays signed in.
 */
export async function switchTo(supabase: SupabaseClient, id: string): Promise<"ok" | "expired"> {
  const { data: current } = await supabase.auth.getSession();
  remember(current.session);
  const target = savedAccounts().find((a) => a.id === id);
  if (!target) return "expired";
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: target.refreshToken });
  if (error || !data.session) {
    forget(id);
    // Put the account we were on back, if the attempt disturbed it.
    if (current.session) await supabase.auth.setSession({ access_token: current.session.access_token, refresh_token: current.session.refresh_token });
    return "expired";
  }
  remember(data.session);
  return "ok";
}
