"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clapperboard, Compass, FileAudio, FileImage, FileText, FileVideo, Hash, History, LayoutTemplate, Search, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { completions, correctQuery, matchesAll, norm, recentSearches, rememberSearch, vocabularyOf, wordsOf } from "@/lib/search";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChipRow, FilterChip, SearchField } from "@/components/nia/filter-bar";
import { DocMiniature } from "@/features/templates/components/doc-miniature";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { loadTemplateIndex, loadTemplatePreview, type TemplatePreview } from "@/features/templates/actions";
import { LIBRARY } from "@/features/explore/library";
import { ALL_TAGS, tagLabel, tagsFor } from "@/features/explore/tags";
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
  /** Explore's tags (tags.ts), for searching by tag. */
  tags?: string[];
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

const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

// Every word typed must appear (in the title, details, keywords or tags); a title that starts
// with the words, or has a word starting with one, ranks first.
function score(r: Result, words: string[]) {
  const title = norm(r.title);
  if (!matchesAll(`${r.title} ${r.meta} ${r.words}`, words)) return 0;
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
          i.open.kind === "page" ? [exploreResult(i.key, i.title, i.credit, i.open.href, { image: i.image, aspect: i.aspect })] : [],
        )
      : []),
  ];
  cache = { at: Date.now(), results };
  return results;
}

// An Explore title's tags are words that find it, and can be searched on their own.
function exploreResult(key: string, title: string, meta: string, href: string, explore: Result["explore"]): Result {
  const slug = key.startsWith("t:") ? key.slice(2) : key.startsWith("c:") ? `creator-${key.slice(2)}` : key;
  const tags = tagsFor(slug);
  return { key: `e:${key}`, kind: "explore", title, meta, words: tags.map(tagLabel).join(" "), href, explore, tags };
}

// Searches people in production make often: offered while nothing is typed.
const POPULAR = ["Call sheet", "Production budget", "Shotlist", "Invoice", "Natural light", "Music video"];

/** Forgets the lists, so the next search reads them again (after a project is made or renamed). */
export function refreshSearch() {
  cache = null;
}

