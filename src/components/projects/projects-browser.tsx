"use client";

import { useState } from "react";
import { FolderSearch } from "lucide-react";

import { GENRES, PRODUCTION_TYPES, STAGES, type Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { ChipMenu, FilterChip, ResultCount, SearchField } from "@/components/nia/filter-bar";
import { ProjectGrid } from "@/components/projects/project-grid";
import { SharedProjects, type LinkShared } from "@/components/projects/shared-projects";

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
    (!q || [p.title, p.description, p.director, p.genres, p.productionType, p.stage].filter(Boolean).join(" ").toLowerCase().includes(q)) &&
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SearchField label="Search projects" placeholder="Search titles, directors, genres..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-150" />
        <div role="group" aria-label="Stage" className="flex flex-wrap gap-2">
          <FilterChip on={stage === ALL} onClick={() => setStage(ALL)}>
            All stages
          </FilterChip>
          {STAGES.map((s) => (
            <FilterChip key={s} on={stage === s} count={inStage(s)} onClick={() => setStage(s)}>
              {s}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {types.length > 0 && <ChipMenu label="Type" value={type} defaultValue={ALL} options={[all("All"), ...types.map((t) => ({ value: t, label: t }))]} onChange={setType} />}
          {genres.length > 0 && <ChipMenu label="Genre" value={genre} defaultValue={ALL} options={[all("All"), ...genres.map((g) => ({ value: g, label: g }))]} onChange={setGenre} />}
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
        </div>
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
          <ProjectGrid projects={mine} now={now} />
          {(theirs.length > 0 || viaLink.length > 0) && <SharedProjects projects={theirs} linked={viaLink} now={now} />}
        </>
      )}
    </div>
  );
}
