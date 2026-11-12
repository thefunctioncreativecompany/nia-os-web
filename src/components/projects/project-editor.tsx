"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Crop } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile } from "@/lib/images";
import { GENRES, shootDatesText, typeDetails, type Project, type ProjectRole } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChoicePills } from "@/components/nia/choice-pills";
import { SavedIndicator } from "@/components/nia/saved-indicator";
import { ViewAll } from "@/components/nia/view-all";
import { Button } from "@/components/ui/button";
import { EditDetailsDialog } from "@/components/projects/edit-details-dialog";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";
import { EditableDate } from "@/components/projects/editable-date";
import { EditableText } from "@/components/projects/editable-text";
import { BudgetField, CrewSection, DeliverablesField, NumberField, ShootDatesField } from "@/components/projects/project-details";
import { uploadCover } from "@/components/projects/project-form";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";
import { BackLink } from "@/components/nia/back-link";
import { PROJECT_PANEL_ID, ProjectTabs, isProjectTab, type ProjectTabId } from "@/components/projects/project-tabs";
import { sentenceCase } from "@/lib/sentence-case";

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

// The project page (Figma 824:23124, Ika 2026-10-19; since 2026-11-12 variation 2 of the project
// page board, "Cover hero with section tabs", built as drawn): the cover across the page with the
// title, Edit details and Share project on it; tabs under it (Overview, Crew & talent, Documents,
// References, Comments, Activity, kept in the address as ?tab=). Overview: the description, final
// assets, notes and three references on the left, the details in a card on the right.
// Every change saves on its own, with the SavedIndicator.
export function ProjectEditor({
  project: initial,
  role,
  canEdit,
  counts,
  referencePreview,
  finals,
  documents,
  files,
  inspiration,
  comments,
  activity,
}: {
  project: Project;
  role: ProjectRole;
  canEdit: boolean;
  /** Beside each tab's name. */
  counts: Partial<Record<ProjectTabId, number>>;
  /** Stills tagged Reference, newest first, for Overview's References. */
  referencePreview: { id: string; name: string; url: string }[];
  /** Files tagged final, under the description. */
  finals?: React.ReactNode;
  /** The Documents tab. */
  documents: React.ReactNode;
  /** The References tab: Files & references, then Explore references and suggestions. */
  files: React.ReactNode;
  inspiration?: React.ReactNode;
  /** The Comments tab. */
  comments?: React.ReactNode;
  /** The Activity tab: the project's overview, recent activity and, for its owner, Delete. */
  activity: React.ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState(initial);
  const [loaded, setLoaded] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // The open tab lives in the address (?tab=comments), so a link can open it and it survives a refresh.
  const params = useSearchParams();
  const asked = params.get("tab");
  const [tab, setTabState] = useState<ProjectTabId>(isProjectTab(asked) ? asked : "overview");
  const setTab = (next: ProjectTabId) => {
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  };

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
    <span className="flex flex-wrap gap-x-6 gap-y-1 pt-1.5 text-sm font-medium text-foreground">
      {values.length ? values.map((v) => <span key={v}>{v}</span>) : "—"}
    </span>
  );

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-24 shrink-0 pt-1.5 text-sm leading-[1.4] text-muted-foreground">{label}</dt>
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
        className="px-1.5 py-1 text-sm leading-normal font-medium text-foreground"
      />,
    );
  const extras = typeDetails(project.productionType);
  // Photo shoots, editorials and lookbooks are stills: no running time.
  const stills = extras.includes("looks");

  // The project's title is the page's main heading (audit #5; a real block since 2026-11-12,
  // `display: contents` could drop it for screen readers). On the cover it's white.
  const onCover = Boolean(project.coverUrl);
  const meta = [project.productionType && sentenceCase(project.productionType), sentenceCase(project.stage), shootDatesText(project.shootStart, project.shootEnd)].filter(Boolean).join(" · ");
  const coverActions = canEdit && (
    <div className="absolute top-4 right-4 flex gap-2 md:right-page lg:right-4">
      {project.coverUrl && !isUploading && (
        <button type="button" onClick={() => project.coverUrl && cropper.start(project.coverUrl)} className={coverButton}>
          <Crop aria-hidden className="size-4" />
          <span className="sr-only sm:not-sr-only">Adjust</span>
        </button>
      )}
      <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()} className={cn(coverButton, !project.coverUrl && "md:opacity-100")}>
        <Camera aria-hidden className="size-4" />
        <span className="sr-only sm:not-sr-only">{isUploading ? "Uploading…" : project.coverUrl ? "Change cover" : "Add a cover"}</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pb-15 md:px-page">
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

      {/* The cover across the page, the title and the main actions on it (Ika, 2026-11-12,
          variation 2 of the project page board), the tabs right under it. On computers the cover
          is a thumbnail the size of an Explore title's trailer, with the title and actions beside
          it (Ika, 2026-11-12: a full-width cover blows up low-resolution pictures). Phones and
          tablets keep the full-width cover until they get their own design. */}
      <div className="flex flex-col">
      <section
        aria-label="Cover"
        className={cn(
          "group relative -mx-4 flex flex-col justify-end overflow-hidden md:-mx-page",
          "lg:mx-0 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end lg:gap-x-10 lg:gap-y-10 lg:overflow-visible lg:bg-transparent lg:pt-10 lg:pb-8 xl:gap-x-16",
          onCover ? "min-h-104 bg-muted sm:aspect-[16/9] sm:min-h-0 lg:aspect-auto" : "min-h-80 bg-nia-panel pt-20 lg:min-h-0",
        )}
      >
        {/* The picture: behind everything on phones and tablets, a rounded thumbnail on computers. */}
        <div className={cn("absolute inset-0 lg:relative lg:inset-auto lg:row-start-2 lg:aspect-[19/10] lg:overflow-hidden lg:rounded-3xl", onCover ? "lg:bg-muted" : "lg:bg-nia-panel")}>
          {project.coverUrl && (
            <>
              <Image src={project.coverUrl} alt="" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent via-30% to-black/75 sm:to-black/70 lg:hidden" />
            </>
          )}
          {coverActions}
        </div>
        <BackLink
          href="/projects"
          className={cn(
            "absolute top-5 left-4 rounded-sm text-sm leading-[1.4] font-bold outline-none focus-visible:ring-3 md:left-page",
            "lg:static lg:col-span-2 lg:row-start-1 lg:w-fit lg:text-muted-foreground lg:hover:text-foreground lg:focus-visible:ring-ring/50",
            onCover ? "text-white/90 hover:text-white focus-visible:ring-white/60" : "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50",
          )}
        >
          ← Back to Projects
        </BackLink>
        <div className="relative flex flex-wrap items-end justify-between gap-4 px-4 pb-6 md:px-page md:pb-8 lg:row-start-2 lg:flex-col lg:items-start lg:justify-end lg:gap-5 lg:p-0">
          <div className="flex max-w-3xl min-w-0 flex-col gap-2">
            {meta && <p className={cn("text-small font-medium", onCover ? "text-white/85 lg:text-muted-foreground" : "text-muted-foreground")}>{meta}</p>}
            <EditableText
              heading
              label="Title"
              value={project.title}
              placeholder="Untitled project"
              maxLength={120}
              readOnly={!canEdit}
              onSave={(next) => save("title", "title", next)}
              className={cn("text-h2 font-semibold tracking-tight", onCover ? "text-white lg:text-foreground" : "text-foreground", !project.title && (onCover ? "text-white/75 lg:text-muted-foreground" : "text-muted-foreground"))}
              buttonClassName={onCover ? "hover:bg-white/15 focus-visible:ring-white/60 lg:hover:bg-muted/70 lg:focus-visible:ring-ring/50" : undefined}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <EditDetailsDialog project={project}>
                <Button type="button" variant="outline" className={cn(onCover && "border-white/60 bg-white/15 text-white hover:bg-white/25 hover:text-white dark:border-white/60 dark:bg-white/15 lg:border-border lg:bg-background lg:text-foreground lg:hover:border-foreground lg:hover:bg-background lg:hover:text-foreground dark:lg:border-input dark:lg:bg-input/30")}>
                  Edit details
                </Button>
              </EditDetailsDialog>
            )}
            <ShareProjectDialog projectId={project.id} role={role} shareToken={project.shareToken}>
              <Button type="button">
                {role === "owner" ? "Share project" : "People with access"}
              </Button>
            </ShareProjectDialog>
          </div>
        </div>
      </section>

      <ProjectTabs value={tab} onChange={setTab} counts={counts} end={savedAt ? <SavedIndicator savedAt={savedAt} /> : null} />
      </div>

      <div id={PROJECT_PANEL_ID} role="tabpanel" aria-labelledby={`project-tab-${tab}`} className="flex min-w-0 flex-col gap-10">
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
            {/* Left: what it's about, final assets, notes and a look at the references. */}
            <div className="flex min-w-0 flex-col gap-8">
              <section aria-label="About" className="max-w-3xl">
                <EditableText
                  label="Description"
                  multiline
                  value={project.description}
                  placeholder="Add a description..."
                  maxLength={2000}
                  readOnly={!canEdit}
                  onSave={(next) => save("description", "description", next)}
                  className="text-lead leading-relaxed text-foreground/80"
                />
              </section>
              {finals}
              <section aria-labelledby="notes" className="flex max-w-3xl flex-col gap-3">
                <h2 id="notes" className="text-subtitle font-semibold text-foreground">
                  Notes
                </h2>
                <EditableText
                  label="Notes"
                  multiline
                  value={project.notes}
                  placeholder="Anything the team should know: access, permits, allergies…"
                  emptyText="—"
                  maxLength={2000}
                  readOnly={!canEdit}
                  onSave={(next) => save("notes", "notes", next.trim())}
                  className="text-sm leading-relaxed text-foreground/80"
                />
              </section>
              <section aria-labelledby="overview-references" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="overview-references" className="text-subtitle font-semibold text-foreground">
                    References {counts.references ? <span className="text-micro font-normal text-muted-foreground">{counts.references}</span> : null}
                  </h2>
                  <ViewAll onClick={() => setTab("references")}>{counts.references ? "View all" : canEdit ? "Add references" : "View all"}</ViewAll>
                </div>
                {referencePreview.length > 0 && (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {referencePreview.slice(0, 3).map((r, i) => (
                      <li key={r.id} className={cn(i === 2 && "hidden sm:block")}>
                        <button
                          type="button"
                          aria-label={`${r.name}, open References`}
                          onClick={() => setTab("references")}
                          className="relative block aspect-video w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- private files use short-lived links, which the image optimiser would cache */}
                          <img src={r.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-base ease-out hover:scale-[1.02] motion-reduce:transition-none" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Right: the details, in a card. Every value still edits in place. */}
            <aside aria-labelledby="details" className="flex min-w-0 flex-col gap-4">
              <h2 id="details" className="text-subtitle font-semibold text-foreground">
                Details
              </h2>
              <dl className="flex flex-col gap-3 rounded-3xl border border-border p-5">
                {row(
                  "Shoot",
                  <ShootDatesField
                    start={project.shootStart}
                    end={project.shootEnd}
                    readOnly={!canEdit}
                    onSave={(start, end) => saveMany({ shoot_start: start, shoot_end: end }, { shootStart: start, shootEnd: end })}
                  />,
                )}
                {row(
                  "Due",
                  <EditableDate
                    label="Delivery date"
                    value={project.dueDate ?? ""}
                    readOnly={!canEdit}
                    onSave={(next) => save("due_date", "dueDate", next || null)}
                    className="px-1.5 py-1 text-sm leading-normal font-medium text-foreground"
                  />,
                )}
                {row("Deliverables", <DeliverablesField value={project.deliverables} readOnly={!canEdit} onSave={(next) => save("deliverables", "deliverables", next)} />)}
                {!stills && row("Duration", <DurationField value={project.duration} readOnly={!canEdit} onSave={(next) => save("duration", "duration", next)} />)}
                {extras.includes("looks") && row("Looks", <NumberField label="Looks" value={project.looks} readOnly={!canEdit} onSave={(next) => save("looks", "looks", next)} />)}
                {text("Client", "client", "client", "Who it's for", 120)}
                {text("Agency", "agency", "agency", "Who commissioned it", 120)}
                {row(
                  genres.length > 1 ? "Genres" : "Genre",
                  canEdit ? (
                    <ChoicePills
                      label="Genres"
                      value={null}
                      selected={genres}
                      // Several genres: tapping one adds or removes it.
                      onChange={(g) => void save("genres", "genres", (genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g]).join(", ")).catch(() => {})}
                      options={[...new Set([...genres, ...GENRES])].map((g) => ({ value: g, label: sentenceCase(g) }))}
                      className="gap-1.5 [&>button]:px-3 [&>button]:py-1 [&>button]:text-small"
                    />
                  ) : (
                    readValues(genres.map(sentenceCase))
                  ),
                )}
                {extras.includes("logline") && text("Logline", "logline", "logline", "The story in a sentence", 300, true)}
                {extras.includes("usage") && text("Usage", "usage", "usage", "e.g. Social and online, 12 months, worldwide", 200)}
                {extras.includes("publication") && text("Publication", "publication", "publication", "Where it's published", 120)}
                {canEdit && row("Budget", <BudgetField projectId={project.id} onSaved={() => setSavedAt(Date.now())} />)}
              </dl>
            </aside>
          </div>
        )}
        {tab === "crew" && <CrewSection crew={project.crew} canEdit={canEdit} directoryHref={`/projects/${project.id}/crew`} />}
        {tab === "documents" && documents}
        {tab === "references" && (
          <>
            {files}
            {inspiration}
          </>
        )}
        {tab === "comments" && comments}
        {tab === "activity" && activity}
      </div>
    </div>
  );
}
