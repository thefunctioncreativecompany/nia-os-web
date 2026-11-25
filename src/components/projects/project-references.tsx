"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Download, FolderPlus, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import type { ProjectFile } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { exploreItem } from "@/features/explore/items";
import { loadReferences, removeReference } from "@/features/explore/saves";
import { loadInstagramReferences, referenceHref, type InstagramReference } from "@/lib/instagram-references";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChipRow, FilterChip, chipClass } from "@/components/nia/filter-bar";
import { NotYet } from "@/components/nia/not-yet";
import { CARD_DRAG_TYPE } from "@/components/nia/drag-reorder";
import { Dropzone, PageIcon, useProjectFiles } from "./project-files";
import { AddInstagramReference } from "./add-instagram-reference";
import { REFERENCES_CHANGED } from "./references-events";

// A project's references in folders (Ika, 2026-11-24, PR1: "teams sort references into named
// folders instead of one endless gallery; smaller tiles; a full-screen view with next/previous and
// the reference's details"). One gallery for every kind: pictures uploaded as references
// (project_files tagged reference), Explore titles and Instagram posts (project_references).
// Folders (project_reference_folders, 20261126000000_reference_folders.sql) run across the top in
// Marketplace's chip look; each reference sits in one folder or none (Unsorted). Editors make,
// rename, reorder and remove folders, move references by Select + Move to, or by dragging a tile
// onto a folder, and drag tiles to reorder them (the team's order, `position`, as on Overview).
// Opening a tile shows the viewer: the picture, previous and next (buttons and arrow keys), and its
// details (where it's from, folder, note, links).

type Folder = { id: string; name: string; position: number | null };
type Table = "project_files" | "project_references";
type Item = {
  id: string;
  table: Table;
  name: string;
  /** The tile's picture (a smaller copy where there is one) and the viewer's. */
  thumb: string | null;
  picture: string | null;
  at: string;
  /** Where it came from, under its name in the viewer. */
  source: string;
  link?: { href: string; label: string; external?: boolean };
  file?: ProjectFile;
};
type Placed = { folder: string | null; position: number | null; note: string | null; /** Who added it. */ by?: string | null };
/** All, things in no folder, or one folder. */
type View = "all" | "unsorted" | string;

const last = Number.MAX_SAFE_INTEGER;

