"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Crop } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile } from "@/lib/images";
import { GENRES, shootDatesText, typeDetails, type Project } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChoicePills } from "@/components/nia/choice-pills";
import { SavedIndicator } from "@/components/nia/saved-indicator";
import { SegmentedControl } from "@/components/nia/segmented-control";
import { EditableDate } from "@/components/projects/editable-date";
import { EditableText } from "@/components/projects/editable-text";
import { BudgetField, CrewSection, DeliverablesField, NumberField, ShootDatesField } from "@/components/projects/project-details";
import { uploadCover } from "@/components/projects/project-form";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";
import { BackLink } from "@/components/nia/back-link";
import { ProjectSectionNav, type ProjectSection } from "@/components/projects/project-section-nav";

// The links under the cover, in reading order. Details, Crew & talent and Behind the Production
// sit under the Details tab on the right.
const SECTIONS: ProjectSection[] = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details", inDetails: true },
  { id: "crew", label: "Crew & talent", inDetails: true },
  { id: "behind", label: "Behind the Production", inDetails: true },
  { id: "comments", label: "Comments" },
  { id: "files", label: "Files" },
  { id: "references", label: "References" },
];

// Storage path of a cover URL, if it's in this project's folder (so it can be removed).
function coverPath(url: string | null, projectId: string) {
  const path = url?.split("/object/public/project-covers/")[1];
  return path?.startsWith(`${projectId}/`) ? decodeURIComponent(path) : null;
}

const toList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

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

