"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FolderMinus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ProjectDocument } from "@/lib/projects-data";
import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// The dialog and the template suggestions behind it load the first time it opens.
const AddDocumentDialog = dynamic(() => import("./add-document-dialog").then((m) => m.AddDocumentDialog), { ssr: false });

const STATUS: Record<string, string> = { draft: "Draft", ready: "Ready to export", paid: "Paid" };

/** Free plan (Ika, 2026-10-19): up to 5 documents a project, one of each template. Teams lifts both. */
export const FREE_DOCUMENT_LIMIT = 5;

// Documents saved to this project (build step 8): open one to keep working on it, remove it from
// the project (it stays in its maker's drafts), or add a new one from a template, which is saved
// here as soon as it's started.
/**
 * "Behind the Production" (Figma 824:23124): the project's documents as pills that open them,
 * and an Add document pill. The full list with remove and delete lives in Manage.
 */
export function DocumentPills({ projectId, documents, icons, canEdit }: { projectId: string; documents: ProjectDocument[]; icons: Record<string, string>; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);
  const pill =
    "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-small font-semibold text-foreground outline-none transition-colors duration-fast hover:border-ring hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <Link href={`/templates/${doc.templateCode}?doc=${doc.id}`} className={pill}>
              <FlatIcon name={icons[doc.templateCode] ?? "file"} size="sm" className="size-4" />
              {doc.title}
            </Link>
          </li>
        ))}
        {canEdit && (
          <li>
            <button type="button" onClick={() => setAdding(true)} className={cn(pill, "border-dashed text-muted-foreground")}>
              <Plus aria-hidden className="size-4" /> Add document
            </button>
          </li>
        )}
      </ul>
      {documents.length === 0 && (
        <p className="text-small text-muted-foreground">
          {canEdit ? `Call sheets, shotlists, invoices… up to ${FREE_DOCUMENT_LIMIT} from templates.` : "No documents yet."}
        </p>
      )}
      <AddDocumentDialog projectId={projectId} existing={documents} open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export function ProjectDocuments({ projectId, documents, icons, canEdit, isOwner, userId, now }: { projectId: string; documents: ProjectDocument[]; icons: Record<string, string>; canEdit: boolean; isOwner: boolean; userId: string; now: number }) {
  const [confirming, setConfirming] = useState<string | null>(null);
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

  // Deleting: the person who made it, or the project owner (audit #3).
  const destroy = async (doc: ProjectDocument) => {
    setRemoved((r) => [...r, doc.id]);
    setConfirming(null);
    const { error } = await createClient().rpc("soft_delete_document", { doc_id: doc.id });
    if (error) {
      setRemoved((r) => r.filter((id) => id !== doc.id));
      return void toast.error(`Couldn't delete ${doc.title}: ${error.message}`);
    }
    toast.success(`${doc.title} deleted`);
    router.refresh();
  };

  return (
    <section aria-labelledby="documents" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="documents" className="flex items-baseline gap-2 text-lg leading-[1.4] font-bold text-foreground">
          Documents
          <span className="text-small font-semibold text-muted-foreground">
            {list.length} of {FREE_DOCUMENT_LIMIT}
          </span>
        </h2>
        {canEdit && (
          <Button variant="outline" size="compact" onClick={() => setAdding(true)}>
            <FilePlus2 aria-hidden /> Add document
          </Button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-small text-muted-foreground">
          {canEdit ? `No documents yet. Add up to ${FREE_DOCUMENT_LIMIT} from templates (one of each), like a call sheet or shotlist. Uploaded documents go to Files & references.` : "No documents yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((doc) => (
            <li key={doc.id} className="group flex flex-col gap-2 rounded-xl border border-border bg-white p-3 transition-colors duration-fast hover:border-ring">
              <div className="flex items-center gap-3">
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
              {(isOwner || doc.createdBy === userId) && (
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${doc.title}`} onClick={() => setConfirming(doc.id)}>
                  <Trash2 />
                </Button>
              )}
              </div>
              {confirming === doc.id && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/8 p-2">
                  <span className="text-small text-foreground">Delete for everyone on the project?</span>
                  <span className="flex gap-2">
                    <Button variant="ghost" size="compact" onClick={() => setConfirming(null)}>
                      Keep
                    </Button>
                    <Button variant="destructive" size="compact" onClick={() => destroy(doc)}>
                      Delete
                    </Button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <AddDocumentDialog projectId={projectId} existing={list} open={adding} onOpenChange={setAdding} />
    </section>
  );
}