// Global search (Ika, 2026-10-23; full screen on phones and tablets since 2026-10-31): one field for everything in Nia, results grouped by
// what they are, a filter per group with its count, and a live preview of the result in focus.
// Since 2026-10-31 (Ika): Explore's tags find titles and can be searched on their own, misspelt
// words are corrected to ones that exist (src/lib/search.ts), and suggested searches show while
// nothing is typed (recent on this device, then popular) and as completions while typing.
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
  // Searching by one of Explore's tags; and "search for what I typed" after a correction.
  const [tag, setTag] = useState<string | null>(null);
  const [exact, setExact] = useState(false);
  // Read when the window opens (this file only loads in the browser, on first open).
  const recent = useMemo(() => (open ? recentSearches() : []), [open]);
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

  // Every word in what can be found, to correct typing against.
  const vocab = useMemo(() => vocabularyOf((results ?? []).flatMap((r) => [r.title, r.meta, r.words])), [results]);
  const typed = wordsOf(deferred);
  const { groups, counts, words, corrected } = useMemo(() => {
    const find = (words: string[]) => {
      const counts: Record<Kind, number> = { project: 0, document: 0, file: 0, template: 0, explore: 0 };
      const byKind = new Map<Kind, { r: Result; s: number }[]>();
      for (const r of results ?? []) {
        if (tag && !r.tags?.includes(tag)) continue;
        // With nothing typed, every result counts; All lists the recent projects, documents and
        // files (or everything with the tag), and a group's own filter lists everything in it.
        const s = words.length ? score(r, words) : 1;
        if (!s) continue;
        counts[r.kind] += 1;
        if (!words.length && filter === "all" && !r.at && !tag) continue;
        byKind.set(r.kind, [...(byKind.get(r.kind) ?? []), { r, s }]);
      }
      const groups = GROUPS.filter((g) => filter === "all" || g.kind === filter).flatMap((g) => {
        const items = (byKind.get(g.kind) ?? [])
          .toSorted((a, b) => b.s - a.s)
          .slice(0, filter === "all" ? PER_GROUP : MAX)
          .map((x) => x.r);
        return items.length ? [{ ...g, items }] : [];
      });
      return { groups, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
    };
    const first = find(typed);
    // Nothing found: try the words corrected to ones that exist, unless they asked for theirs.
    if (typed.length && !first.total && !exact) {
      const fixed = correctQuery(deferred, vocab);
      const second = fixed ? find(wordsOf(fixed)) : null;
      if (fixed && second?.total) return { ...second, words: wordsOf(fixed), corrected: fixed };
    }
    return { ...first, words: typed, corrected: null };
    // `typed` comes from `deferred`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, deferred, filter, tag, exact, vocab]);
  const hasExplore = (results ?? []).some((r) => r.kind === "explore");

  // Suggested searches: recent and popular ones while nothing is typed; then completions of what's
  // typed, and Explore's tags that match it.
  const suggestions = useMemo(() => {
    if (!typed.length) {
      const popular = POPULAR.filter((p) => !recent.some((r) => norm(r) === norm(p)));
      return [...recent.map((text) => ({ text, kind: "recent" as const })), ...popular.map((text) => ({ text, kind: "popular" as const }))].slice(0, 8);
    }
    const titles = completions(deferred, (results ?? []).map((r) => r.title), 3).map((text) => ({ text, kind: "complete" as const }));
    const tags = hasExplore ? completions(deferred, ALL_TAGS.map(tagLabel), 4).map((text) => ({ text, kind: "tag" as const })) : [];
    return [...tags, ...titles];
    // `typed` comes from `deferred`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferred, results, recent, hasExplore]);
  const tagIdOf = (label: string) => ALL_TAGS.find((id) => tagLabel(id) === label) ?? null;

  const flat = groups.flatMap((g) => g.items);
  const active = flat.find((r) => r.key === activeKey) ?? flat[0] ?? null;

  const go = (r: Result) => {
    if (query.trim()) rememberSearch(corrected ?? query);
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
          setTag(null);
          setExact(false);
        }
      }}
    >
      <DialogContent showCloseButton={false} className="top-[12svh] flex h-[min(44rem,76svh)] w-[min(72rem,calc(100%-4rem))] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-none max-lg:top-0 max-lg:left-0 max-lg:h-svh max-lg:w-screen max-lg:max-w-none max-lg:translate-x-0 max-lg:rounded-none max-lg:border-0">
        <DialogTitle className="sr-only">Search Nia</DialogTitle>
        <DialogDescription className="sr-only">Projects, documents, files, templates and Explore. Use the arrow keys to move through results and Enter to open one.</DialogDescription>

        <div className="flex flex-col gap-4 border-b border-border p-4 lg:p-5">
          <SearchField
            label="Search Nia"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveKey(null);
              setExact(false);
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
            suffix={
              <>
                <kbd className="rounded-md bg-muted px-2 py-0.5 font-sans text-caption text-muted-foreground max-lg:hidden">esc</kbd>
                {/* Phones and tablets have no Escape key. */}
                <button type="button" onClick={() => onOpenChange(false)} className="rounded-sm text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
                  Cancel
                </button>
              </>
            }
          />
          <ChipRow role="group" aria-label="Show">
            <FilterChip on={filter === "all"} onClick={() => (setFilter("all"), setActiveKey(null))}>
              All
            </FilterChip>
            {GROUPS.filter((g) => g.kind !== "explore" || hasExplore).map((g) => (
              <FilterChip key={g.kind} on={filter === g.kind} count={results ? counts[g.kind] : undefined} onClick={() => (setFilter(g.kind), setActiveKey(null))}>
                {g.label}
              </FilterChip>
            ))}
            {tag && (
              <FilterChip on onClick={() => (setTag(null), setActiveKey(null))} aria-label={`Stop searching by the ${tagLabel(tag)} tag`}>
                <Hash aria-hidden className="size-3.5" />
                {tagLabel(tag)}
                <X aria-hidden className="size-3.5" />
              </FilterChip>
            )}
          </ChipRow>
          {suggestions.length > 0 && (
            <div role="group" aria-label={typed.length ? "Suggestions" : "Suggested searches"} className="-mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {suggestions.map((x) => {
                const Icon = x.kind === "recent" ? History : x.kind === "tag" ? Hash : Search;
                return (
                  <button
                    key={`${x.kind}:${x.text}`}
                    type="button"
                    onClick={() => {
                      const id = x.kind === "tag" ? tagIdOf(x.text) : null;
                      if (id) {
                        setTag(id);
                        setQuery("");
                        setFilter("all");
                      } else setQuery(x.text);
                      setActiveKey(null);
                      setExact(false);
                    }}
                    className="flex items-center gap-1.5 rounded-sm text-small text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon aria-hidden className="size-3.5" />
                    {x.kind === "tag" ? `Tag: ${x.text}` : x.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div ref={list} id={listId} role="listbox" aria-label="Results" className="min-h-0 overflow-y-auto p-3">
            {corrected && (
              <p className="px-3 pt-1 pb-2 text-small text-muted-foreground">
                Showing results for <span className="font-semibold text-foreground">{corrected}</span>.{" "}
                <button type="button" onClick={() => setExact(true)} className="rounded-sm font-semibold underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                  Search for &ldquo;{deferred.trim()}&rdquo; instead
                </button>
              </p>
            )}
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
                  <p className="px-3 pt-2 pb-1.5 text-caption text-muted-foreground">{words.length || filter !== "all" || tag ? g.label : `Recent ${g.label.toLowerCase()}`}</p>
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

          <aside aria-label="Preview" className="min-h-0 overflow-y-auto border-l border-border bg-nia-panel p-6 max-lg:hidden">
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
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-card">
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