// The project page (Figma 824:23124, Ika 2026-10-19; cover hero since 2026-11-12, variation 2 of
// the project page board): the cover across the page with the title on it, section links under
// it; then the description, final assets and comments on the left, and on the right Details
// (with Behind the Production) or Manage (actions, overview, documents, activity); stacked on
// phones and tablets. Files & references full width below.
// Every change saves on its own, with the SavedIndicator.
export function ProjectEditor({
  project: initial,
  canEdit,
  behind,
  manage,
  finals,
  files,
  inspiration,
  comments,
}: {
  project: Project;
  canEdit: boolean;
  behind: React.ReactNode;
  manage: React.ReactNode;
  /** Files tagged final, under the description. */
  finals?: React.ReactNode;
  files: React.ReactNode;
  /** Explore references and suggestions, under the files. */
  inspiration?: React.ReactNode;
  /** Comments from the people on the project, under the cover and description (Ika, 2026-11-11). */
  comments?: React.ReactNode;
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

  const save = (column: string, field: keyof Project, value: Project[keyof Project]) => saveMany({ [column]: value }, { [field]: value });
  // Several columns at once (a shoot's first and last day). Empty dates are saved as none.
  const saveMany = async (columns: Record<string, unknown>, fields: Partial<Project>) => {
    const before = project;
    setProject((p) => ({ ...p, ...fields }));
    const { error } = await createClient().from("projects").update(columns).eq("id", project.id);
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
    "flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-small font-semibold text-foreground shadow-sm outline-none transition-opacity duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100";
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

  const text = (label: string, column: string, field: "client" | "agency" | "usage" | "publication" | "logline" | "notes", placeholder: string, max: number, multiline = false) =>
    row(
      label,
      <EditableText
        label={label}
        value={project[field]}
        placeholder={placeholder}
        emptyText="—"
        maxLength={max}
        multiline={multiline}
        readOnly={!canEdit}
        onSave={(next) => save(column, field, next.trim())}
        className="px-1.5 py-1 text-sm leading-normal font-medium text-muted-foreground"
      />,
    );
  const extras = typeDetails(project.productionType);
  // Photo shoots, editorials and lookbooks are stills: no running time.
  const stills = extras.includes("looks");

  // The project's title is the page's main heading (audit #5; a real block since 2026-11-12,
  // `display: contents` could drop it for screen readers). On the cover it's white.
  const title = (onCover: boolean) => (
    <EditableText
      heading
      label="Title"
      value={project.title}
      placeholder="Untitled project"
      maxLength={120}
      readOnly={!canEdit}
      onSave={(next) => save("title", "title", next)}
      className={cn("text-h2 font-semibold tracking-tight", onCover ? "text-white" : "text-foreground", !project.title && (onCover ? "text-white/75" : "text-muted-foreground"))}
      buttonClassName={onCover ? "hover:bg-white/15 focus-visible:ring-white/60" : undefined}
    />
  );
  const meta = [project.productionType, project.stage, shootDatesText(project.shootStart, project.shootEnd)].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-1 flex-col gap-10 px-4 pt-10 pb-15 md:px-page">
      <div className="flex items-center justify-between gap-4">
        <BackLink
          href="/projects"
          className="rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Back to Projects
        </BackLink>
        {savedAt && <SavedIndicator savedAt={savedAt} />}
      </div>

      {/* The cover as a hero across the page, the title on it (Ika, 2026-11-12, variation 2). */}
      <div className="flex flex-col">
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
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted sm:aspect-[16/9] lg:aspect-[21/8]">
            <Image src={project.coverUrl} alt="" fill preload sizes="100vw" className="object-cover" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-15% to-black/75 sm:from-35% sm:to-black/70" />
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
            <div className="absolute inset-x-0 bottom-0 flex max-w-4xl flex-col gap-2 p-5 md:p-8">
              {meta && <p className="text-small font-medium text-white/85">{meta}</p>}
              {title(true)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <button
              type="button"
              disabled={!canEdit || isUploading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-nia-line-strong bg-nia-panel text-lead font-medium text-muted-foreground outline-none transition-colors duration-fast enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:aspect-[21/6]"
            >
              <Camera aria-hidden className="size-8" strokeWidth={1.5} />
              {isUploading ? "Uploading…" : canEdit ? "Add project thumbnail" : "No thumbnail yet"}
            </button>
            <div className="flex flex-col gap-2">
              {meta && <p className="text-small font-medium text-muted-foreground">{meta}</p>}
              {title(false)}
            </div>
          </div>
        )}
      </div>

      <ProjectSectionNav sections={SECTIONS} onDetails={() => setTab("details")} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        {/* Left: what it's about, final assets and comments. */}
        <div className="flex min-w-0 flex-col gap-6">
          <section id="overview" aria-label="Overview">
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
          </section>
          {finals}
          {comments}
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
                <h2 id="details" className="text-subtitle font-semibold text-foreground">
                  Details
                </h2>
                <dl className="flex flex-col gap-3">
                  {row(
                    "Shoot dates",
                    <ShootDatesField
                      start={project.shootStart}
                      end={project.shootEnd}
                      readOnly={!canEdit}
                      onSave={(start, end) => saveMany({ shoot_start: start, shoot_end: end }, { shootStart: start, shootEnd: end })}
                    />,
                  )}
                  {text("Client", "client", "client", "Who it's for", 120)}
                  {text("Agency", "agency", "agency", "Who commissioned it", 120)}
                  {row("Deliverables", <DeliverablesField value={project.deliverables} readOnly={!canEdit} onSave={(next) => save("deliverables", "deliverables", next)} />)}
                  {row(
                    "Due",
                    <EditableDate
                      label="Delivery date"
                      value={project.dueDate ?? ""}
                      readOnly={!canEdit}
                      onSave={(next) => save("due_date", "dueDate", next || null)}
                      className="px-1.5 py-1 text-sm leading-normal font-medium text-muted-foreground"
                    />,
                  )}
                  {!stills && row("Duration", <DurationField value={project.duration} readOnly={!canEdit} onSave={(next) => save("duration", "duration", next)} />)}
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
                  {extras.includes("logline") && text("Logline", "logline", "logline", "The story in a sentence", 300, true)}
                  {extras.includes("usage") && text("Usage", "usage", "usage", "e.g. Social and online, 12 months, worldwide", 200)}
                  {extras.includes("looks") && row("Looks", <NumberField label="Looks" value={project.looks} readOnly={!canEdit} onSave={(next) => save("looks", "looks", next)} />)}
                  {extras.includes("publication") && text("Publication", "publication", "publication", "Where it's published", 120)}
                  {canEdit && row("Budget", <BudgetField projectId={project.id} onSaved={() => setSavedAt(Date.now())} />)}
                  {text("Notes", "notes", "notes", "Anything the team should know: access, permits, allergies…", 2000, true)}
                </dl>
              </section>

              <CrewSection crew={project.crew} canEdit={canEdit} directoryHref={`/projects/${project.id}/crew`} />

              <section aria-labelledby="behind" className="flex flex-col gap-4">
                <h2 id="behind" className="text-subtitle font-semibold text-foreground">
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
      {inspiration}
    </div>
  );
}
