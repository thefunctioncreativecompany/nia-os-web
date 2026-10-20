"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Crop } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile } from "@/lib/images";
import { GENRES, type Project } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Assignees, type PersonMatch, type PersonRef } from "@/components/nia/assignees";
import { ChoicePills } from "@/components/nia/choice-pills";
import { SavedIndicator } from "@/components/nia/saved-indicator";
import { SegmentedControl } from "@/components/nia/segmented-control";
import { EditableDate } from "@/components/projects/editable-date";
import { EditableText } from "@/components/projects/editable-text";
import { uploadCover } from "@/components/projects/project-form";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";

// Storage path of a cover URL, if it's in this project's folder (so it can be removed).
function coverPath(url: string | null, projectId: string) {
  const path = url?.split("/object/public/project-covers/")[1];
  return path?.startsWith(`${projectId}/`) ? decodeURIComponent(path) : null;
}

// Names stay plain text in the project ("Kai Cenat, Homer"), so they read the same everywhere
// (share link, search, downloads). Linking them to Nia profiles comes with Cast & Crew.
const toList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);
const toPeople = (value: string): PersonRef[] => toList(value).map((name) => ({ name }));
const fromPeople = (people: PersonRef[]) => people.map((p) => p.name).join(", ");

async function findPeople(q: string): Promise<PersonMatch[]> {
  const { data, error } = await createClient().rpc("find_people", { q });
  return error ? [] : (data as PersonMatch[]);
}

// "3 minutes" ↔ an amount and a unit (Ika, 2026-10-19: minutes, hours, days).
const UNITS = ["minutes", "hours", "days"] as const;
function parseDuration(value: string) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(minute|hour|day)s?\s*$/i.exec(value);
  return m ? { amount: m[1], unit: `${m[2].toLowerCase()}s` } : null;
}
const formatDuration = (amount: string, unit: string) => (amount ? `${amount} ${Number(amount) === 1 ? unit.slice(0, -1) : unit}` : "");

