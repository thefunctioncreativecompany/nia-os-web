"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { loadReferences } from "@/features/explore/saves";
import { loadInstagramReferences } from "@/lib/instagram-references";

// The references a project links to (Ika, 2026-11-19: "add the linked references" to Overview):
// Explore titles and pasted Instagram posts, in the team's order as on the References tab, then
// newest first. Explore's list loads only when needed, so Overview stays light. Null until
// loaded: the row waits for them, so they don't push the pictures along after it shows.

export type LinkedPicture = { id: string; name: string; url: string | null; note: string | null };

export function useLinkedReferences(projectId: string): LinkedPicture[] | null {
  const [linked, setLinked] = useState<LinkedPicture[] | null>(null);
  useEffect(() => {
    let live = true;
    const db = createClient();
    void (async () => {
      const [explore, posts, places, { exploreItem }] = await Promise.all([
        loadReferences(db, projectId),
        loadInstagramReferences(db, projectId).catch(() => []),
        db.from("project_references").select("id, position, note").eq("project_id", projectId).is("deleted_at", null),
        import("@/features/explore/items"),
      ]);
      if (!live) return;
      const arranged = new Map(((places.data ?? []) as { id: string; position: number | null; note: string | null }[]).map((r) => [r.id, r]));
      const place = (id: string) => arranged.get(id)?.position ?? Number.MAX_SAFE_INTEGER;
      const items = [
        ...(explore.ready ? explore.data : []).flatMap((r) => {
          const entry = exploreItem(r.slug);
          return entry ? [{ id: r.id, at: r.createdAt, name: entry.title, url: entry.image ?? null }] : [];
        }),
        ...posts.map((p) => ({ id: p.id, at: p.createdAt, name: p.title || p.account || "Instagram post", url: p.coverUrl })),
      ].toSorted((a, b) => place(a.id) - place(b.id) || b.at.localeCompare(a.at));
      setLinked(items.map(({ id, name, url }) => ({ id, name, url, note: arranged.get(id)?.note ?? null })));
    })().catch(() => live && setLinked([]));
    return () => {
      live = false;
    };
  }, [projectId]);
  return linked;
}
