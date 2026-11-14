"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderSearch } from "lucide-react";

import { GENRES, PRODUCTION_TYPES, STAGES, type Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { ChipMenu, FilterChip, ResultCount, SearchField, ChipRow } from "@/components/nia/filter-bar";
import { ProjectGrid } from "@/components/projects/project-grid";
import { SharedProjects, type LinkShared } from "@/components/projects/shared-projects";
import { sentenceCase } from "@/lib/sentence-case";
import { features } from "@/lib/features";
import { useMediaQuery } from "@/hooks/use-pointer";
import { ProjectPanel } from "@/components/projects/project-panel";

const ALL = "all";
const SORTS = { edited: "Last edited", newest: "Newest", title: "Title A–Z", shoot: "Shoot date" } as const;
type Sort = keyof typeof SORTS;
const all = (label: string) => ({ value: ALL, label });
const genresOf = (p: Project) => p.genres.split(",").map((g) => g.trim()).filter(Boolean);
// A shoot date the browser can read ("2026-11-04", "July 2026"), or none.
const shootTime = (p: Project) => {
  const t = Date.parse(p.productionDate);
  return Number.isNaN(t) ? null : t;
};

// Projects, found and sorted (Ika, 2026-10-21; BUILD_PLAN 2.2): a search, a chip per stage, Type
// and Genre in the projects' own lists (the same ones Explore uses), and Sort. Applies to your
// projects and the ones shared with you. `?q=` from the navbar fills the search.
export function ProjectsBrowser({
  projects,
  shared,
  linked,
  now,
  initialQuery,
}: {
  projects: Project[];
  shared: Project[];
  linked: LinkShared[];
  now: number;
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [stage, setStage] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [genre, setGenre] = useState<string>(ALL);
  const [sort, setSort] = useState<Sort>("edited");

  const everyone = [...projects, ...shared];
  const types = PRODUCTION_TYPES.filter((t) => everyone.some((p) => p.productionType === t) || linked.some((p) => p.productionType === t));
  const genres = GENRES.filter((g) => everyone.some((p) => genresOf(p).includes(g)));
  const q = query.trim().toLowerCase();

  const keepProject = (p: Project, ignoreStage = false) =>
    (!q || [p.title, p.description, p.client, ...p.crew.map((c) => c.name), p.genres, p.productionType, p.stage].filter(Boolean).join(" ").toLowerCase().includes(q)) &&
    (ignoreStage || stage === ALL || p.stage === stage) &&
    (type === ALL || p.productionType === type) &&
    (genre === ALL || genresOf(p).includes(genre));
  // Projects opened through a link carry less, so only the search, stage and type apply to them.
  const keepLinked = (p: LinkShared, ignoreStage = false) =>
    genre === ALL &&
    (!q || [p.title, p.description, p.productionType, p.stage].filter(Boolean).join(" ").toLowerCase().includes(q)) &&
    (ignoreStage || stage === ALL || p.stage === stage) &&
    (type === ALL || p.productionType === type);

  const order = (a: Project, b: Project) => {
    if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "title") return (a.title || "Untitled").localeCompare(b.title || "Untitled");
    if (sort === "shoot") {
      const [x, y] = [shootTime(a), shootTime(b)];
      return x === null ? (y === null ? 0 : 1) : y === null ? -1 : x - y;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  };
  const mine = projects.filter((p) => keepProject(p)).toSorted(order);
  const theirs = shared.filter((p) => keepProject(p)).toSorted(order);
  const viaLink = linked.filter((p) => keepLinked(p));
  const shown = mine.length + theirs.length + viaLink.length;
  const narrowed = q !== "" || stage !== ALL || type !== ALL || genre !== ALL;
  // Each stage chip says how many it would show with the other choices kept.
  const inStage = (s: string) => everyone.filter((p) => keepProject(p, true) && p.stage === s).length + linked.filter((p) => keepLinked(p, true) && p.stage === s).length;
  const clear = () => {
    setQuery("");
    setStage(ALL);
    setType(ALL);
    setGenre(ALL);
  };

  // A/B on computers (Ika, 2026-11-14): a project opens in the right panel, kept in the address
  // (?project=…) so Back closes it. ?layout=popup, phones and tablets go straight to the page.
  const computer = useMediaQuery("(min-width: 64rem)");
  const panel = features.previewPanel && computer;
  const pushed = useRef(false);
  const router = useRouter();
  const openProject = (p: Project) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("layout") === "popup") return router.push(`/projects/${p.id}`);
    const showing = url.searchParams.has("project");
    url.searchParams.set("project", p.id);
    if (showing) window.history.replaceState(null, "", url);
    else {
      window.history.pushState(null, "", url);
      pushed.current = true;
    }
  };
  const closeProject = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("project");
      window.history.replaceState(null, "", url);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:in-data-[preview-panel=open]:pr-(--preview-panel-w)">
      <div className="flex flex-col gap-4">
        <SearchField label="Search projects" placeholder="Search titles, clients, crew, genres..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-150" />
        <ChipRow role="group" aria-label="Stage">
          <FilterChip on={stage === ALL} onClick={() => setStage(ALL)}>
            All stages
          </FilterChip>
          {STAGES.map((s) => (
            <FilterChip key={s} on={stage === s} count={inStage(s)} onClick={() => setStage(s)}>
              {sentenceCase(s)}
            </FilterChip>
          ))}
        </ChipRow>
        <ChipRow>
          {types.length > 0 && <ChipMenu label="Type" value={type} defaultValue={ALL} options={[all("All"), ...types.map((t) => ({ value: t, label: sentenceCase(t) }))]} onChange={setType} />}
          {genres.length > 0 && <ChipMenu label="Genre" value={genre} defaultValue={ALL} options={[all("All"), ...genres.map((g) => ({ value: g, label: sentenceCase(g) }))]} onChange={setGenre} />}
          {narrowed && (
            <Button variant="ghost" size="compact" onClick={clear}>
              Clear all
            </Button>
          )}
          <span className="flex-1" />
          <ResultCount>
            {shown} {shown === 1 ? "project" : "projects"}
          </ResultCount>
          <ChipMenu label="Sort" value={sort} align="end" options={(Object.keys(SORTS) as Sort[]).map((key) => ({ value: key, label: SORTS[key] }))} onChange={setSort} />
        </ChipRow>
      </div>

      {narrowed && shown === 0 ? (
        <EmptyState
          icon={FolderSearch}
          message="No projects match. Try another stage or type, or a shorter search."
          action={
            <Button variant="outline" onClick={clear}>
              Clear all
            </Button>
          }
        />
      ) : (
        <>
          <ProjectGrid projects={mine} now={now} onOpen={panel ? openProject : undefined} />
          {(theirs.length > 0 || viaLink.length > 0) && <SharedProjects projects={theirs} linked={viaLink} now={now} />}
        </>
      )}
      {panel && (
        <Suspense fallback={null}>
          <ProjectFromAddress list={mine} now={now} onNavigate={openProject} onClose={closeProject} />
        </Suspense>
      )}
    </div>
  );
}

// The project named in the address (?project=…), in the right panel. ?layout=popup turns it off.
function ProjectFromAddress({ list, now, onNavigate, onClose }: { list: Project[]; now: number; onNavigate: (p: Project) => void; onClose: () => void }) {
  const params = useSearchParams();
  const id = params.get("project");
  const project = id ? list.find((p) => p.id === id) : undefined;
  if (!project || params.get("layout") === "popup") return null;
  return <ProjectPanel project={project} list={list} now={now} onNavigate={onNavigate} onClose={onClose} />;
}
