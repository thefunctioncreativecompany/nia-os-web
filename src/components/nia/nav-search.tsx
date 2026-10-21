"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, FileText, LayoutTemplate } from "lucide-react";

import { loadTemplateIndex } from "@/features/templates/actions";

import { createClient } from "@/lib/supabase/client";
import { ExpandingSearch, type ExpandingSearchItem } from "@/components/arc/expanding-search/expanding-search";

type ProjectRow = { id: string; title: string; production_type: string | null; stage: string; director: string; genres: string };
type DocumentRow = { id: string; template_code: string; title: string; project: { title: string } | null };

const icon = <Clapperboard className="size-4" />;
const docIcon = <FileText className="size-4" />;
const templateIcon = <LayoutTemplate className="size-4" />;

// Navbar search (uiarc expanding-search): a search button that grows into a field and lists
// matches as you type, recent projects before. Finds projects, documents (yours and those in
// projects you can open) and templates (audit #14). Access rules apply as usual. People come
// with Cast & Crew (BUILD_PLAN 6.4).
// On phones and tablets it is always a field, filling the top bar.
export function NavSearch() {
  const router = useRouter();
  const [projects, setProjects] = useState<ExpandingSearchItem[] | null>(null);
  const [more, setMore] = useState<ExpandingSearchItem[]>([]);
  // The lists load the first time someone points at, taps or tabs to the search, not on every page
  // load (audit 2026-10-21). Pointing comes a moment before the click, so the list is usually
  // there before the field has grown; if it arrived mid-growth, the growth would stall.
  const [wanted, setWanted] = useState(false);
  const want = () => setWanted(true);

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    void (async () => {
      const supabase = createClient();
      // Documents and templates arrive after the projects; they only add results.
      void Promise.all([
        supabase.from("documents").select("id, template_code, title, project:projects(title)").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200).returns<DocumentRow[]>(),
        loadTemplateIndex(),
      ]).then(([{ data: docs }, templates]) => {
        if (!live) return;
        setMore([
          ...(docs ?? []).map((d) => ({ id: `d:${d.template_code}:${d.id}`, title: d.title, meta: d.project?.title ? `In ${d.project.title}` : "Draft", group: "Documents", icon: docIcon })),
          ...templates.map((t) => ({ id: `t:${t.ready ? "open" : "preview"}:${t.code}`, title: t.name, meta: t.ready ? t.stage : `${t.stage} · coming soon`, group: "Templates", icon: templateIcon, keywords: t.keywords })),
        ]);
      });
      const { data } = await supabase
        .from("projects")
        .select("id, title, production_type, stage, director, genres")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200)
        .returns<ProjectRow[]>();
      if (!live) return;
      setProjects(
        (data ?? []).map((p) => ({
          id: `p:${p.id}`,
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
  }, [wanted]);

  const props = {
    label: "Search projects, documents and templates",
    placeholder: "Search projects, documents, templates...",
    items: [...(projects ?? []), ...more],
    suggestions: (projects ?? []).slice(0, 4),
    suggestionsLabel: "Recent projects",
    emptyHint: "Try a shorter word, a director's name, or a document like \"call sheet\".",
    onSelect: (item: ExpandingSearchItem) => {
      const [kind, a, b] = item.id.split(":");
      if (kind === "p") return router.push(`/projects/${a}`);
      if (kind === "d") return router.push(`/templates/${a}?doc=${b}`);
      router.push(a === "open" ? `/templates/${b}` : `/templates?preview=${b}`);
    },
  };

  return (
    <>
      {/* Desktop: a search button that grows into a field. */}
      <div onPointerEnter={want} onFocusCapture={want} className="relative w-70 shrink-0 max-lg:hidden">
        <ExpandingSearch {...props} expandedWidth={420} />
      </div>
      {/* Phones and tablets: a field that fills the top bar, in silver glass. */}
      <div onPointerDown={want} onFocusCapture={want} className="nav-search-glass relative min-w-0 flex-1 lg:hidden">
        <ExpandingSearch {...props} alwaysOpen anchor="start" expandedWidth={1200} />
      </div>
    </>
  );
}
