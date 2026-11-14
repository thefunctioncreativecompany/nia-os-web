"use client";

import { useRef, useState } from "react";
import { FolderUp, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { projectLimitReached } from "@/lib/plan-client";
import { recordEvent } from "@/lib/product-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { uploadProjectFile, MAX_UPLOAD_MB } from "@/components/projects/project-files";

const ACCEPT = "image/*,video/mp4,video/quicktime,video/webm";

// Upload as you build (PORTFOLIOS_BUILD.md §1a): new work goes into Nia projects, filed as final
// assets, and onto the portfolio. Files make one project (named after the portfolio unless you name
// it); a folder makes one project per folder inside it (or one for the folder itself). Each is an
// ordinary project, marked Wrapped, that can get details, crew and documents later. Free-plan limits
// apply as for any new project.
export function UploadWork({ portfolioTitle, onAdded }: { portfolioTitle: string; onAdded: (projectIds: string[]) => Promise<void> }) {
  const files = useRef<HTMLInputElement>(null);
  const folders = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const upload = async (list: FileList | null, byFolder: boolean) => {
    const chosen = [...(list ?? [])].filter((f) => /^(image|video)\//.test(f.type));
    if (!chosen.length) return void toast.error("Choose pictures or films.");
    const tooBig = chosen.filter((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooBig.length) toast.error(`${tooBig.length} over ${MAX_UPLOAD_MB} MB left out.`);
    const ok = chosen.filter((f) => f.size <= MAX_UPLOAD_MB * 1024 * 1024);
    // One project per folder inside the one chosen (a shoot with sets), or one for loose files.
    const groups = new Map<string, File[]>();
    for (const f of ok) {
      const parts = (f.webkitRelativePath || "").split("/").filter(Boolean);
      const key = byFolder && parts.length > 1 ? (parts.length > 2 ? parts[1] : parts[0]) : name.trim() || portfolioTitle;
      groups.set(key, [...(groups.get(key) ?? []), f]);
    }
    const db = createClient();
    const { data: session } = await db.auth.getSession();
    const token = session.session?.access_token;
    const { data: workspaceId, error: wsError } = await db.rpc("my_workspace_id");
    if (!token || wsError) return void toast.error("Couldn't start the upload. Try again.");
    const made: string[] = [];
    for (const [title, group] of groups) {
      if (await projectLimitReached(db, workspaceId)) {
        openUpgrade("projects");
        break;
      }
      setBusy(`Making ${title}…`);
      const { data: project, error } = await db.from("projects").insert({ workspace_id: workspaceId, title: title.slice(0, 120), description: "", stage: "Wrapped" }).select("id").single();
      if (error || !project) {
        toast.error(`Couldn't make ${title}: ${error?.message ?? "try again"}`);
        continue;
      }
      recordEvent("project_created", { projectId: project.id, props: { from: "portfolio" } });
      let done = 0;
      // Three at a time, as the Files tab does.
      for (let i = 0; i < group.length; i += 3) {
        await Promise.all(
          group.slice(i, i + 3).map((f) =>
            uploadProjectFile(project.id, f, token, "final").then(
              () => setBusy(`Uploading to ${title}: ${++done} of ${group.length}`),
              () => toast.error(`Couldn't upload ${f.name}`),
            ),
          ),
        );
      }
      made.push(project.id);
    }
    if (made.length) await onAdded(made);
    setBusy(null);
    setName("");
    if (files.current) files.current.value = "";
    if (folders.current) folders.current.value = "";
  };

  return (
    <section aria-labelledby="new-work" className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-5">
      <h2 id="new-work" className="text-subtitle font-semibold text-foreground">
        New work
      </h2>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Project name (${portfolioTitle})`} maxLength={120} aria-label="Name for the new project" className="h-11 max-w-md" disabled={Boolean(busy)} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled={Boolean(busy)} onClick={() => files.current?.click()}>
          <Upload aria-hidden /> Files
        </Button>
        <Button variant="secondary" disabled={Boolean(busy)} onClick={() => folders.current?.click()}>
          <FolderUp aria-hidden /> Folder
        </Button>
        {busy && (
          <span aria-live="polite" className="text-small text-muted-foreground">
            {busy}
          </span>
        )}
      </div>
      <input ref={files} type="file" multiple accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void upload(e.target.files, false)} />
      {/* Folders: each folder inside becomes its own project. */}
      <input ref={folders} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void upload(e.target.files, true)} {...{ webkitdirectory: "", directory: "" }} />
    </section>
  );
}
