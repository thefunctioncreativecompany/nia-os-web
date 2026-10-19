"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile, shrinkImage } from "@/lib/images";
import { GENRES, PRODUCTION_TYPES } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const fieldLabelClassName = "text-small leading-normal font-bold text-muted-foreground";
export const fieldClassName =
  "h-auto rounded-lg border-border px-4 py-3 text-lead text-foreground placeholder:text-nia-placeholder md:text-lead";
export const selectTriggerClassName =
  "h-auto w-full rounded-lg border-border px-4 py-3 text-lead data-[size=default]:h-auto";

// Uploads a cover still into the project's folder and returns its public URL.
export async function uploadCover(projectId: string, file: File) {
  const supabase = createClient();
  const blob = await shrinkImage(file);
  const path = `${projectId}/cover-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("project-covers")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("project-covers").getPublicUrl(path).data.publicUrl;
}

// "New Blank Project" (Figma 798:249).
export function ProjectForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>("Drama");
  const [productionType, setProductionType] = useState<string>("Film");
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cropper = useCoverCropper((file) => {
    if (cover) URL.revokeObjectURL(cover.url);
    setCover({ file, url: URL.createObjectURL(file) });
  });

  // Check the picked picture, then let them frame it before it's used.
  const pickCover = (file: File | undefined) => {
    if (!file) return;
    const problem = checkCoverFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    cropper.start(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: workspaceId, error: workspaceError } = await supabase.rpc("my_workspace_id");
      if (workspaceError) throw workspaceError;
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          title: title.trim(),
          description: description.trim(),
          genres: genre,
          production_type: productionType,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (cover) {
        try {
          const coverUrl = await uploadCover(project.id, cover.file);
          await supabase.from("projects").update({ cover_url: coverUrl }).eq("id", project.id);
        } catch {
          toast.error("Project created, but the cover didn't upload. Add it from the project page.");
        }
      }
      router.push(`/projects/${project.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the project");
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[600px] flex-col gap-7 rounded-2xl bg-white p-6 shadow-elevation-2 sm:p-10"
    >
      <h1 className="text-h2 font-bold text-foreground">New Blank Project</h1>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name" className={fieldLabelClassName}>
          Project Name
        </Label>
        <Input
          id="project-name"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. My Next Indie Film"
          className={fieldClassName}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-description" className={fieldLabelClassName}>
          Description
        </Label>
        <Textarea
          id="project-description"
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of the production..."
          className={cn(fieldClassName, "field-sizing-fixed h-20 min-h-20 resize-none")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabelClassName}>Cover Image</span>
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickCover(e.dataTransfer.files[0]);
          }}
          className="relative flex min-h-[120px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border-[1.5px] border-dashed border-border bg-nia-surface p-6 text-sm leading-normal font-semibold text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {cover ? (
            <>
              <Image src={cover.url} alt="" fill unoptimized className="object-cover" />
              <span className="relative rounded-full bg-white/90 px-3 py-1 text-small text-foreground">
                Change cover image
              </span>
            </>
          ) : (
            <>
              <Camera aria-hidden className="size-8" strokeWidth={1.5} />
              Add cover image
            </>
          )}
        </button>
        {cropper.dialog}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-genre" className={fieldLabelClassName}>
            Genre
          </Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger id="project-genre" className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {GENRES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-type" className={fieldLabelClassName}>
            Production Type
          </Label>
          <Select value={productionType} onValueChange={setProductionType}>
            <SelectTrigger id="project-type" className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PRODUCTION_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button asChild variant="outline" className="h-auto rounded-lg px-6 py-3 text-lead font-semibold">
          <Link href="/projects">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !title.trim()}
          className="h-auto rounded-lg px-6 py-3 text-lead font-semibold"
        >
          {isSaving ? "Creating…" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
