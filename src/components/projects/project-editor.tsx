"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Crop } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile } from "@/lib/images";
import { PRODUCTION_INFO, type Project } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SavedIndicator } from "@/components/nia/saved-indicator";
import { EditableDate } from "@/components/projects/editable-date";
import { EditableText } from "@/components/projects/editable-text";
import { uploadCover } from "@/components/projects/project-form";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";

// Storage path of a cover URL, if it's in this project's folder (so it can be removed).
function coverPath(url: string | null, projectId: string) {
  const path = url?.split("/object/public/project-covers/")[1];
  return path?.startsWith(`${projectId}/`) ? decodeURIComponent(path) : null;
}

// Left column of a project (Figma "projects-empty-project" / "Screen 3 - Project
// Selected"): cover, title, description and Production Info, each saved on its own.
export function ProjectEditor({ project: initial, canEdit }: { project: Project; canEdit: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState(initial);
  const [loaded, setLoaded] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Pick up changes made elsewhere (Edit Project Details, another tab) after a refresh.
  if (initial !== loaded) {
    setLoaded(initial);
    setProject(initial);
  }
  const [isUploading, setIsUploading] = useState(false);

  const save = async (column: string, field: keyof Project, value: string | null) => {
    const { error } = await createClient().from("projects").update({ [column]: value }).eq("id", project.id);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      throw error;
    }
    setProject((p) => ({ ...p, [field]: value }));
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

  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/projects"
          className="rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Back to Projects
        </Link>
        {savedAt && <SavedIndicator savedAt={savedAt} />}
      </div>

      <div className="flex flex-col gap-6">
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
          <div className="group relative aspect-[16/7] w-full overflow-hidden rounded-[20px] bg-muted">
            <Image
              src={project.coverUrl}
              alt=""
              fill
              preload
              sizes="(min-width: 1024px) 800px, 100vw"
              className="object-cover"
            />
            {canEdit && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
                className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-small font-semibold text-foreground shadow-sm outline-none transition-opacity duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              >
                <Camera aria-hidden className="size-4" />
                {isUploading ? "Uploading…" : "Change cover"}
              </button>
            )}
            {canEdit && !isUploading && (
              <button
                type="button"
                onClick={() => project.coverUrl && cropper.start(project.coverUrl)}
                className="absolute right-40 bottom-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-small font-semibold text-foreground shadow-sm outline-none transition-opacity duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              >
                <Crop aria-hidden className="size-4" />
                Adjust
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={!canEdit || isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-nia-line-strong bg-nia-panel text-lead font-medium text-muted-foreground outline-none transition-colors duration-fast enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Camera aria-hidden className="size-8" strokeWidth={1.5} />
            {isUploading ? "Uploading…" : canEdit ? "Add project thumbnail" : "No thumbnail yet"}
          </button>
        )}

        <div className="flex flex-col gap-3">
          <EditableText
            label="Title"
            value={project.title}
            placeholder="Untitled Project"
            maxLength={120}
            readOnly={!canEdit}
            onSave={(next) => save("title", "title", next)}
            className={cn("text-h1 font-bold text-foreground", !project.title && "italic")}
          />
          <EditableText
            label="Description"
            multiline
            value={project.description}
            placeholder="Add a description..."
            maxLength={2000}
            readOnly={!canEdit}
            onSave={(next) => save("description", "description", next)}
            className="text-lead text-muted-foreground"
          />
        </div>
      </div>

      <section aria-labelledby="production-info" className="flex flex-col gap-4">
        <h2 id="production-info" className="text-lg leading-[1.4] font-bold text-foreground">
          Production Info
        </h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          {PRODUCTION_INFO.map((row) => (
            <div key={row.field} className="flex items-center gap-4">
              <dt className="w-[120px] shrink-0 leading-[1.4] font-bold text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 flex-1">
                {row.field === "productionDate" ? (
                  <EditableDate
                    label={row.label}
                    value={project.productionDate}
                    readOnly={!canEdit}
                    onSave={(next) => save(row.column, row.field, next)}
                    className="px-1.5 py-1 leading-normal font-medium text-foreground"
                  />
                ) : (
                <EditableText
                  label={row.label}
                  value={project[row.field]}
                  placeholder={row.placeholder}
                  emptyText="—"
                  maxLength={row.max}
                  readOnly={!canEdit}
                  onSave={(next) => save(row.column, row.field, next)}
                  className="px-1.5 py-1 leading-normal font-medium text-foreground"
                />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
