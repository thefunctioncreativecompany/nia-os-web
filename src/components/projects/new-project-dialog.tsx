"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// "Create New Project" (Figma 798:136): Blank Project, or From Template (once templates
// exist). Wrap whatever opens it: <NewProjectDialog><Button>…</Button></NewProjectDialog>.
export function NewProjectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100%-2rem)] max-w-[480px] flex-col items-center gap-7 rounded-2xl p-8 sm:max-w-[480px]"
      >
        <DialogTitle className="text-center text-subtitle font-bold">
          Create New Project
        </DialogTitle>
        <DialogDescription className="sr-only">
          Start a blank project, or from a template.
        </DialogDescription>
        <div className="grid w-full grid-cols-1 gap-4 min-[440px]:grid-cols-2">
          <Link
            href="/projects/new"
            onClick={() => setOpen(false)}
            className="flex h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-nia-surface p-5 text-center outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-border bg-white">
              <FileText aria-hidden className="size-6" />
            </span>
            <span className="text-base leading-normal font-bold">Blank Project</span>
            <span className="text-micro text-muted-foreground">Start from scratch with an empty project</span>
          </Link>
          <div
            aria-disabled="true"
            className="flex h-[180px] cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border border-border bg-nia-surface p-5 text-center opacity-60"
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-border bg-white">
              <FilePlus2 aria-hidden className="size-6" />
            </span>
            <span className="text-base leading-normal font-bold">From Template</span>
            <span className="text-micro text-muted-foreground">Templates are coming soon</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm text-sm leading-normal font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  );
}
