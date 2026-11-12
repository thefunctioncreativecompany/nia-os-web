"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { projectLimitReached } from "@/lib/plan-client";
import { recordEvent } from "@/lib/product-events";
import type { ProductionType } from "@/lib/projects";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_COLLECTION,
  addReference,
  createCollection,
  editableProjects,
  loadCollections,
  projectsHolding,
  saveTitle,
  unsaveTitle,
  type Collection,
  type EditableProject,
} from "@/features/explore/saves";

// Save a title into your collections (Ika, 2026-10-21: saved Explore titles live under Projects ›
// Collections). Opening it lists your collections with a tick where the title is; a first save
// goes into "Saved". You can start a new collection from here.
export function SaveToCollection({ slug, title, size = "pill" }: { slug: string; title: string; size?: "pill" | "compact" }) {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const saved = collections?.some((c) => c.items.some((i) => i.slug === slug)) ?? false;

  const load = async () => {
    const db = createClient();
    const result = await loadCollections(db);
    if (!result.ready) return setProblem(result.error);
    let list = result.data;
    // A first save needs somewhere to go.
    if (list.length === 0) {
      const made = await createCollection(db, DEFAULT_COLLECTION);
      if (!made.ready) return setProblem(made.error);
      list = [made.data];
    }
    setCollections(list);
  };

  const toggle = async (c: Collection) => {
    setBusy(true);
    const db = createClient();
    const item = c.items.find((i) => i.slug === slug);
    const result = item ? await unsaveTitle(db, item.id) : await saveTitle(db, c.id, slug);
    setBusy(false);
    if (!result.ready) return void toast.error(result.error);
    toast.success(item ? `Removed ${title} from ${c.name}.` : `Saved ${title} to ${c.name}.`);
    void load();
  };

  const addCollection = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const db = createClient();
    const made = await createCollection(db, name);
    if (!made.ready) {
      setBusy(false);
      return void toast.error(made.error);
    }
    const result = await saveTitle(db, made.data.id, slug);
    setBusy(false);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Saved ${title} to ${made.data.name}.`);
    setName("");
    void load();
  };

  return (
    <Popover onOpenChange={(open) => open && void load()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} aria-label={`Save ${title} to a collection`}>
          <Bookmark aria-hidden className={cn(saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-72 flex-col gap-3 rounded-2xl p-3">
        <p className="px-1 text-small font-semibold text-foreground">Save to a collection</p>
        {problem ? (
          <p className="px-1 text-small text-muted-foreground">{problem}</p>
        ) : !collections ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : (
          <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
            {collections.map((c) => {
              const on = c.items.some((i) => i.slug === slug);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={busy}
                    onClick={() => void toggle(c)}
                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-md border", on ? "border-foreground bg-foreground text-primary-foreground" : "border-border")}>
                      {on && <Check aria-hidden className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    <span className="text-caption text-muted-foreground">{c.items.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!problem && (
          <form
            className="flex gap-2 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              void addCollection();
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New collection" aria-label="New collection name" maxLength={80} className="h-9" />
            <Button type="submit" size="compact" disabled={busy || !name.trim()} aria-label="Make the collection and save to it">
              <Plus aria-hidden />
            </Button>
          </form>
        )}
        <Link href="/projects/collections" className="px-1 text-caption font-semibold text-muted-foreground hover:text-foreground">
          See your collections
        </Link>
      </PopoverContent>
    </Popover>
  );
}

// Add a title to a project's Files & references (Ika, 2026-10-21). Lists the projects you can
// edit, ticks the ones that already have it, and adds it in one tap. "New project" at the top
// (Ika, 2026-11-10: lead people from browsing to making, without interrupting them) starts a
// project with this title as its first reference, of the same kind of production (`kind`) when
// that's known; you stay on the page, and the toast offers to open it.
export function AddToProject({ slug, title, size = "pill", kind }: { slug: string; title: string; size?: "pill" | "compact"; kind?: ProductionType }) {
  const router = useRouter();
  const [projects, setProjects] = useState<EditableProject[] | null>(null);
  const [holding, setHolding] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectTitle = name.trim();
    if (!projectTitle) return;
    setBusy("new");
    const db = createClient();
    const { data: workspaceId, error: wsError } = await db.rpc("my_workspace_id");
    if (wsError) return void (setBusy(null), toast.error("Couldn't start the project. Please try again."));
    if (await projectLimitReached(db, workspaceId)) return void (setBusy(null), openUpgrade("projects"));
    const { data: project, error } = await db
      .from("projects")
      .insert({ workspace_id: workspaceId, title: projectTitle, description: "", ...(kind ? { production_type: kind } : {}) })
      .select("id, title, cover_url")
      .single();
    if (error) return void (setBusy(null), toast.error(`Couldn't start the project: ${error.message}`));
    recordEvent("project_created", { projectId: project.id, props: { from: "explore", title: slug } });
    const added = await addReference(db, project.id, slug);
    setBusy(null);
    setProjects((list) => [{ id: project.id, title: project.title, coverUrl: project.cover_url }, ...(list ?? [])]);
    if (added.ready) setHolding((h) => new Set(h).add(project.id));
    setNaming(false);
    setName("");
    toast.success(`Started ${project.title}${added.ready ? `, with ${title} as its first reference` : ""}.`, { action: { label: "Open", onClick: () => router.push(`/projects/${project.id}`) } });
  };

  const load = async () => {
    const db = createClient();
    const [list, has] = await Promise.all([editableProjects(db), projectsHolding(db, slug)]);
    setProjects(list);
    setHolding(has);
  };

  const add = async (p: EditableProject) => {
    setBusy(p.id);
    const result = await addReference(createClient(), p.id, slug);
    setBusy(null);
    if (!result.ready) return void toast.error(result.error);
    setHolding((h) => new Set(h).add(p.id));
    toast.success(`Added ${title} to ${p.title}'s references.`, { action: { label: "Open", onClick: () => router.push(`/projects/${p.id}#references`) } });
  };

  return (
    <Popover onOpenChange={(open) => open && void load()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} aria-label={`Add ${title} to a project's references`}>
          <FolderPlus aria-hidden />
          Add to project
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-3 rounded-2xl p-3">
        <p className="px-1 text-small font-semibold text-foreground">Add to a project&rsquo;s references</p>
        {naming ? (
          <form onSubmit={create} className="flex items-center gap-2">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Project name" aria-label="New project's name" className="h-9 flex-1" />
            <Button type="submit" size="compact" disabled={!name.trim() || busy !== null}>
              {busy === "new" ? "Starting…" : "Start"}
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
              <Plus aria-hidden className="size-4 text-muted-foreground" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium text-foreground">New project</span>
              <span className="truncate text-caption text-muted-foreground">Starts with this as its first reference</span>
            </span>
          </button>
        )}
        {!projects ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : projects.length === 0 ? null : (
          <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
            {projects.map((p) => {
              const has = holding.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={has || busy !== null}
                    onClick={() => void add(p)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:hover:bg-transparent"
                  >
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.coverUrl && <Image src={p.coverUrl} alt="" fill sizes="36px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                    {has ? (
                      <span className="flex items-center gap-1 text-caption text-muted-foreground">
                        <Check aria-hidden className="size-3.5" /> Added
                      </span>
                    ) : (
                      <span className="text-caption font-semibold text-muted-foreground">{busy === p.id ? "Adding…" : "Add"}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
