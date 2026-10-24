"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clapperboard, Compass, FileAudio, FileImage, FileText, FileVideo, LayoutTemplate, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChip, SearchField } from "@/components/nia/filter-bar";
import { DocMiniature } from "@/features/templates/components/doc-miniature";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { loadTemplateIndex, loadTemplatePreview, type TemplatePreview } from "@/features/templates/actions";
import { LIBRARY } from "@/features/explore/library";
import { exploreAccess } from "@/features/explore/saves";

type Kind = "project" | "document" | "file" | "template" | "explore";
type Filter = "all" | Kind;

type Result = {
  key: string;
  kind: Kind;
  title: string;
  meta: string;
  /** Extra words that find it: a director, genres, a template's keywords. */
  words: string;
  href: string;
  at?: string;
  project?: { title: string; type: string | null; stage: string; genres: string; director: string; description: string; cover: string | null };
  document?: { code: string; status: string };
  file?: { kind: "image" | "document" | "audio" | "video"; path: string; thumb: string | null; tag: string | null; size: number };
  template?: { code: string; icon: string; ready: boolean };
  explore?: { image: string | null; aspect?: number };
};

const GROUPS: { kind: Kind; label: string; Icon: LucideIcon }[] = [
  { kind: "project", label: "Projects", Icon: Clapperboard },
  { kind: "document", label: "Documents", Icon: FileText },
  { kind: "file", label: "Files", Icon: FileImage },
  { kind: "template", label: "Templates", Icon: LayoutTemplate },
  { kind: "explore", label: "Explore", Icon: Compass },
];
const FILE_ICONS = { image: FileImage, document: FileText, audio: FileAudio, video: FileVideo } as const;
const TAGS: Record<string, string> = { reference: "Reference", raw: "Raw file", wip: "Work in progress", final: "Final asset", brief: "Brief" };
const STATUS: Record<string, string> = { draft: "Draft", ready: "Ready", paid: "Paid" };
// With All, each group shows this many; a group's own filter shows up to MAX.
const PER_GROUP = 5;
const MAX = 60;
// The lists are kept for a couple of minutes, so reopening search is instant.
const FRESH_MS = 2 * 60 * 1000;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

// Every word typed must appear; a title that starts with the words, or has a word starting with
// one, ranks first.
function score(r: Result, words: string[]) {
  const title = norm(r.title);
  const all = `${title} ${norm(r.meta)} ${norm(r.words)}`;
  if (!words.every((w) => all.includes(w))) return 0;
  const phrase = words.join(" ");
  if (title.startsWith(phrase)) return 4;
  if (title.split(/\s+/).some((t) => t.startsWith(words[0]))) return 3;
  if (title.includes(phrase)) return 2;
  return 1;
}

type Loaded = { at: number; results: Result[] };
let cache: Loaded | null = null;