export function ProjectReferences({ projectId, files, canEdit, now }: { projectId: string; files: ProjectFile[]; canEdit: boolean; now: number }) {
  const { live, remove: archive, refresh } = useProjectFiles(files);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  // Folders need their migration; until it's run the gallery shows without them.
  const [foldersOn, setFoldersOn] = useState(true);
  const [explore, setExplore] = useState<{ id: string; slug: string; at: string }[] | null>(null);
  const [posts, setPosts] = useState<InstagramReference[] | null>(null);
  const [postsOff, setPostsOff] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Each reference's folder, place and note, from both tables.
  const [placed, setPlaced] = useState<Map<string, Placed>>(new Map());
  const [chosen, setView] = useState<View>("all");
  // Names of the people on the project, for "added by".
  const [names, setNames] = useState<Map<string, string>>(new Map());

  const fileIds = files.map((f) => f.id).join(",");
  const loadFilePlaces = useCallback(async () => {
    const db = createClient();
    const { data, error } = await db.from("project_files").select("id, folder_id, position, note, uploaded_by").eq("project_id", projectId).eq("tag", "reference").is("deleted_at", null);
    if (error) return;
    setPlaced((was) => {
      const next = new Map(was);
      for (const r of data as { id: string; folder_id: string | null; position: number | null; note: string | null; uploaded_by: string | null }[]) next.set(r.id, { folder: r.folder_id, position: r.position, note: r.note, by: r.uploaded_by });
      return next;
    });
    // A new upload arrives with the page's next files (fileIds), so its folder is read then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, fileIds]);

  /** Loads the linked references and folders; returns the Instagram posts as loaded. */
  const loadLinked = useCallback(async () => {
    const db = createClient();
    const [ex, ig, places, fl, people, me] = await Promise.all([
      loadReferences(db, projectId),
      loadInstagramReferences(db, projectId).catch(() => null),
      db.from("project_references").select("id, folder_id, position, note, added_by").eq("project_id", projectId).is("deleted_at", null),
      db.from("project_reference_folders").select("id, name, position").eq("project_id", projectId).is("deleted_at", null),
      db.rpc("project_people", { pid: projectId }),
      currentUser(db),
    ]);
    setNames(new Map(((people.data ?? []) as { user_id: string | null; name: string | null }[]).flatMap((p) => (p.user_id && p.name ? [[p.user_id, p.user_id === me?.id ? "you" : p.name] as const] : []))));
    if (ex.ready) setExplore(ex.data.map((r) => ({ id: r.id, slug: r.slug, at: r.createdAt })));
    else setProblem(ex.error);
    if (ig) setPosts(ig);
    else {
      setPosts([]);
      setPostsOff(true);
    }
    if (!places.error) {
      setPlaced((was) => {
        const next = new Map(was);
        for (const r of places.data as { id: string; folder_id: string | null; position: number | null; note: string | null; added_by: string | null }[]) next.set(r.id, { folder: r.folder_id, position: r.position, note: r.note, by: r.added_by });
        return next;
      });
    }
    if (fl.error) {
      setFoldersOn(false);
      setFolders([]);
    } else setFolders((fl.data as Folder[]).toSorted((a, b) => (a.position ?? last) - (b.position ?? last) || a.name.localeCompare(b.name)));
    return ig ?? [];
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state changes only after the database answers
    void loadFilePlaces();
  }, [loadFilePlaces]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state changes only after the database answers
    void loadLinked();
    const again = () => void loadLinked();
    window.addEventListener(REFERENCES_CHANGED, again);
    return () => window.removeEventListener(REFERENCES_CHANGED, again);
  }, [loadLinked]);

  // ---- The gallery ----
  const items: Item[] = [
    ...live.map((f): Item => ({
      id: f.id,
      table: "project_files",
      name: f.name,
      thumb: f.kind === "image" ? (f.thumbUrl ?? f.url) : f.thumbUrl,
      picture: f.kind === "image" ? f.url : f.thumbUrl,
      at: f.createdAt,
      source: `Uploaded ${timeAgo(f.createdAt, now)}`,
      link: f.url ? { href: `${f.url}&download=${encodeURIComponent(f.name)}`, label: "Download" } : undefined,
      file: f,
    })),
    ...(explore ?? []).flatMap((r): Item[] => {
      const entry = exploreItem(r.slug);
      return entry ? [{ id: r.id, table: "project_references", name: entry.title, thumb: entry.image, picture: entry.image, at: r.at, source: "From Explore", link: { href: entry.href(), label: "Open in Explore" } }] : [];
    }),
    ...(posts ?? []).map((p): Item => ({
      id: p.id,
      table: "project_references",
      name: p.title || p.account || "Instagram post",
      thumb: p.coverUrl,
      picture: p.coverUrl,
      at: p.createdAt,
      source: p.account ? `Instagram · @${p.account}` : "Instagram",
      link: { href: referenceHref(projectId, p.id), label: "Open the post" },
    })),
  ];
  const place = (id: string) => placed.get(id) ?? { folder: null, position: null, note: null };
  const ordered = items.toSorted((a, b) => (place(a.id).position ?? last) - (place(b.id).position ?? last) || b.at.localeCompare(a.at));
  const known = new Set((folders ?? []).map((f) => f.id));
  // A folder removed elsewhere shows All.
  const view: View = chosen !== "all" && chosen !== "unsorted" && folders && !known.has(chosen) ? "all" : chosen;
  const folderOf = (id: string) => {
    const f = place(id).folder;
    return f && known.has(f) ? f : null;
  };
  const inView = (v: View) => (v === "all" ? ordered : v === "unsorted" ? ordered.filter((i) => !folderOf(i.id)) : ordered.filter((i) => folderOf(i.id) === v));
  const shown = inView(view);
  const loading = explore === null && !problem;
  const currentFolder = folders?.find((f) => f.id === view) ?? null;

  // ---- Changes ----
  const db = () => createClient();
  const update = async (item: Pick<Item, "id" | "table">, patch: Record<string, unknown>) => (await db().from(item.table).update(patch).eq("id", item.id)).error;

  const moveTo = async (list: Item[], folder: string | null) => {
    if (!list.length) return;
    const before = new Map(placed);
    setPlaced((was) => {
      const next = new Map(was);
      for (const i of list) next.set(i.id, { ...place(i.id), folder });
      return next;
    });
    const byTable = (t: Table) => list.filter((i) => i.table === t).map((i) => i.id);
    const results = await Promise.all((["project_files", "project_references"] as const).filter((t) => byTable(t).length).map((t) => db().from(t).update({ folder_id: folder }).in("id", byTable(t))));
    const failed = results.find((r) => r.error);
    if (failed) {
      setPlaced(before);
      return void toast.error(`Couldn't move ${list.length === 1 ? list[0].name : "those references"}. Try again.`);
    }
    const where = folder ? (folders?.find((f) => f.id === folder)?.name ?? "the folder") : "Unsorted";
    toast.success(`${list.length === 1 ? list[0].name : `${list.length} references`} moved to ${where}`, {
      action: { label: "Undo", onClick: () => void Promise.all(list.map((i) => update(i, { folder_id: before.get(i.id)?.folder ?? null }))).then(() => setPlaced(before)) },
    });
  };

  // Reordering within what's shown saves each shown reference's place (0, 1, 2…).
  const reorder = async (fromId: string, toId: string) => {
    const ids = shown.map((i) => i.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    const before = new Map(placed);
    setPlaced((was) => {
      const next = new Map(was);
      ids.forEach((id, position) => next.set(id, { ...place(id), position }));
      return next;
    });
    const results = await Promise.all(ids.map((id, position) => update(shown.find((i) => i.id === id)!, { position })));
    if (results.some(Boolean)) {
      setPlaced(before);
      toast.error("Couldn't save the order. Try again.");
    }
  };

  const saveNote = async (item: Item, text: string) => {
    const note = text.trim().slice(0, 1000) || null;
    if (place(item.id).note === note) return;
    if (await update(item, { note })) return void toast.error("Couldn't save the note. Try again.");
    setPlaced((was) => new Map(was).set(item.id, { ...place(item.id), note }));
  };

  const removeItem = async (item: Item) => {
    if (item.file) return void archive(item.file);
    const result = await removeReference(db(), item.id);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Removed ${item.name} from references.`);
    await loadLinked();
    window.dispatchEvent(new Event(REFERENCES_CHANGED));
  };

  // ---- Folders ----
  const [naming, setNaming] = useState<{ folder: Folder | null } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Folder | null>(null);
  const saveFolder = async (name: string) => {
    const clean = name.trim().slice(0, 60);
    if (!clean || !folders) return false;
    const clash = folders.find((f) => f.name.toLowerCase() === clean.toLowerCase() && f.id !== naming?.folder?.id);
    if (clash) {
      toast.error(`There's already a folder called ${clash.name}.`);
      return false;
    }
    if (naming?.folder) {
      const { error } = await db().from("project_reference_folders").update({ name: clean, updated_at: new Date().toISOString() }).eq("id", naming.folder.id);
      if (error) {
        toast.error("Couldn't rename the folder. Try again.");
        return false;
      }
      const id = naming.folder.id;
      setFolders((was) => was?.map((f) => (f.id === id ? { ...f, name: clean } : f)) ?? was);
      return true;
    }
    const { data, error } = await db().from("project_reference_folders").insert({ project_id: projectId, name: clean, position: folders.length }).select("id, name, position").single();
    if (error) {
      toast.error(error.code === "23505" ? `There's already a folder called ${clean}.` : "Couldn't make the folder. Try again.");
      return false;
    }
    setFolders((was) => [...(was ?? []), data as Folder]);
    setView((data as Folder).id);
    return true;
  };
  const moveFolder = async (folder: Folder, by: -1 | 1) => {
    if (!folders) return;
    const list = [...folders];
    const from = list.findIndex((f) => f.id === folder.id);
    const to = from + by;
    if (to < 0 || to >= list.length) return;
    list.splice(to, 0, list.splice(from, 1)[0]);
    const before = folders;
    setFolders(list.map((f, position) => ({ ...f, position })));
    const results = await Promise.all(list.map((f, position) => db().from("project_reference_folders").update({ position }).eq("id", f.id)));
    if (results.some((r) => r.error)) {
      setFolders(before);
      toast.error("Couldn't save the folder order. Try again.");
    }
  };
  const removeFolder = async (folder: Folder) => {
    const { error } = await db().rpc("remove_reference_folder", { folder_id: folder.id });
    if (error) return void toast.error("Couldn't remove the folder. Try again.");
    setPlaced((was) => new Map([...was].map(([id, p]) => [id, p.folder === folder.id ? { ...p, folder: null } : p])));
    setFolders((was) => was?.filter((f) => f.id !== folder.id) ?? was);
    setView("all");
    toast.success(`Removed ${folder.name}. Its references are in Unsorted.`);
  };

  // ---- Selecting several ----
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };
  const pick = (id: string) =>
    setPicked((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ---- Dragging a tile (onto another tile to reorder, onto a folder to move it there) ----
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const carries = (e: React.DragEvent) => [...e.dataTransfer.types].includes(CARD_DRAG_TYPE);
  const dropOnFolder = (folder: string | null) =>
    canEdit && foldersOn
      ? {
          onDragOver: (e: React.DragEvent) => {
            if (!carries(e)) return;
            e.preventDefault();
            setOver(`folder:${folder ?? "unsorted"}`);
          },
          onDragLeave: () => setOver(null),
          onDrop: (e: React.DragEvent) => {
            const id = e.dataTransfer.getData(CARD_DRAG_TYPE);
            setOver(null);
            const item = items.find((i) => i.id === id);
            if (item && folderOf(item.id) !== folder) void moveTo([item], folder);
          },
        }
      : {};

  // ---- Adding ----
  const [adding, setAdding] = useState(false);
  const inFolder = currentFolder?.id ?? null;
  const postAdded = async () => {
    const had = new Set((posts ?? []).map((p) => p.id));
    const latest = await loadLinked();
    // Added inside a folder: the new post goes into it.
    const fresh = latest.filter((p) => !had.has(p.id));
    if (inFolder && fresh.length) {
      const ids = fresh.map((p) => p.id);
      const { error } = await db().from("project_references").update({ folder_id: inFolder }).in("id", ids);
      if (!error) setPlaced((was) => new Map([...was, ...ids.map((id) => [id, { ...place(id), folder: inFolder }] as const)]));
    }
  };

  // ---- Viewer ----
  const [viewing, setViewing] = useState<number | null>(null);
  const open = shown[viewing ?? -1] ?? null;
  const step = (by: number) => setViewing((v) => (v === null || shown.length === 0 ? v : (v + by + shown.length) % shown.length));

  const count = (v: View) => inView(v).length;
  const unsorted = count("unsorted");
  const hasFolders = foldersOn && (folders?.length ?? 0) > 0;

  return (
    <section id="references" aria-labelledby="project-references" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="project-references" className="text-subtitle font-semibold text-foreground">
          References {items.length > 0 && <span className="text-micro font-normal text-muted-foreground">{items.length}</span>}
        </h2>
        {canEdit && (
          <div className="flex items-center gap-2">
            {shown.length > 1 && (
              <Button variant="ghost" size="compact" onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
                {selecting ? "Done" : "Select"}
              </Button>
            )}
            <Button variant="secondary" size="compact" aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
              {adding ? "Close" : "Add"}
            </Button>
          </div>
        )}
      </div>

      {foldersOn && (hasFolders || canEdit) && (
        <div className="flex min-w-0 items-center gap-2">
          <ChipRow aria-label="Folders" className="flex-1">
            <FilterChip on={view === "all"} count={items.length} onClick={() => setView("all")}>
              All
            </FilterChip>
            {(folders ?? []).map((f) => (
              <FilterChip key={f.id} on={view === f.id} count={count(f.id)} onClick={() => setView(f.id)} {...dropOnFolder(f.id)} className={cn(over === `folder:${f.id}` && "border-nia-blue bg-nia-blue/10")}>
                {f.name}
              </FilterChip>
            ))}
            {hasFolders && unsorted > 0 && (
              <FilterChip on={view === "unsorted"} count={unsorted} onClick={() => setView("unsorted")} {...dropOnFolder(null)} className={cn(over === "folder:unsorted" && "border-nia-blue bg-nia-blue/10")}>
                Unsorted
              </FilterChip>
            )}
            {canEdit && (
              <button type="button" onClick={() => setNaming({ folder: null })} className={cn(chipClass(false), "border-dashed text-muted-foreground")}>
                <FolderPlus aria-hidden className="size-4" /> New folder
              </button>
            )}
          </ChipRow>
          {canEdit && currentFolder && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`${currentFolder.name}: folder options`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setNaming({ folder: currentFolder })}>Rename</DropdownMenuItem>
                <DropdownMenuItem disabled={folders?.[0]?.id === currentFolder.id} onSelect={() => void moveFolder(currentFolder, -1)}>
                  Move earlier
                </DropdownMenuItem>
                <DropdownMenuItem disabled={folders?.at(-1)?.id === currentFolder.id} onSelect={() => void moveFolder(currentFolder, 1)}>
                  Move later
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmRemove(currentFolder)}>
                  Remove folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {canEdit && adding && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <Dropzone projectId={projectId} tag="reference" folderId={inFolder} onUploaded={refresh} hint={currentFolder ? `Pictures go into ${currentFolder.name}` : undefined} />
          {postsOff ? <NotYet>Adding Instagram links isn&rsquo;t switched on yet.</NotYet> : <AddInstagramReference projectId={projectId} held={new Set((posts ?? []).map((p) => p.link.code))} onAdded={() => void postAdded()} />}
        </div>
      )}

      {problem && <NotYet>{problem} Titles added from Explore will show here.</NotYet>}

      {loading ? (
        <ul aria-hidden className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex flex-col gap-1.5">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {items.length === 0 ? (canEdit ? "No references yet. Add pictures or Instagram links, or titles from Inspiration below." : "No references yet.") : currentFolder ? `Nothing in ${currentFolder.name} yet.` : "Nothing here."}
        </p>
      ) : (
        <ul className="grid grid-cols-3 items-start gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {shown.map((item, i) => {
            const on = picked.has(item.id);
            return (
              <li
                key={item.id}
                className={cn("group relative flex min-w-0 flex-col gap-1.5 rounded-lg", dragging === item.id && "opacity-40", over === item.id && dragging !== item.id && "ring-3 ring-nia-blue/60")}
                draggable={canEdit && !selecting}
                onDragStart={(e) => {
                  e.dataTransfer.setData(CARD_DRAG_TYPE, item.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDragging(item.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                onDragOver={(e) => {
                  if (!dragging || !carries(e)) return;
                  e.preventDefault();
                  setOver(item.id);
                }}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData(CARD_DRAG_TYPE);
                  setOver(null);
                  if (id) void reorder(id, item.id);
                }}
              >
                <button
                  type="button"
                  aria-label={selecting ? `Select ${item.name}` : `Open ${item.name}`}
                  aria-pressed={selecting ? on : undefined}
                  onClick={() => (selecting ? pick(item.id) : setViewing(i))}
                  className={cn("relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on && "ring-3 ring-nia-blue")}
                >
                  {item.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private files use short-lived links, which the image optimiser would cache
                    <img src={item.thumb} alt="" loading="lazy" draggable={false} className="size-full object-cover transition-transform duration-base ease-out group-hover:scale-[1.03]" />
                  ) : item.file ? (
                    <span className="flex size-full items-center justify-center">
                      <PageIcon name={item.file.name} kind={item.file.kind} size={44} />
                    </span>
                  ) : null}
                  {selecting && (
                    <span className={cn("absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border-2", on ? "border-nia-blue bg-nia-blue text-nia-blue-foreground" : "border-white bg-black/20")}>
                      {on && <Check aria-hidden className="size-3.5" />}
                    </span>
                  )}
                </button>
                <span className="truncate text-small font-medium text-foreground">{item.name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {selecting && (
        <div role="toolbar" aria-label="Selected references" className="fixed inset-x-0 bottom-28 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 rounded-full border border-border bg-card p-2 pl-4 shadow-elevation-2 lg:bottom-6">
          <span aria-live="polite" className="text-small font-semibold text-foreground tabular-nums">
            {picked.size} selected
          </span>
          <Button variant="ghost" size="compact" onClick={() => setPicked(new Set(shown.map((i) => i.id)))}>
            Select all
          </Button>
          {foldersOn && (
            <Select
              value=""
              disabled={!picked.size}
              onValueChange={(v) => {
                if (v === "new") return setNaming({ folder: null });
                void moveTo(shown.filter((i) => picked.has(i.id)), v === "unsorted" ? null : v).then(stopSelecting);
              }}
            >
              <SelectTrigger aria-label="Move selected to" className="h-8 w-auto rounded-full text-small">
                <SelectValue placeholder="Move to…" />
              </SelectTrigger>
              <SelectContent>
                {(folders ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
                <SelectItem value="unsorted">Unsorted</SelectItem>
                <SelectItem value="new">New folder…</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon-sm" aria-label="Stop selecting" onClick={stopSelecting}>
            <X />
          </Button>
        </div>
      )}

      <FolderNameDialog open={naming !== null} folder={naming?.folder ?? null} onClose={() => setNaming(null)} onSave={saveFolder} />

      <AlertDialog open={confirmRemove !== null} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent className="max-w-110 gap-4">
          <AlertDialogTitle className="text-left text-lg">Remove {confirmRemove?.name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-normal text-muted-foreground">Nothing in it is deleted: its references go back to Unsorted.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                if (confirmRemove) void removeFolder(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              Remove folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[min(92svh,60rem)] max-w-[min(96vw,90rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,90rem)] lg:flex-row"
          onKeyDown={(e) => {
            if (e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          {open && (
            <>
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-foreground">
                {open.file?.kind === "video" && open.file.url ? (
                  <video key={open.id} controls preload="metadata" src={open.file.url} className="max-h-full max-w-full" />
                ) : open.file?.kind === "audio" && open.file.url ? (
                  <audio key={open.id} controls preload="none" src={open.file.url} className="w-3/4" />
                ) : open.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element -- see above
                  <img key={open.id} src={open.picture} alt={open.name} className="max-h-full max-w-full object-contain" />
                ) : open.file ? (
                  <PageIcon name={open.file.name} kind={open.file.kind} size={96} />
                ) : null}
                <button type="button" aria-label="Close" onClick={() => setViewing(null)} className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-white/50">
                  <X className="size-4" />
                </button>
                {shown.length > 1 && (
                  <>
                    <button type="button" aria-label="Previous" onClick={() => step(-1)} className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-white/50">
                      <ChevronLeft />
                    </button>
                    <button type="button" aria-label="Next" onClick={() => step(1)} className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-white/50">
                      <ChevronRight />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-caption text-white tabular-nums">
                      {(viewing ?? 0) + 1} of {shown.length}
                    </span>
                  </>
                )}
              </div>
              <ReferenceDetails
                key={open.id}
                item={open}
                note={place(open.id).note}
                by={names.get(place(open.id).by ?? "") ?? null}
                folder={folderOf(open.id)}
                folders={foldersOn ? (folders ?? []) : null}
                canEdit={canEdit}
                position={viewing ?? 0}
                count={shown.length}
                onFolder={(f) => void moveTo([open], f)}
                onNote={(text) => void saveNote(open, text)}
                onMove={(by) => {
                  const to = shown[(viewing ?? 0) + by];
                  if (!to) return;
                  void reorder(open.id, to.id).then(() => setViewing((v) => (v === null ? v : v + by)));
                }}
                onRemove={() => {
                  setViewing(null);
                  void removeItem(open);
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** The viewer's side: where it's from, its folder and note, and what can be done with it. */
function ReferenceDetails({
  item,
  note,
  by,
  folder,
  folders,
  canEdit,
  position,
  count,
  onFolder,
  onNote,
  onMove,
  onRemove,
}: {
  item: Item;
  note: string | null;
  /** Who added it, by name ("you" for this person). */
  by: string | null;
  folder: string | null;
  /** Null when folders aren't switched on yet. */
  folders: Folder[] | null;
  canEdit: boolean;
  position: number;
  count: number;
  onFolder: (folder: string | null) => void;
  onNote: (text: string) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  const label = "text-small font-bold text-muted-foreground";
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border p-6 lg:w-88 lg:border-t-0 lg:border-l">
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-subtitle font-semibold break-words text-foreground">{item.name}</DialogTitle>
        <DialogDescription className="text-small text-muted-foreground">
          {item.source}
          {by && ` · added by ${by}`}
        </DialogDescription>
      </div>

      {folders && (
        <div className="flex flex-col gap-2">
          <span id="reference-folder" className={label}>
            Folder
          </span>
          {canEdit ? (
            <Select value={folder ?? "unsorted"} onValueChange={(v) => onFolder(v === "unsorted" ? null : v)}>
              <SelectTrigger aria-labelledby="reference-folder" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unsorted">Unsorted</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-foreground">{folders.find((f) => f.id === folder)?.name ?? "Unsorted"}</span>
          )}
        </div>
      )}

      {canEdit ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="reference-note" className={label}>
            Note
          </label>
          <Textarea id="reference-note" defaultValue={note ?? ""} placeholder="What to take from it" rows={4} maxLength={1000} onBlur={(e) => onNote(e.target.value)} className="resize-none" />
        </div>
      ) : note ? (
        <div className="flex flex-col gap-2">
          <span className={label}>Note</span>
          <p className="text-sm whitespace-pre-line text-foreground">{note}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {item.link &&
          (item.file ? (
            <Button asChild variant="outline" size="compact">
              <a href={item.link.href}>
                <Download aria-hidden /> {item.link.label}
              </a>
            </Button>
          ) : (
            <Button asChild variant="outline" size="compact">
              <Link href={item.link.href}>
                {item.link.label} <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          ))}
      </div>

      {canEdit && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button variant="ghost" size="compact" disabled={position === 0} onClick={() => onMove(-1)}>
            Move earlier
          </Button>
          <Button variant="ghost" size="compact" disabled={position >= count - 1} onClick={() => onMove(1)}>
            Move later
          </Button>
          <Button variant="ghost" size="compact" className="ml-auto text-muted-foreground" onClick={onRemove}>
            {item.file ? "Archive" : "Remove"}
          </Button>
        </div>
      )}
    </aside>
  );
}

/** Naming a new folder, or renaming one. */
function FolderNameDialog({ open, folder, onClose, onSave }: { open: boolean; folder: Folder | null; onClose: () => void; onSave: (name: string) => Promise<boolean | undefined> }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-100 gap-4">
        <DialogTitle className="text-lg font-semibold">{folder ? "Rename folder" : "New folder"}</DialogTitle>
        <DialogDescription className="sr-only">{folder ? `A new name for ${folder.name}.` : "A name for the new folder, such as Lighting or Wardrobe."}</DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const ok = await onSave(input.current?.value ?? "");
            setBusy(false);
            if (ok) onClose();
          }}
        >
          <Input key={folder?.id ?? "new"} ref={input} aria-label="Folder name" defaultValue={folder?.name ?? ""} placeholder="Lighting, wardrobe, location…" maxLength={60} autoFocus required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {folder ? "Rename" : "Make folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
