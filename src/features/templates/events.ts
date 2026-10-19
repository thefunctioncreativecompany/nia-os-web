import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateEvent, TemplateEventType, UserTemplateProfile } from './types';

/**
 * Reading and writing what Nia learns. Events live in `template_events`
 * (see supabase/migrations/20261021000000_templates.sql). The role is the profession chosen at
 * onboarding (`profiles.profession`); `profiles.role` is the free-text job title in Settings.
 * Fire-and-forget: never block the UI on these calls.
 */
export async function recordTemplateEvent(
  supabase: SupabaseClient,
  e: { code: string; type: TemplateEventType; projectId?: string | null; query?: string | null },
) {
  const { error } = await supabase.from('template_events').insert({
    template_code: e.code, type: e.type, project_id: e.projectId ?? null, query: e.query ?? null,
  });
  if (error) console.warn('template event not saved', error.message);
}

/** Last 90 days of the signed-in person's events plus their role, ready for suggestTemplates(). */
export async function loadTemplateProfile(supabase: SupabaseClient, userId: string): Promise<UserTemplateProfile> {
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('profession').eq('id', userId).maybeSingle(),
    supabase.from('template_events').select('template_code, type, created_at').eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false }).limit(500),
  ]);
  const events: TemplateEvent[] = (rows ?? []).map(r => ({ code: r.template_code as string, type: r.type as TemplateEventType, at: new Date(r.created_at as string).getTime() }));
  return { role: (profile?.profession as string | null) ?? null, events };
}

export async function setRole(supabase: SupabaseClient, userId: string, role: string | null) {
  const { error } = await supabase.from('profiles').update({ profession: role }).eq('id', userId);
  if (error) throw error;
}

/** "Reset what Nia learned": deletes the person's template history. */
export async function clearTemplateHistory(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from('template_events').delete().eq('user_id', userId);
  if (error) throw error;
}
