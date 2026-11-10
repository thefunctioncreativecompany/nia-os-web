"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";

import { ChipRow, FilterChip } from "@/components/nia/filter-bar";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ICPS, WORKFLOWS, icpFor, type Icp, type Workflow } from "./workflows";

type Named = { code: string; name: string };
const documentsOf = (w: Workflow, templates: Named[]) => w.templates.flatMap((code) => templates.find((t) => t.code === code)?.name ?? []);

// "Start from a goal" (Ika, 2026-11-10; FEEDBACK B3): three workflows for each group Nia is for,
// the person's own group first (from their onboarding profession). A card names the goal and the
// documents it sets up; starting one asks for the project's name, creates the project with those
// documents as drafts and opens it. Built from existing pieces: filter chips, the card look,
// the dialog. `templates` is the working templates the page already has (for the documents' names);
// the code that creates the project loads when one is started.
export function WorkflowCards({ templates, profession, headingId = "workflows", className }: { templates: Named[]; profession?: string | null; headingId?: string; className?: string }) {
  const mine = icpFor(profession);
  const [chosen, setChosen] = useState<Icp | null>(null);
  const icp = chosen ?? mine ?? "creators";
  const [starting, setStarting] = useState<Workflow | null>(null);

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl leading-[1.4] font-bold text-foreground">
          Start from a goal
        </h2>
        <p className="text-small text-muted-foreground">Pick what you&rsquo;re making. Nia sets up the project and its documents.</p>
      </div>
      <ChipRow role="group" aria-label="Who it's for">
        {ICPS.map((g) => (
          <FilterChip key={g.id} on={g.id === icp} onClick={() => setChosen(g.id)}>
            {g.label}
          </FilterChip>
        ))}
      </ChipRow>
      <ul className="grid gap-4 md:grid-cols-3">
        {WORKFLOWS.filter((w) => w.icp === icp).map((w) => (
          <li key={w.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setStarting(w)}
              className="hover-sweep group flex h-full w-full flex-col gap-4 rounded-xl border border-border bg-card p-5 text-left outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex flex-col gap-1.5">
                <span className="text-lead leading-[1.4] font-bold text-foreground">{w.name}</span>
                <span className="text-small leading-normal text-muted-foreground">{w.does}</span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {documentsOf(w, templates).map((name) => (
                  <span key={name} className="rounded-full bg-secondary px-2.5 py-1 text-caption font-medium text-foreground">
                    {name}
                  </span>
                ))}
              </span>
              <span className="mt-auto flex items-center gap-1.5 text-small font-semibold text-foreground">
                Start
                <ArrowRight aria-hidden className="size-4 transition-transform duration-fast ease-out group-hover:translate-x-0.5 motion-reduce:translate-x-0!" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {starting && <StartDialog key={starting.id} workflow={starting} documents={documentsOf(starting, templates)} onClose={() => setStarting(null)} />}
    </section>
  );
}

function StartDialog({ workflow, documents, onClose }: { workflow: Workflow; documents: string[]; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Loaded now, not with the page: it carries every template's sections.
    const { startWorkflow } = await import("./start");
    const result = await startWorkflow(workflow, title);
    if (!result.ok) {
      setBusy(false);
      if (result.reason === "limit") {
        onClose();
        return openUpgrade("projects");
      }
      return void toast.error(result.message ? `Couldn't start it: ${result.message}` : "Couldn't start it. Please try again.");
    }
    if (result.documents < documents.length) toast.message(`Project created with ${result.documents} of ${documents.length} documents.`);
    router.push(`/projects/${result.projectId}`);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{workflow.name}</DialogTitle>
        <DialogDescription>
          A new project with {documents.length} documents, each a blank draft ready to fill in.
        </DialogDescription>
        <form onSubmit={start} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="workflow-project-name">Project name</Label>
            <Input id="workflow-project-name" autoFocus maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={workflow.name} />
          </div>
          <ul className="flex flex-col gap-2">
            {documents.map((name) => (
              <li key={name} className="flex items-center gap-2.5 text-small text-foreground">
                <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                {name}
              </li>
            ))}
          </ul>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
