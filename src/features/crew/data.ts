import "server-only";

import type { ProductionStatus } from "@/components/nia/status-badge";
import { departmentFor, type DirectoryEntry, type Kind } from "./directory";

type Client = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

type Row = {
  id: string;
  kind: Kind;
  department: string | null;
  role: string;
  character: string | null;
  episodes: string[];
  status: ProductionStatus;
  notes: string | null;
  position: number;
  person: {
    id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    agent: string | null;
    union_name: string | null;
    bio: string | null;
    photo_url: string | null;
    availability: boolean[] | null;
  } | null;
};

const COLUMNS = "id, kind, department, role, character, episodes, status, notes, position, person:people(id, user_id, name, email, phone, agent, union_name, bio, photo_url, availability)";

/** A project's cast and crew (people and cast_crew tables, 20261109000000_people.sql), with
 * the Nia profile photo of anyone who has an account and hasn't chosen another. */
export async function listCastCrew(supabase: Client, projectId: string): Promise<DirectoryEntry[]> {
  const { data } = await supabase.from("cast_crew").select(COLUMNS).eq("project_id", projectId).is("deleted_at", null).order("position").returns<Row[]>();
  const rows = (data ?? []).filter((r) => r.person);
  const userIds = [...new Set(rows.flatMap((r) => (r.person!.user_id && !r.person!.photo_url ? [r.person!.user_id] : [])))];
  const avatars = new Map<string, string | null>();
  if (userIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", userIds);
    for (const p of profiles ?? []) avatars.set(p.id, p.avatar_url);
  }
  return rows.map((r) => {
    const p = r.person!;
    return {
      id: r.id,
      personId: p.id,
      name: p.name,
      photo: p.photo_url ?? (p.user_id ? (avatars.get(p.user_id) ?? null) : null),
      kind: r.kind,
      department: r.department || departmentFor(r.role),
      role: r.role,
      character: r.character,
      episodes: r.episodes ?? [],
      status: r.status,
      email: p.email,
      phone: p.phone,
      agent: p.agent,
      union: p.union_name,
      bio: p.bio,
      availability: p.availability,
      notes: r.notes,
    };
  });
}
