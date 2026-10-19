"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Download, Trash2, Upload as UpIcon, X } from "lucide-react";
import { toast } from "sonner";

import { pdfFirstPage } from "@/lib/pdf-preview";
import type { FileKind, FileTag, ProjectFile } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/nia/segmented-control";

// Files on a project (BUILD_PLAN 2.4, Ika 2026-10-19): upload stills, documents, voice memos and
// video, tagged by what they are for (references, raw files, work in progress, final assets,
// briefs & paperwork) and shown by kind within each tag; a PDF's first page is its cover. The
// upload box is adapted from Bencho's Upload dropzone (MIT licence, bencho.dev/licence) for real
// files: a filled box with no edge that grows a little and lifts its arrow while a file is
// carried over it, each upload with its file icon, a rolling percentage and a bar, then a tick;
// a file over the limit shakes the box and says so. Reading files to autofill is parked (Ika:
// costs money); this stores and organises them.

const MAX_MB = 50;
const ACCEPT = "image/*,audio/*,video/mp4,video/quicktime,video/webm,.pdf,.txt,.md,.csv,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

// What each file is for (Ika, 2026-10-19); new uploads get the usual one for their kind.
export const TAGS: { value: FileTag; label: string; plural: string }[] = [
  { value: "reference", label: "Reference", plural: "References" },
  { value: "raw", label: "Raw file", plural: "Raw files" },
  { value: "wip", label: "Work in progress", plural: "Work in progress" },
  { value: "final", label: "Final asset", plural: "Final assets" },
  { value: "brief", label: "Brief & paperwork", plural: "Briefs & paperwork" },
];
const AUTO_TAG: Record<FileKind, FileTag> = { image: "reference", document: "brief", audio: "raw", video: "raw" };

const kindOf = (mime: string): FileKind =>
  mime.startsWith("image/") ? "image" : mime.startsWith("audio/") ? "audio" : mime.startsWith("video/") ? "video" : "document";

/** "4.2 MB", "380 KB". */
const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

const extension = (name: string) => (name.includes(".") ? name.split(".").pop()!.slice(0, 4).toUpperCase() : "FILE");

// The label colour carries the kind before the word is read (Bencho, after Untitled UI); Nia's
// own colours: ink for documents, teal stills, gold audio, rust video.
const TINT: Record<FileKind, string> = { document: "var(--foreground)", image: "var(--chart-2)", audio: "var(--gold)", video: "var(--chart-3)" };

/** A rounded page with a folded corner and the extension on a coloured label (Bencho). */
function PageIcon({ name, kind, size: px = 36 }: { name: string; kind: FileKind; size?: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
      <path
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
        className="fill-background stroke-border"
        strokeWidth="1.5"
      />
      <path d="M27 .5V8a4 4 0 0 0 4 4h7.5" className="stroke-border" strokeWidth="1.5" />
      <rect width="29" height="16" x="1" y="18" rx="8" style={{ fill: TINT[kind] }} />
      <text x="15.5" y="29.1" textAnchor="middle" fontSize="8" fontWeight="700" className="fill-background font-sans">
        {extension(name)}
      </text>
    </svg>
  );
}