async function load(): Promise<Result[]> {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.results;
  const supabase = createClient();
  const [projects, documents, files, templates, explore] = await Promise.all([
    supabase.from("projects").select("id, title, production_type, stage, director, genres, description, cover_url, updated_at, client, crew").is("deleted_at", null).order("updated_at", { ascending: false }).limit(300),
    supabase.from("documents").select("id, template_code, title, status, updated_at, project:projects(id, title)").is("deleted_at", null).order("updated_at", { ascending: false }).limit(300),
    supabase.from("project_files").select("id, name, kind, tag, size, path, thumb_path, created_at, project:projects(id, title)").is("deleted_at", null).order("created_at", { ascending: false }).limit(300),
    loadTemplateIndex().catch(() => []),
    exploreAccess(supabase).catch(() => false),
  ]);
  type Ref = { id: string; title: string } | null;
  // Older documents were saved with the template's code as their title; show its name instead.
  const templateName = new Map(templates.map((t) => [t.code, t.name] as const));
  const results: Result[] = [
    ...(projects.data ?? []).map((p): Result => ({
      key: `p:${p.id}`,
      kind: "project",
      title: p.title || "Untitled project",
      meta: [p.production_type, p.stage].filter(Boolean).join(" · "),
      words: `${p.client ?? ""} ${(Array.isArray(p.crew) ? (p.crew as { name: string }[]) : []).map((c) => c.name).join(" ")} ${p.genres}`,
      href: `/projects/${p.id}`,
      at: p.updated_at,
      project: { title: p.title, type: p.production_type, stage: p.stage, genres: p.genres, director: (Array.isArray(p.crew) ? (p.crew as { role: string; name: string }[]) : []).filter((c) => c.role === "Director").map((c) => c.name).join(", ") || p.director, description: p.description, cover: p.cover_url },
    })),
    ...(documents.data ?? []).map((d): Result => {
      const project = d.project as unknown as Ref;
      return {
        key: `d:${d.id}`,
        kind: "document",
        title: (d.title === d.template_code ? templateName.get(d.template_code) : d.title) || "Untitled document",
        meta: project ? `In ${project.title || "Untitled project"}` : "Not in a project",
        words: `${d.template_code} ${templateName.get(d.template_code) ?? ""}`,
        href: `/templates/${d.template_code}?doc=${d.id}`,
        at: d.updated_at,
        document: { code: d.template_code, status: d.status },
      };
    }),
    ...(files.data ?? []).map((f): Result => {
      const project = f.project as unknown as Ref;
      return {
        key: `f:${f.id}`,
        kind: "file",
        title: f.name,
        meta: [project?.title, f.tag && TAGS[f.tag]].filter(Boolean).join(" · "),
        words: f.kind,
        href: project ? `/projects/${project.id}#files` : "/projects",
        at: f.created_at,
        file: { kind: f.kind, path: f.path, thumb: f.thumb_path, tag: f.tag, size: f.size },
      };
    }),
    ...templates.map((t): Result => ({
      key: `t:${t.code}`,
      kind: "template",
      title: t.name,
      meta: t.ready ? t.stage : `${t.stage} · coming soon`,
      words: t.keywords.join(" "),
      href: t.ready ? `/templates/${t.code}` : `/templates?preview=${t.code}`,
      template: { code: t.code, icon: t.icon, ready: t.ready },
    })),
    // Explore's titles with a page of their own, for people with early access.
    ...(explore
      ? LIBRARY.flatMap((i): Result[] =>
          i.open.kind === "page" ? [{ key: `e:${i.key}`, kind: "explore", title: i.title, meta: i.credit, words: "", href: i.open.href, explore: { image: i.image, aspect: i.aspect } }] : [],
        )
      : []),
  ];
  cache = { at: Date.now(), results };
  return results;
}

/** Forgets the lists, so the next search reads them again (after a project is made or renamed). */
export function refreshSearch() {
  cache = null;
}

