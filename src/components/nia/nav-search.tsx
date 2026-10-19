"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ExpandingSearch, type ExpandingSearchItem } from "@/components/arc/expanding-search/expanding-search";

type ProjectRow = { id: string; title: string; production_type: string | null; stage: string; director: string; genres: string };

const icon = <Clapperboard className="size-4" />;

// Navbar search (uiarc expanding-search): a search button that grows into a field and lists
// matching projects as you type, recent ones before. Searches project titles until app-wide
// search (BUILD_PLAN 6.4). Access rules apply as usual.
// On phones and tablets it is always a field, filling the top bar.
export function NavSearch() {
  const router = useRouter();
  const [projects, setProjects] = useState<ExpandingSearchItem[] | null>(null);

  // Loaded up front: if the list arrived while the field was still growing, the growth would stall.
  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await createClient()
        .from("projects")
        .select("id, title, production_type, stage, director, genres")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200)
        .returns<ProjectRow[]>();
      if (!live) return;
      setProjects(
        (data ?? []).map((p) => ({
          id: p.id,
          title: p.title || "Untitled project",
          meta: [p.production_type, p.stage].filter(Boolean).join(" · "),
          group: "Projects",
          icon,
          keywords: [p.director, p.genres].filter(Boolean),
        })),
      );
    })();
    return () => {
      live = false;
    };
  }, []);

  const props = {
    label: "Search projects",
    placeholder: "Search projects...",
    items: projects ?? [],
    suggestions: (projects ?? []).slice(0, 4),
    suggestionsLabel: "Recent projects",
    emptyHint: "Try a shorter word, or the director's name.",
    onSelect: (item: ExpandingSearchItem) => router.push(`/projects/${item.id}`),
  };

  return (
    <>
      {/* Desktop: a search button that grows into a field. */}
      <div className="relative w-70 shrink-0 max-lg:hidden">
        <ExpandingSearch {...props} expandedWidth={420} />
      </div>
      {/* Phones and tablets: a field that fills the top bar, in silver glass. */}
      <div className="nav-search-glass relative min-w-0 flex-1 lg:hidden">
        <ExpandingSearch {...props} alwaysOpen anchor="start" expandedWidth={1200} />
      </div>
    </>
  );
}
