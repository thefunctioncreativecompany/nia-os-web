import { createClient } from "@/lib/supabase/client";
import type { MentionPerson } from "@/components/nia/rich-text-editor";

// The people on a project who can be @mentioned, for what's typed after the @ (by name, @username
// or exact email; the email is never returned). 20261129000000_mentions.sql (`mention_people`).
export function mentionPeople(projectId: string) {
  return async (q: string): Promise<MentionPerson[]> => {
    const { data, error } = await createClient().rpc("mention_people", { pid: projectId, q });
    if (error || !data) return [];
    return (data as { id: string; full_name: string; username: string | null; avatar_url: string | null }[]).map((p) => ({
      id: p.id,
      name: p.full_name,
      username: p.username,
      avatar: p.avatar_url,
    }));
  };
}