/** The percentage rolls digit by digit rather than jumping (Bencho). */
function Roll({ value }: { value: number }) {
  const digits = String(Math.round(value));
  return (
    <span className="inline-flex tabular-nums" aria-label={`${digits}%`}>
      {digits.split("").map((d, i) => (
        <span key={digits.length - i} className="inline-block h-[1em] overflow-hidden leading-none">
          <span className="flex flex-col transition-transform duration-fast ease-out" style={{ transform: `translateY(${-Number(d)}em)` }}>
            {"0123456789".split("").map((n) => (
              <span key={n} className="h-[1em] leading-none">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
      %
    </span>
  );
}

type Upload = { key: string; name: string; kind: FileKind; bytes: number; progress: number; done: boolean };

/** Sends one file to the private bucket with progress (the Supabase library has no progress). */
function send(file: File, path: string, token: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/project-files/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(JSON.parse(xhr.responseText || "{}").message || `Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
}

/** The upload box. `tag`: what new files are tagged ("auto" picks by kind). Also used by Add document. */
export function Dropzone({ projectId, onUploaded, tag = "auto", accept = ACCEPT, hint }: { projectId: string; onUploaded: () => void; tag?: FileTag | "auto"; accept?: string; hint?: string }) {
  const reduced = useReducedMotion() ?? false;
  const input = useRef<HTMLInputElement>(null);
  // Each refusal replays the shake (a new key restarts it).
  const [shakes, setShakes] = useState(0);
  const [over, setOver] = useState(false);
  const [refuse, setRefuse] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const depth = useRef(0);

  const take = async (files: File[]) => {
    const tooBig = files.filter((f) => f.size > MAX_MB * 1e6);
    const ok = files.filter((f) => f.size <= MAX_MB * 1e6);
    if (tooBig.length) {
      setRefuse(tooBig.length === 1 ? `${tooBig[0].name} is over ${MAX_MB} MB` : `${tooBig.length} files are over ${MAX_MB} MB`);
      if (!reduced) setShakes((n) => n + 1);
      window.setTimeout(() => setRefuse(null), 2400);
    }
    if (!ok.length) return;
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return void toast.error("Sign in again to upload.");
    const batch = ok.map((f) => ({ file: f, up: { key: crypto.randomUUID(), name: f.name, kind: kindOf(f.type), bytes: f.size, progress: 0, done: false } }));
    setUploads((list) => [...list, ...batch.map((b) => b.up)]);
    const set = (key: string, patch: Partial<Upload>) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));
    await Promise.all(
      batch.map(async ({ file, up }) => {
        const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(-120) || "file";
        const path = `${projectId}/${up.key}-${safe}`;
        try {
          await send(file, path, session.access_token, (p) => set(up.key, { progress: p }));
          // A PDF's first page becomes its cover (best effort: a locked PDF just shows its icon).
          let thumb: string | null = null;
          if (file.type === "application/pdf") {
            const picture = await pdfFirstPage(file);
            if (picture) {
              const thumbPath = `${projectId}/${up.key}-preview.png`;
              const { error: thumbError } = await supabase.storage.from("project-files").upload(thumbPath, picture, { contentType: "image/png" });
              if (!thumbError) thumb = thumbPath;
            }
          }
          const { error } = await supabase.from("project_files").insert({
            project_id: projectId,
            name: file.name.slice(0, 255),
            path,
            mime: file.type,
            size: file.size,
            kind: up.kind,
            tag: tag === "auto" ? AUTO_TAG[up.kind] : tag,
            thumb_path: thumb,
          });
          if (error) throw error;
          set(up.key, { progress: 1, done: true });
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "couldn't upload"}`);
          setUploads((list) => list.filter((u) => u.key !== up.key));
        }
      }),
    );
    onUploaded();
    // Each finished row ticks, then leaves.
    window.setTimeout(() => setUploads((list) => list.filter((u) => !u.done)), 1500);
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" multiple accept={accept} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void take([...(e.target.files ?? [])]); e.target.value = ""; }} />
      <motion.div key={shakes} initial={{ x: 0 }} animate={shakes ? { x: [0, -7, 6, -4, 2, 0] } : { x: 0 }} transition={{ duration: 0.42 }}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); depth.current += 1; setOver(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => { depth.current -= 1; if (depth.current <= 0) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); depth.current = 0; setOver(false); void take([...e.dataTransfer.files]); }}
        aria-describedby="upload-limit"
        className={cn(
          // A plain filled box, no edge; it answers a file carried over it before it's let go.
          "group flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-nia-panel p-5 text-center outline-none transition-[transform,background-color] duration-base ease-out hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          over && "scale-[1.02] bg-muted",
          refuse && "bg-destructive/8",
        )}
      >
        <span className={cn("flex size-9 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition-transform duration-base ease-out", over && "-translate-y-1")}>
          <UpIcon aria-hidden className="size-4.5" />
        </span>
        <span aria-live="polite" className={cn("text-sm font-bold", refuse ? "text-destructive" : "text-foreground")}>
          {refuse ?? (over ? "Drop to upload" : "Drag files here, or choose files")}
        </span>
        <span id="upload-limit" className="text-caption text-muted-foreground">
          {hint ?? "Stills, PDFs and documents, voice memos, video"} · up to {MAX_MB} MB each
        </span>
      </button>
      </motion.div>
      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Uploading">
          {uploads.map((u) => (
            <li key={u.key} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
              <PageIcon name={u.name} kind={u.kind} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{u.name}</span>
                <span className="block text-caption text-muted-foreground">
                  {size(u.bytes)} · {u.done ? "Uploaded" : <Roll value={u.progress * 100} />}
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full origin-left rounded-full bg-foreground transition-transform duration-fast ease-out" style={{ transform: `scaleX(${u.done ? 1 : u.progress})` }} />
                </span>
              </span>
              {/* the tick's room is kept from the start, so nothing moves when it arrives */}
              <span className="flex size-6 shrink-0 items-center justify-center">
                {u.done && (
                  <motion.span initial={reduced ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                    <Check aria-hidden className="size-3.5" />
                  </motion.span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A tag on a file, changeable by editors from a small menu. */
function TagMenu({ file, canEdit, onChange }: { file: ProjectFile; canEdit: boolean; onChange: (tag: FileTag) => void }) {
  const label = TAGS.find((t) => t.value === file.tag)?.label ?? "Untagged";
  if (!canEdit) return <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">{label}</span>;
  return (
    <Select value={file.tag ?? ""} onValueChange={(v) => onChange(v as FileTag)}>
      <SelectTrigger aria-label={`Tag for ${file.name}: ${label}`} className="h-6 w-auto gap-1 rounded-full border-0 bg-muted px-2 py-0 text-micro font-semibold text-muted-foreground shadow-none hover:text-foreground data-[size=default]:h-6 [&_svg]:size-3">
        <SelectValue placeholder="Untagged">{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TAGS.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Tab = "all" | FileTag;

export function ProjectFiles({ projectId, files, canEdit, now }: { projectId: string; files: ProjectFile[]; canEdit: boolean; now: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [uploadTag, setUploadTag] = useState<FileTag | "auto">("auto");
  const [viewing, setViewing] = useState<number | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [retagged, setRetagged] = useState<Record<string, FileTag>>({});

  const live = files.filter((f) => !removed.includes(f.id)).map((f) => (retagged[f.id] ? { ...f, tag: retagged[f.id] } : f));
  const inTab = tab === "all" ? live : live.filter((f) => f.tag === tab);
  const of = (kind: FileKind) => inTab.filter((f) => f.kind === kind);
  const stills = of("image");

  const remove = async (file: ProjectFile) => {
    setRemoved((r) => [...r, file.id]);
    const { error } = await createClient().rpc("remove_project_file", { file_id: file.id });
    if (error) {
      setRemoved((r) => r.filter((id) => id !== file.id));
      return void toast.error(`Couldn't remove ${file.name}: ${error.message}`);
    }
    toast.success(`Removed ${file.name}`);
    router.refresh();
  };

  const retag = async (file: ProjectFile, tag: FileTag) => {
    setRetagged((r) => ({ ...r, [file.id]: tag }));
    const { error } = await createClient().from("project_files").update({ tag }).eq("id", file.id);
    if (error) {
      setRetagged((r) => {
        const next = { ...r };
        delete next[file.id];
        return next;
      });
      return void toast.error(`Couldn't tag ${file.name}: ${error.message}`);
    }
    router.refresh();
  };

  const actions = (file: ProjectFile) => (
    <span className="flex shrink-0 items-center gap-1">
      {file.url && (
        <Button asChild variant="ghost" size="icon-sm" aria-label={`Download ${file.name}`}>
          <a href={`${file.url}&download=${encodeURIComponent(file.name)}`}>
            <Download />
          </a>
        </Button>
      )}
      {canEdit && (
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => remove(file)}>
          <Trash2 />
        </Button>
      )}
    </span>
  );

  const meta = (file: ProjectFile) => (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <TagMenu file={file} canEdit={canEdit} onChange={(t) => retag(file, t)} />
      <span className="text-caption text-muted-foreground">
        {size(file.size)} · {timeAgo(file.createdAt, now)}
      </span>
    </span>
  );

  const row = (file: ProjectFile, extra?: React.ReactNode) => (
    <li key={file.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3">
      <div className="flex items-center gap-3">
        <PageIcon name={file.name} kind={file.kind} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {file.url ? (
            <a href={file.url} target="_blank" rel="noreferrer" className="truncate text-sm font-semibold text-foreground hover:underline">
              {file.name}
            </a>
          ) : (
            <span className="truncate text-sm font-semibold text-foreground">{file.name}</span>
          )}
          {meta(file)}
        </span>
        {actions(file)}
      </div>
      {extra}
    </li>
  );

  const group = (title: string, count: number, body: React.ReactNode) =>
    count > 0 && (
      <div className="flex flex-col gap-2">
        <h3 className="text-small font-bold text-muted-foreground">
          {title} · {count}
        </h3>
        {body}
      </div>
    );

  const counts = Object.fromEntries(TAGS.map((t) => [t.value, live.filter((f) => f.tag === t.value).length]));

  return (
    <section aria-labelledby="files" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 id="files" className="text-lg leading-[1.4] font-bold text-foreground">
          Files &amp; references
        </h2>
        {live.length > 0 && (
          <SegmentedControl
            className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:max-w-full sm:px-0"
            label="Show files"
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            segments={[{ value: "all", label: "All", count: live.length }, ...TAGS.map((t) => ({ value: t.value, label: t.plural, count: counts[t.value] }))]}
          />
        )}
      </div>
      {canEdit && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-small text-muted-foreground">
            <span id="upload-tag">Tag new files as</span>
            <Select value={uploadTag} onValueChange={(v) => setUploadTag(v as FileTag | "auto")}>
              <SelectTrigger aria-labelledby="upload-tag" className="h-8 w-auto rounded-full text-small">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic (by kind of file)</SelectItem>
                {TAGS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dropzone projectId={projectId} tag={uploadTag} onUploaded={() => router.refresh()} />
        </div>
      )}
      {live.length === 0 && !canEdit && <p className="text-small text-muted-foreground">No files yet.</p>}
      {live.length > 0 && inTab.length === 0 && <p className="text-small text-muted-foreground">Nothing tagged {TAGS.find((t) => t.value === tab)?.label.toLowerCase()} yet. Change a file&rsquo;s tag from the menu on it.</p>}

      {group(
        "Stills",
        stills.length,
        // Stills keep their own shape, like a mood board.
        <ul className="columns-2 gap-2.5 sm:columns-3">
          {stills.map((file, i) => (
            <li key={file.id} className="group relative mb-2.5 break-inside-avoid">
              <button type="button" aria-label={`Open ${file.name}`} onClick={() => setViewing(i)} className="block w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                {/* eslint-disable-next-line @next/next/no-img-element -- private files use short-lived links, which the image optimiser would cache */}
                {file.url && <img src={file.url} alt={file.name} loading="lazy" className="h-auto w-full transition-transform duration-base ease-out group-hover:scale-[1.02]" />}
              </button>
              <span className="pointer-events-none absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-1">
                <span className="pointer-events-auto rounded-full bg-white/90 shadow-sm">
                  <TagMenu file={file} canEdit={canEdit} onChange={(t) => retag(file, t)} />
                </span>
                <span className="pointer-events-auto rounded-lg bg-white/90 opacity-0 shadow-sm transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100">{actions(file)}</span>
              </span>
            </li>
          ))}
        </ul>,
      )}
      {group(
        "Documents",
        of("document").length,
        // Documents as covers: the first page where there is one, otherwise the file's icon.
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {of("document").map((file) => (
            <li key={file.id} className="group flex min-w-0 flex-col gap-2">
              <a
                href={file.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${file.name}`}
                className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-border bg-nia-panel outline-none transition-[box-shadow,border-color] duration-base ease-out hover:border-ring hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {file.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- see above
                  <img src={file.thumbUrl} alt="" loading="lazy" className="size-full object-cover object-top" />
                ) : (
                  <PageIcon name={file.name} kind={file.kind} size={56} />
                )}
              </a>
              <div className="flex items-start gap-1">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold text-foreground">{file.name}</span>
                  {meta(file)}
                </span>
                {actions(file)}
              </div>
            </li>
          ))}
        </ul>,
      )}
      {group("Audio", of("audio").length, <ul className="flex flex-col gap-2">{of("audio").map((f) => row(f, f.url && <audio controls preload="none" src={f.url} className="h-9 w-full" />))}</ul>)}
      {group("Video", of("video").length, <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">{of("video").map((f) => row(f, f.url && <video controls preload="metadata" src={f.url} className="aspect-video w-full rounded-lg bg-foreground" />))}</ul>)}

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(92vw,72rem)] border-0 bg-foreground p-0 sm:max-w-[min(92vw,72rem)]"
          onKeyDown={(e) => {
            if (viewing === null) return;
            if (e.key === "ArrowRight") setViewing((viewing + 1) % stills.length);
            if (e.key === "ArrowLeft") setViewing((viewing - 1 + stills.length) % stills.length);
          }}
        >
          <DialogTitle className="sr-only">{viewing !== null ? stills[viewing]?.name : "Still"}</DialogTitle>
          <DialogDescription className="sr-only">Left and right arrows move between stills.</DialogDescription>
          {viewing !== null && stills[viewing]?.url && (
            <div className="relative flex max-h-[86svh] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img src={stills[viewing].url!} alt={stills[viewing].name} className="max-h-[86svh] w-auto rounded-lg object-contain" />
              <button type="button" aria-label="Close" onClick={() => setViewing(null)} className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-white/50">
                <X className="size-4" />
              </button>
              {stills.length > 1 && (
                <>
                  <button type="button" aria-label="Previous" onClick={() => setViewing((viewing - 1 + stills.length) % stills.length)} className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70">
                    <ChevronLeft />
                  </button>
                  <button type="button" aria-label="Next" onClick={() => setViewing((viewing + 1) % stills.length)} className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white outline-none hover:bg-black/70">
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
