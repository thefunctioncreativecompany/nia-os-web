"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ExpandingSearch, type ExpandingSearchItem } from "@/components/arc/expanding-search/expanding-search";

type ProjectRow = { id: string; title: string; production_type: string | null; stage: string; director: string; genres: string };

const icon = <Clapperboard className="size-4" />;

// Navbar search (uiarc expanding-search): a search button that grows into a field and lists
// matching projects as you type, recent ones before. Searches project titles until app-wide
// search (BUILD_PLAN 6.4). Access rules apply as usual.
// On phones it spreads across the whole top bar while open.
export function NavSearch() {
  const router = useRouter();
  const [projects, setProjects] = useState<ExpandingSearchItem[] | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div
      className={cn(
        "relative w-10 shrink-0 lg:w-70",
        open && "max-lg:absolute max-lg:inset-x-4 max-lg:top-1/2 max-lg:z-20 max-lg:w-auto max-lg:-translate-y-1/2",
      )}
    >
      <ExpandingSearch
        label="Search projects"
        placeholder="Search projects..."
        items={projects ?? []}
        suggestions={(projects ?? []).slice(0, 4)}
        suggestionsLabel="Recent projects"
        expandedWidth={420}
        emptyHint="Try a shorter word, or the director's name."
        onExpandedChange={setOpen}
        onSelect={(item) => router.push(`/projects/${item.id}`)}
      />
    </div>
  );
}
