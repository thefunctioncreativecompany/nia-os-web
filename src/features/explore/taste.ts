// A signed-in person's taste for Explore (Ika, 2026-10-28): what they opened, saved and added to
// projects they can see, and their profession, read in one go when "For you" or a project's
// suggestions need it. Nothing here leaves the browser; database rules limit each list to rows
// the person may see.
import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { tasteFrom, type Taste } from "./match";
import { recentViews } from "./views";

export async function loadTaste(): Promise<Taste> {
  const db = createClient();
  const user = await currentUser(db);
  const [viewed, saved, referenced, profile] = await Promise.all([
    recentViews(),
    db.from("collection_items").select("title_slug").is("deleted_at", null).limit(300),
    db.from("project_references").select("title_slug").is("deleted_at", null).limit(300),
    user ? db.from("profiles").select("profession").eq("id", user.id).maybeSingle() : Promise.resolve(null),
  ]);
  const slugs = (r: { data: { title_slug: string }[] | null }) => (r.data ?? []).map((x) => x.title_slug);
  return tasteFrom({ viewed, saved: slugs(saved), referenced: slugs(referenced), profession: profile?.data?.profession ?? null });
}
