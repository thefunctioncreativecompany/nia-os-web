"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FolderMinus } from "lucide-react";
import { toast } from "sonner";

import type { ProjectDocument } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { loadWorkingTemplates } from "@/features/templates/actions";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import type { GalleryTemplate } from "@/features/templates/gallery";
import { workingSuggestions } from "@/features/templates/recommend";
import { useTemplateProfile } from "@/features/templates/use-template-profile";

const STATUS: Record<string, string> = { draft: "Draft", ready: "Ready to export", paid: "Paid" };

// Documents saved to this project (build step 8): open one to keep working on it, remove it from
// the project (it stays in its maker's drafts), or add a new one from a template, which is saved
// here as soon as it's started.
export function ProjectDocuments({ projectId, documents, icons, canEdit, now }: { projectId: string; documents: ProjectDocument[]; icons: Record<string, string>; canEdit: boolean; now: number }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const list = documents.filter((d) => !removed.includes(d.id));

  const remove = async (doc: ProjectDocument) => {
    setRemoved((r) => [...r, doc.id]);
    const { error } = await createClient().from("documents").update({ project_id: null }).eq("id", doc.id);
    if (error) {
      setRemoved((r) => r.filter((id) => id !== doc.id));
      return void toast.error(`Couldn't remove ${doc.title}: ${error.message}`);
    }
    toast.success(`Removed ${doc.title} from this project`);
    router.refresh();
  };

  return (
    <section aria-labelledby="documents" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="documents" className="text-lg leading-[1.4] font-bold text-foreground">
          Documents
        </h2>
        {canEdit && (
          <Button variant="outline" size="compact" onClick={() => setAdding(true)}>
            <FilePlus2 aria-hidden /> Add document
          </Button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-small text-muted-foreground">
          {canEdit ? "No documents yet. Add a call sheet, shotlist or any template, or save one here from Templates." : "No documents yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((doc) => (
            <li key={doc.id} className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-colors duration-fast hover:border-ring">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                <FlatIcon name={icons[doc.templateCode] ?? "file"} size="sm" className="size-5" />
              </span>
              <Link href={`/templates/${doc.templateCode}?doc=${doc.id}`} className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="block truncate text-sm font-bold text-foreground group-hover:underline">{doc.title}</span>
                <span className="block truncate text-caption text-muted-foreground">
                  {STATUS[doc.status] ?? doc.status} · {timeAgo(doc.updatedAt, now)}
                </span>
              </Link>
              {canEdit && (
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${doc.title} from this project`} onClick={() => remove(doc)}>
                  <FolderMinus />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <AddDocumentDialog projectId={projectId} open={adding} onOpenChange={setAdding} />
    </section>
  );
}

function AddDocumentDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const learning = useTemplateProfile();
  const [templates, setTemplates] = useState<GalleryTemplate[] | null>(null);

  useEffect(() => {
    if (!open || templates) return;
    let live = true;
    void loadWorkingTemplates().then((t) => live && setTemplates(t));
    return () => {
      live = false;
    };
  }, [open, templates]);

  const list = templates && learning.ready ? workingSuggestions(templates, learning.profile, templates.length) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-[480px] flex-col gap-5 rounded-2xl p-6 sm:max-w-[480px]">
        <DialogTitle className="text-subtitle font-bold">Add a document</DialogTitle>
        <DialogDescription className="-mt-3 text-small text-muted-foreground">It opens ready to fill in, saved to this project.</DialogDescription>
        <ul className="flex max-h-[55svh] flex-col gap-2 overflow-y-auto">
          {!list && Array.from({ length: 4 }, (_, i) => <li key={i}><Skeleton className="h-14 rounded-xl" /></li>)}
          {list?.map(({ template: t }) => (
            <li key={t.code}>
              <button
                type="button"
                onClick={() => {
                  learning.record(t.code, "use");
                  onOpenChange(false);
                  router.push(`/templates/${t.code}?project=${projectId}`);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                  <FlatIcon name={t.icon} size="sm" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{t.name}</span>
                  <span className="block truncate text-caption text-muted-foreground">{t.stage}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
