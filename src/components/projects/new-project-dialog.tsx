"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePlus2, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { loadWorkingTemplates } from "@/features/templates/actions";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import type { GalleryTemplate } from "@/features/templates/gallery";
import { workingSuggestions } from "@/features/templates/recommend";
import { useTemplateProfile } from "@/features/templates/use-template-profile";

const optionClassName =
  "flex h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-nia-surface p-5 text-center outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

// "Create New Project" (Figma 798:136): Blank Project, or From Template, which lists the
// templates that work in the editor (most recently used first) and opens the chosen one.
// Wrap whatever opens it: <NewProjectDialog><Button>…</Button></NewProjectDialog>.
export function NewProjectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "templates">("choose");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setStep("choose");
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100%-2rem)] max-w-[480px] flex-col items-center gap-7 rounded-2xl p-8 sm:max-w-[480px]"
      >
        <DialogTitle className="text-center text-subtitle font-bold">
          {step === "choose" ? "Create New Project" : "Start from a template"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {step === "choose" ? "Start a blank project, or from a template." : "Pick a template; it opens ready to fill in."}
        </DialogDescription>
        {step === "choose" ? (
          <div className="grid w-full grid-cols-1 gap-4 min-[440px]:grid-cols-2">
            <Link href="/projects/new" onClick={() => setOpen(false)} className={optionClassName}>
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-white">
                <FileText aria-hidden className="size-6" />
              </span>
              <span className="text-base leading-normal font-bold">Blank Project</span>
              <span className="text-micro text-muted-foreground">Start from scratch with an empty project</span>
            </Link>
            <button type="button" onClick={() => setStep("templates")} className={optionClassName}>
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-white">
                <FilePlus2 aria-hidden className="size-6" />
              </span>
              <span className="text-base leading-normal font-bold">From Template</span>
              <span className="text-micro text-muted-foreground">Call sheets, shotlists, invoices and more</span>
            </button>
          </div>
        ) : (
          <TemplateChoices onChosen={() => setOpen(false)} />
        )}
        <button
          type="button"
          onClick={() => (step === "choose" ? setOpen(false) : setStep("choose"))}
          className="inline-flex items-center gap-1.5 rounded-sm text-sm leading-normal font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {step === "choose" ? "Cancel" : <><ArrowLeft aria-hidden className="size-4" /> Back</>}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// Loaded only when "From Template" is chosen, so the dialog costs nothing until then.
function TemplateChoices({ onChosen }: { onChosen: () => void }) {
  const router = useRouter();
  const learning = useTemplateProfile();
  const [templates, setTemplates] = useState<GalleryTemplate[] | null>(null);

  useEffect(() => {
    let live = true;
    void loadWorkingTemplates().then((list) => live && setTemplates(list));
    return () => {
      live = false;
    };
  }, []);

  if (!templates || !learning.ready) {
    return (
      <div className="flex w-full flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  const list = workingSuggestions(templates, learning.profile, templates.length);
  return (
    <ul className="flex max-h-[50svh] w-full flex-col gap-2 overflow-y-auto">
      {list.map(({ template: t, why }) => (
        <li key={t.code}>
          <button
            type="button"
            onClick={() => {
              learning.record(t.code, "use");
              onChosen();
              router.push(`/templates/${t.code}`);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
              <FlatIcon name={t.icon} size="sm" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{t.name}</span>
              <span className="block truncate text-caption text-muted-foreground">
                {t.stage} · {why}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