function DurationField({ value, readOnly, onSave }: { value: string; readOnly: boolean; onSave: (next: string) => Promise<void> }) {
  const parsed = parseDuration(value);
  const [amount, setAmount] = useState(parsed?.amount ?? "");
  const [unit, setUnit] = useState<string>(parsed?.unit ?? "minutes");
  // A change from elsewhere (another person, Edit details) replaces what's shown; this field's
  // own saves coming back (sometimes out of order) don't.
  const [seen, setSeen] = useState(value);
  const [mine, setMine] = useState<string[]>([]);
  if (value !== seen) {
    setSeen(value);
    if (!mine.includes(value)) {
      setAmount(parsed?.amount ?? "");
      setUnit(parsed?.unit ?? unit);
    }
  }
  if (readOnly) return <span className="block pt-1.5 text-sm font-medium text-muted-foreground">{value || "—"}</span>;
  const commit = (a: string, u: string) => {
    const next = formatDuration(a, u);
    if (next === value) return;
    setMine((list) => [...list, next]);
    void onSave(next).catch(() => {});
  };
  return (
    <div className="flex items-center gap-1">
      <Input
        aria-label="Duration: amount"
        inputMode="decimal"
        value={amount}
        // Older free-text durations show until a number replaces them.
        placeholder={parsed || !value ? "—" : value}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => commit(amount, unit)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="h-8 w-16 rounded-md border-transparent px-1.5 text-right text-sm font-medium text-muted-foreground shadow-none tabular-nums hover:bg-muted/70 focus-visible:border-transparent md:text-sm"
      />
      <Select
        value={unit}
        onValueChange={(u) => {
          setUnit(u);
          commit(amount, u);
        }}
      >
        <SelectTrigger aria-label="Duration: unit" className="h-8 w-auto border-transparent px-1.5 text-sm font-medium text-muted-foreground shadow-none hover:bg-muted/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UNITS.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// The project page (Figma 824:23124, Ika 2026-10-19): cover, title and description on the left;
// on the right Details (with Behind the Production) or Manage (actions, overview,
// documents, activity); stacked on phones and tablets. Files & references sit full width below.
// Every change saves on its own, with the SavedIndicator.
export function ProjectEditor({
  project: initial,
  canEdit,
  behind,
  manage,
  files,
}: {
  project: Project;
  canEdit: boolean;
  behind: React.ReactNode;
  manage: React.ReactNode;
  files: React.ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState(initial);
  const [loaded, setLoaded] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [tab, setTab] = useState<"details" | "manage">("details");

  // Pick up changes made elsewhere (Edit Project Details, another tab) after a refresh.
  if (initial !== loaded) {
    setLoaded(initial);
    setProject(initial);
  }
  const [isUploading, setIsUploading] = useState(false);

  const save = async (column: string, field: keyof Project, value: string | null) => {
    const before = project;
    setProject((p) => ({ ...p, [field]: value }));
    const { error } = await createClient().from("projects").update({ [column]: value }).eq("id", project.id);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      setProject(before);
      throw error;
    }
    setSavedAt(Date.now());
    router.refresh();
  };

  // Check a picked picture, then let them frame it before it uploads.
  const pickCover = (file: File | undefined) => {
    if (!file) return;
    const problem = checkCoverFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    cropper.start(file);
  };

  const changeCover = async (file: File) => {
    setIsUploading(true);
    try {
      const previous = project.coverUrl;
      const url = await uploadCover(project.id, file);
      await save("cover_url", "coverUrl", url);
      const oldPath = coverPath(previous, project.id);
      if (oldPath) await createClient().storage.from("project-covers").remove([oldPath]);
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const cropper = useCoverCropper((file) => changeCover(file));
  const genres = toList(project.genres);
  const coverButton =
    "flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-small font-semibold text-foreground shadow-sm outline-none transition-opacity duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100";
  const readValues = (values: string[]) => (
    <span className="flex flex-wrap gap-x-6 gap-y-1 pt-1.5 text-sm font-medium text-muted-foreground">
      {values.length ? values.map((v) => <span key={v}>{v}</span>) : "—"}
    </span>
  );

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-24 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{value}</dd>
    </div>
  );

  const people = (label: string, column: string, field: "director" | "writers" | "stars") =>
    row(
      label,
      canEdit ? (
        <Assignees label={label} value={toPeople(project[field])} onChange={(next) => void save(column, field, fromPeople(next)).catch(() => {})} search={findPeople} />
      ) : (
        readValues(toList(project[field]))
      ),
    );

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/projects"
          className="rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Back to Projects
        </Link>
        {savedAt && <SavedIndicator savedAt={savedAt} />}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: the cover, the title and what it's about. */}
        <div className="flex min-w-0 flex-col gap-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              pickCover(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {cropper.dialog}
          {project.coverUrl ? (
            <div className="group relative aspect-[19/10] w-full overflow-hidden rounded-3xl bg-muted">
              <Image src={project.coverUrl} alt="" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              {canEdit && (
                <div className="absolute top-4 right-4 flex gap-2">
                  {!isUploading && (
                    <button type="button" onClick={() => project.coverUrl && cropper.start(project.coverUrl)} className={coverButton}>
                      <Crop aria-hidden className="size-4" />
                      Adjust
                    </button>
                  )}
                  <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()} className={coverButton}>
                    <Camera aria-hidden className="size-4" />
                    {isUploading ? "Uploading…" : "Change cover"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={!canEdit || isUploading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[19/10] w-full flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-nia-line-strong bg-nia-panel text-lead font-medium text-muted-foreground outline-none transition-colors duration-fast enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Camera aria-hidden className="size-8" strokeWidth={1.5} />
              {isUploading ? "Uploading…" : canEdit ? "Add project thumbnail" : "No thumbnail yet"}
            </button>
          )}

          <div className="flex flex-col gap-3">
            {/* The project's title is the page's main heading (audit #5). */}
            <h1 className="contents">
              <EditableText
                label="Title"
                value={project.title}
                placeholder="Untitled Project"
                maxLength={120}
                readOnly={!canEdit}
                onSave={(next) => save("title", "title", next)}
                className={cn("text-h3 font-bold text-foreground md:text-h2", !project.title && "text-muted-foreground")}
              />
            </h1>
            <EditableText
              label="Description"
              multiline
              value={project.description}
              placeholder="Add a description..."
              maxLength={2000}
              readOnly={!canEdit}
              onSave={(next) => save("description", "description", next)}
              className="text-sm leading-relaxed text-foreground/80"
            />
          </div>
        </div>

        {/* Right: Details or Manage. */}
        <div className="flex min-w-0 flex-col gap-8">
          <SegmentedControl
            label="Project sections"
            value={tab}
            onChange={(v) => setTab(v as "details" | "manage")}
            segments={[
              { value: "details", label: "Details" },
              { value: "manage", label: "Manage" },
            ]}
            className="max-w-xs"
          />

          {tab === "details" ? (
            <>
              <section aria-labelledby="details" className="flex flex-col gap-4">
                <h2 id="details" className="text-xl leading-[1.4] font-bold text-foreground">
                  Details
                </h2>
                <dl className="flex flex-col gap-3">
                  {row(
                    "Date",
                    <EditableDate
                      label="Date"
                      value={project.productionDate}
                      readOnly={!canEdit}
                      onSave={(next) => save("production_date", "productionDate", next)}
                      className="px-1.5 py-1 text-sm leading-normal font-medium text-muted-foreground"
                    />,
                  )}
                  {row("Duration", <DurationField value={project.duration} readOnly={!canEdit} onSave={(next) => save("duration", "duration", next)} />)}
                  {people("Director", "director", "director")}
                  {people("Writers", "writers", "writers")}
                  {row(
                    "Genres",
                    canEdit ? (
                      <ChoicePills
                        label="Genres"
                        value={null}
                        selected={genres}
                        // Several genres: tapping one adds or removes it.
                        onChange={(g) => void save("genres", "genres", (genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g]).join(", ")).catch(() => {})}
                        options={[...new Set([...genres, ...GENRES])].map((g) => ({ value: g, label: g }))}
                        className="gap-1.5 [&>button]:px-3 [&>button]:py-1 [&>button]:text-small"
                      />
                    ) : (
                      readValues(genres)
                    ),
                  )}
                  {people("Stars", "stars", "stars")}
                </dl>
              </section>

              <section aria-labelledby="behind" className="flex flex-col gap-4">
                <h2 id="behind" className="text-xl leading-[1.4] font-bold text-foreground">
                  Behind the Production
                </h2>
                {behind}
              </section>

            </>
          ) : (
            manage
          )}
        </div>
      </div>

      {files}
    </div>
  );
}