// Global search on desktop (Ika, 2026-10-23): one field for everything in Nia, results grouped by
// what they are, a filter per group with its count, and a live preview of the result in focus.
// Opened from the navbar's search or ⌘K / Ctrl K. Loads on first open (this file is its own
// download), keeps the lists for two minutes, and filters in memory as you type; previews fetch
// only what they show (a file's picture, a template's miniature), once.
export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const listId = useId();
  const [results, setResults] = useState<Result[] | null>(cache?.results ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const list = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void load().then((r) => {
      if (!live) return;
      setResults(r);
      setNow(Date.now());
    });
    return () => {
      live = false;
    };
  }, [open]);

  const words = norm(deferred.trim()).split(/\s+/).filter(Boolean);
  const { groups, counts } = useMemo(() => {
    const counts: Record<Kind, number> = { project: 0, document: 0, file: 0, template: 0, explore: 0 };
    const byKind = new Map<Kind, { r: Result; s: number }[]>();
    for (const r of results ?? []) {
      // With nothing typed, every result counts; All lists the recent projects, documents and
      // files, and a group's own filter lists everything in it.
      const s = words.length ? score(r, words) : 1;
      if (!s) continue;
      counts[r.kind] += 1;
      if (!words.length && filter === "all" && !r.at) continue;
      byKind.set(r.kind, [...(byKind.get(r.kind) ?? []), { r, s }]);
    }
    const groups = GROUPS.filter((g) => filter === "all" || g.kind === filter).flatMap((g) => {
      const items = (byKind.get(g.kind) ?? [])
        .toSorted((a, b) => b.s - a.s)
        .slice(0, filter === "all" ? PER_GROUP : MAX)
        .map((x) => x.r);
      return items.length ? [{ ...g, items }] : [];
    });
    return { groups, counts };
    // `words` comes from `deferred`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, deferred, filter]);
  const hasExplore = (results ?? []).some((r) => r.kind === "explore");

  const flat = groups.flatMap((g) => g.items);
  const active = flat.find((r) => r.key === activeKey) ?? flat[0] ?? null;

  const go = (r: Result) => {
    onOpenChange(false);
    router.push(r.href);
  };
  const move = (step: number) => {
    if (!flat.length) return;
    const at = active ? flat.indexOf(active) : -1;
    const next = flat[(at + step + flat.length) % flat.length];
    setActiveKey(next.key);
    list.current?.querySelector(`[data-key="${CSS.escape(next.key)}"]`)?.scrollIntoView({ block: "nearest" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setFilter("all");
          setActiveKey(null);
        }
      }}
    >
      <DialogContent showCloseButton={false} className="top-[12svh] flex h-[min(44rem,76svh)] w-[min(72rem,calc(100%-4rem))] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogTitle className="sr-only">Search Nia</DialogTitle>
        <DialogDescription className="sr-only">Projects, documents, files, templates and Explore. Use the arrow keys to move through results and Enter to open one.</DialogDescription>

        <div className="flex flex-col gap-4 border-b border-border p-5">
          <SearchField
            label="Search Nia"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveKey(null);
            }}
            onKeyDown={(e) => {
              const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
              if (step) {
                e.preventDefault();
                move(step);
              } else if (e.key === "Enter" && active) {
                e.preventDefault();
                go(active);
              }
            }}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={active ? `${listId}-${active.key}` : undefined}
            placeholder="Search projects, documents, files, templates and Explore"
            suffix={<kbd className="rounded-md bg-muted px-2 py-0.5 font-sans text-caption text-muted-foreground">esc</kbd>}
          />
          <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
            <FilterChip on={filter === "all"} onClick={() => (setFilter("all"), setActiveKey(null))}>
              All
            </FilterChip>
            {GROUPS.filter((g) => g.kind !== "explore" || hasExplore).map((g) => (
              <FilterChip key={g.kind} on={filter === g.kind} count={results ? counts[g.kind] : undefined} onClick={() => (setFilter(g.kind), setActiveKey(null))}>
                {g.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div ref={list} id={listId} role="listbox" aria-label="Results" className="min-h-0 overflow-y-auto p-3">
            {!results ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {words.length ? `Nothing matches “${deferred.trim()}”. Try a shorter word, a director's name, or a document like “call sheet”.` : "Nothing here yet."}
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.kind} role="group" aria-label={g.label} className="mb-3 flex flex-col">
                  <p className="px-3 pt-2 pb-1.5 text-caption text-muted-foreground">{words.length || filter !== "all" ? g.label : `Recent ${g.label.toLowerCase()}`}</p>
                  {g.items.map((r) => {
                    const on = r.key === active?.key;
                    const Icon = r.file ? FILE_ICONS[r.file.kind] : g.Icon;
                    return (
                      <div
                        key={r.key}
                        id={`${listId}-${r.key}`}
                        data-key={r.key}
                        role="option"
                        aria-selected={on}
                        onPointerMove={() => !on && setActiveKey(r.key)}
                        onClick={() => go(r)}
                        className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5", on && "bg-accent")}
                      >
                        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-foreground">{r.title}</span>
                          {r.meta && <span className="truncate text-small text-muted-foreground">{r.meta}</span>}
                        </span>
                        {r.at && now > 0 && <span className="shrink-0 text-caption text-muted-foreground">{timeAgo(r.at, now)}</span>}
                      </div>
                    );
                  })}
                  {filter === "all" && counts[g.kind] > g.items.length && (
                    <button type="button" onClick={() => (setFilter(g.kind), setActiveKey(null))} className="mx-3 mt-1 w-fit rounded-sm text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                      All {counts[g.kind]} {g.label.toLowerCase()}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <aside aria-label="Preview" className="min-h-0 overflow-y-auto border-l border-border bg-nia-panel p-6">
            {active ? <Preview key={active.key} result={active} now={now} onOpen={() => go(active)} /> : <p className="text-sm text-muted-foreground">Pick a result to see it here.</p>}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// What a picture or miniature looks like is fetched once per item, and kept while search is open.
const pictures = new Map<string, string | null>();
const miniatures = new Map<string, TemplatePreview | null>();

function useFilePicture(file: Result["file"]) {
  const path = file ? (file.kind === "image" ? file.path : file.thumb) : null;
  const [url, setUrl] = useState<string | null | undefined>(path ? pictures.get(path) : null);
  useEffect(() => {
    if (!path || pictures.has(path)) return;
    let live = true;
    // A short wait, so moving quickly through results doesn't fetch every picture on the way.
    const timer = window.setTimeout(async () => {
      const { data } = await createClient().storage.from("project-files").createSignedUrl(path, 60 * 60);
      pictures.set(path, data?.signedUrl ?? null);
      if (live) setUrl(data?.signedUrl ?? null);
    }, 120);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [path]);
  return path ? url : null;
}

function useMiniature(code: string | null) {
  const [preview, setPreview] = useState<TemplatePreview | null | undefined>(code ? miniatures.get(code) : null);
  useEffect(() => {
    if (!code || miniatures.has(code)) return;
    let live = true;
    const timer = window.setTimeout(async () => {
      const p = await loadTemplatePreview(code).catch(() => null);
      miniatures.set(code, p);
      if (live) setPreview(p);
    }, 120);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [code]);
  return preview;
}

function Preview({ result: r, now, onOpen }: { result: Result; now: number; onOpen: () => void }) {
  const picture = useFilePicture(r.file);
  const code = r.document?.code ?? r.template?.code ?? null;
  const miniature = useMiniature(code);
  const label = { project: "Open project", document: "Open document", file: "Open in project", template: r.template?.ready ? "Use template" : "Preview template", explore: "Open" }[r.kind];

  return (
    <div className="flex flex-col gap-5">
      {r.project ? (
        <div className="relative aspect-[19/10] w-full overflow-hidden rounded-xl bg-muted">
          {r.project.cover && <Image src={r.project.cover} alt="" fill sizes="32rem" className="object-cover" />}
        </div>
      ) : r.explore ? (
        <div className="relative mx-auto w-1/2 overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: r.explore.aspect ?? 268 / 373 }}>
          {r.explore.image && <Image src={r.explore.image} alt="" fill sizes="16rem" className="object-cover" />}
        </div>
      ) : r.file ? (
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-white">
          {picture === undefined ? (
            <Skeleton className="size-full" />
          ) : picture ? (
            // A signed link from Supabase Storage, shown as is.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picture} alt="" className="size-full object-contain" />
          ) : (
            (() => {
              const Icon = FILE_ICONS[r.file.kind];
              return <Icon aria-hidden className="size-10 text-muted-foreground" />;
            })()
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/60">
          {miniature === undefined ? (
            <Skeleton className="size-[86%] rounded-lg" />
          ) : miniature?.schema ? (
            <DocMiniature icon={r.template?.icon ?? "file-text"} name={r.title} schema={miniature.schema} />
          ) : (
            <FlatIcon name={r.template?.icon ?? "file-text"} size="lg" className="opacity-30" />
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h3 className="text-h3 leading-tight font-bold text-foreground">{r.title}</h3>
        {r.meta && <p className="text-sm text-muted-foreground">{r.meta}</p>}
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
        {r.project?.genres && (
          <>
            <dt className="text-muted-foreground">Genre</dt>
            <dd className="text-foreground">{r.project.genres}</dd>
          </>
        )}
        {r.project?.director && (
          <>
            <dt className="text-muted-foreground">Director</dt>
            <dd className="text-foreground">{r.project.director}</dd>
          </>
        )}
        {r.document && (
          <>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{STATUS[r.document.status] ?? r.document.status}</dd>
          </>
        )}
        {r.file && (
          <>
            <dt className="text-muted-foreground">Size</dt>
            <dd className="text-foreground">{size(r.file.size)}</dd>
          </>
        )}
        {r.at && now > 0 && (
          <>
            <dt className="text-muted-foreground">{r.kind === "file" ? "Added" : "Edited"}</dt>
            <dd className="text-foreground">{timeAgo(r.at, now)}</dd>
          </>
        )}
      </dl>
      {r.project?.description && <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{r.project.description}</p>}

      <Button onClick={onOpen} className="w-fit">
        {label}
      </Button>
    </div>
  );
}
