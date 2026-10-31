"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Link2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { checkCoverFile, shrinkImage } from "@/lib/images";
import { GENRES, PRODUCTION_TYPES } from "@/lib/projects";
import { parseInstagramLink } from "@/lib/instagram";
import { addInstagramReference, readInstagramPost } from "@/lib/instagram-post";
import { createClient } from "@/lib/supabase/client";
import { recordEvent } from "@/lib/product-events";
import { myPlan, projectLimitReached } from "@/lib/plan-client";
import { FREE_LIMITS, isLimited } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useCoverCropper } from "@/components/projects/use-cover-cropper";
import { MAX_UPLOAD_MB, UPLOAD_ACCEPT, uploadProjectFile } from "@/components/projects/project-files";
import { Button } from "@/components/ui/button";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
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
  // Free workspaces take files up to 25 MB on the live site; paid plans up to 50 MB.
  const [limitMb, setLimitMb] = useState<number>(MAX_UPLOAD_MB);
  useEffect(() => {
    let live = true;
    void myPlan(createClient()).then((plan) => live && setLimitMb(isLimited(plan) ? FREE_LIMITS.uploadMb : MAX_UPLOAD_MB));
    return () => {
      live = false;
    };
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>("Drama");
  const [productionType, setProductionType] = useState<string>("Film");
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Files to upload once the project exists (audit #12): briefs, scripts, stills, voice memos.
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<{ done: number; of: number; what: "Uploading" | "Adding reference" } | null>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  // Instagram posts to add as references once the project exists (Ika, 2026-10-23).
  const [links, setLinks] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const addLink = () => {
    const parsed = parseInstagramLink(link);
    if (!parsed) return void toast.error("That isn't a link to an Instagram post or reel. Copy it from the post's Share or ⋯ menu.");
    if (!links.includes(parsed.link)) setLinks((list) => [...list, parsed.link]);
    setLink("");
  };
  const addFiles = (picked: File[]) => {
    const tooBig = picked.filter((f) => f.size > limitMb * 1e6);
    if (tooBig.length) {
      toast.error(`${tooBig.map((f) => f.name).join(", ")} ${tooBig.length === 1 ? "is" : "are"} over ${limitMb} MB`);
      if (limitMb < MAX_UPLOAD_MB && tooBig.some((f) => f.size <= MAX_UPLOAD_MB * 1e6)) openUpgrade("upload");
    }
    setFiles((list) => [...list, ...picked.filter((f) => f.size <= limitMb * 1e6 && !list.some((x) => x.name === f.name && x.size === f.size))]);
  };

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
      // Free workspaces hold up to 5 projects (live site only): offer the upgrade instead.
      if (await projectLimitReached(supabase, workspaceId)) {
        setIsSaving(false);
        openUpgrade("projects");
        return;
      }
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
      recordEvent("project_created", { projectId: project.id, props: { from: "form" } });

      if (cover) {
        try {
          const coverUrl = await uploadCover(project.id, cover.file);
          await supabase.from("projects").update({ cover_url: coverUrl }).eq("id", project.id);
        } catch {
          toast.error("Project created, but the cover didn't upload. Add it from the project page.");
        }
      }
      if (files.length) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        let failed = 0;
        for (const [i, file] of files.entries()) {
          setUploading({ done: i, of: files.length, what: "Uploading" });
          try {
            if (!session) throw new Error("signed out");
            await uploadProjectFile(project.id, file, session.access_token);
          } catch {
            failed += 1;
          }
        }
        if (failed) toast.error(`Project created, but ${failed} ${failed === 1 ? "file" : "files"} didn't upload. Add ${failed === 1 ? "it" : "them"} from the project page.`);
      }
      // Each post is read and saved as on the project page; a post that can't be read is skipped.
      if (links.length) {
        let failed = 0;
        for (const [i, url] of links.entries()) {
          setUploading({ done: i, of: links.length, what: "Adding reference" });
          const read = await readInstagramPost(url).catch(() => null);
          const saved = read?.ok
            ? await addInstagramReference(project.id, { link: url, title: read.draft.title || "Instagram post", productionType: null, note: "", credits: read.draft.credits }).catch(() => null)
            : null;
          if (saved?.ok) recordEvent("reference_added", { projectId: project.id, props: { from: "instagram" } });
          else failed += 1;
        }
        if (failed) toast.error(`Project created, but ${failed} Instagram ${failed === 1 ? "link" : "links"} couldn't be read. Add ${failed === 1 ? "it" : "them"} under References on the project page.`);
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
      className="flex w-full max-w-[600px] flex-col gap-7 rounded-2xl bg-card p-6 shadow-elevation-2 sm:p-10"
    >
      {/* The heading follows the name as it's typed (Ika, 2026-10-23). */}
      <h1 className="text-h2 font-bold break-words text-foreground">{title.trim() || "New blank project"}</h1>

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
        <span className={fieldLabelClassName}>Cover image</span>
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
              <span className="relative rounded-full bg-card/90 px-3 py-1 text-small text-foreground">
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

      <div className="flex flex-col gap-2">
        <span id="project-files-label" className={fieldLabelClassName}>
          Files <span className="font-normal">(optional)</span>
        </span>
        <input
          ref={filesInput}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          aria-labelledby="project-files-label"
          onClick={() => filesInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles([...e.dataTransfer.files]);
          }}
          className="flex flex-col items-center gap-1 rounded-lg bg-nia-panel px-4 py-5 text-center outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Upload aria-hidden className="size-4" /> Add briefs, scripts, stills or voice memos
          </span>
          <span className="text-caption text-muted-foreground">They upload into the project when it&rsquo;s created · up to {limitMb} MB each</span>
        </button>
        {files.length > 0 && (
          <ul className="flex flex-col gap-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${f.size}`} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-small">
                <span className="min-w-0 flex-1 truncate text-foreground">{f.name}</span>
                <span className="shrink-0 text-muted-foreground">{f.size >= 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1e3))} KB`}</span>
                <button
                  type="button"
                  aria-label={`Don't add ${f.name}`}
                  onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-instagram" className={fieldLabelClassName}>
          Instagram references <span className="font-normal">(optional)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="project-instagram"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (link.trim()) addLink();
            }}
            placeholder="Paste a link to a post or reel"
            className={fieldClassName}
          />
          <Button type="button" variant="outline" disabled={!link.trim()} onClick={addLink} className="h-auto shrink-0 rounded-lg px-5">
            Add
          </Button>
        </div>
        <span className="text-caption text-muted-foreground">Saved to the project&rsquo;s references when it&rsquo;s created, private to the project.</span>
        {links.length > 0 && (
          <ul className="flex flex-col gap-1">
            {links.map((url) => (
              <li key={url} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-small">
                <Link2 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-foreground">{url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                <button
                  type="button"
                  aria-label={`Don't add ${url}`}
                  onClick={() => setLinks((list) => list.filter((x) => x !== url))}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
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
          {uploading ? `${uploading.what} ${uploading.done + 1} of ${uploading.of}…` : isSaving ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
