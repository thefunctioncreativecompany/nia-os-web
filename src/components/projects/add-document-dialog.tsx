"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";

import type { ProjectDocument } from "@/lib/projects-data";
import { createClient } from "@/lib/supabase/client";
import { projectPlan } from "@/lib/plan-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { Dropzone } from "@/components/projects/project-files";
import { FREE_DOCUMENT_LIMIT } from "@/components/projects/project-documents";
import { loadWorkingTemplates } from "@/features/templates/actions";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import type { GalleryTemplate } from "@/features/templates/gallery";
import { workingSuggestions } from "@/features/templates/recommend";
import { useTemplateProfile } from "@/features/templates/use-template-profile";

// "Add document" (Ika, 2026-10-19), loaded only when it's opened: first choose how, then upload documents from the computer
// (saved to the project's files, tagged as briefs & paperwork) or start one from a template.
export function AddDocumentDialog({ projectId, existing, open, onOpenChange }: { projectId: string; existing: ProjectDocument[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  // Paid workspaces skip the free plan's document limits.
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (!open) return;
    let live = true;
    void projectPlan(createClient(), projectId).then((plan) => live && setPaid(plan !== "free"));
    return () => {
      live = false;
    };
  }, [open, projectId]);
  const full = !paid && existing.length >= FREE_DOCUMENT_LIMIT;
  const have = new Map(existing.map((d) => [d.templateCode, d] as const));
  const router = useRouter();
  const upgrade = (reason: "documents" | "duplicate") => {
    close(false);
    openUpgrade(reason);
  };
  const learning = useTemplateProfile();
  const [step, setStep] = useState<"choose" | "upload" | "template">("choose");
  const [templates, setTemplates] = useState<GalleryTemplate[] | null>(null);

  useEffect(() => {
    if (step !== "template" || templates) return;
    let live = true;
    void loadWorkingTemplates().then((t) => live && setTemplates(t));
    return () => {
      live = false;
    };
  }, [step, templates]);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setStep("choose");
  };
  const list = templates && learning.ready ? workingSuggestions(templates, learning.profile, templates.length) : null;
  const option =
    "hover-sweep flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-nia-surface p-5 text-center outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[480px] flex-col gap-5 overflow-y-auto rounded-2xl p-6 sm:max-w-[480px]">
        <DialogTitle className="text-subtitle font-bold">
          {step === "choose" ? "Add a document" : step === "upload" ? "Upload documents" : "Start from a template"}
        </DialogTitle>
        <DialogDescription className="-mt-3 text-small text-muted-foreground">
          {step === "choose"
            ? "Bring in a document you already have, or make one from a template."
            : step === "upload"
              ? "PDFs, Word, text and spreadsheets. They go into this project's files as briefs & paperwork."
              : "It opens ready to fill in, saved to this project."}
        </DialogDescription>

        {step === "choose" && (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <button type="button" onClick={() => setStep("upload")} className={option}>
              <span className="group-sweep flex size-12 items-center justify-center rounded-full border border-border bg-card">
                <FileUp aria-hidden className="size-6" />
              </span>
              <span className="text-base font-bold">Upload from your computer</span>
              <span className="text-micro text-muted-foreground">Scripts, briefs, contracts, decks</span>
            </button>
            <button type="button" onClick={() => (full ? upgrade("documents") : setStep("template"))} className={cn(option, full && "opacity-80")}>
              <span className="group-sweep flex size-12 items-center justify-center rounded-full border border-border bg-card">
                <LayoutTemplate aria-hidden className="size-6" />
              </span>
              <span className="text-base font-bold">Start from a template</span>
              <span className="text-micro text-muted-foreground">
                {full ? `This project has ${FREE_DOCUMENT_LIMIT} documents, the free plan's most. Upgrade for more` : "Call sheets, shotlists, invoices and more"}
              </span>
            </button>
          </div>
        )}

        {step === "upload" && (
          <Dropzone
            projectId={projectId}
            tag="brief"
            accept=".pdf,.doc,.docx,.txt,.md,.rtf,.csv,.xls,.xlsx,.ppt,.pptx"
            hint="PDF, Word, text, spreadsheets and decks"
            onUploaded={() => {
              router.refresh();
              toast.success("Added to this project's files");
            }}
          />
        )}

        {step === "template" && (
          <ul className="flex max-h-[55svh] flex-col gap-2 overflow-y-auto">
            {!list && Array.from({ length: 4 }, (_, i) => <li key={i}><Skeleton className="h-14 rounded-xl" /></li>)}
            {list?.map(({ template: t }) => {
              const already = have.get(t.code);
              // One of each template per project on the free plan: open the one it has, or (paid
              // plans) start another.
              if (already)
                return (
                  <li key={t.code} className="flex items-center gap-2">
                    <Link
                      href={`/templates/${t.code}?doc=${already.id}`}
                      onClick={() => close(false)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel opacity-60">
                        <FlatIcon name={t.icon} size="sm" className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-muted-foreground">{t.name}</span>
                        <span className="block truncate text-caption text-muted-foreground">Already in this project</span>
                      </span>
                      <span className="shrink-0 text-small font-semibold text-foreground">Open</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="compact"
                      aria-label={`Add another ${t.name}`}
                      onClick={() => {
                        if (!paid) return upgrade("duplicate");
                        close(false);
                        router.push(`/templates/${t.code}?project=${projectId}&another=1`);
                      }}
                    >
                      <Plus aria-hidden /> Another
                    </Button>
                  </li>
                );
              return (
              <li key={t.code}>
                <button
                  type="button"
                  onClick={() => {
                    learning.record(t.code, "use");
                    close(false);
                    router.push(`/templates/${t.code}?project=${projectId}`);
                  }}
                  className="hover-sweep flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
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
              );
            })}
          </ul>
        )}

        {step !== "choose" && (
          <button type="button" onClick={() => setStep("choose")} className="inline-flex w-fit items-center gap-1.5 self-center rounded-sm text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <ArrowLeft aria-hidden className="size-4" /> Back
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
