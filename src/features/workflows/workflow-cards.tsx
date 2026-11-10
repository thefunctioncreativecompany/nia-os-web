"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { ChipRow, FilterChip } from "@/components/nia/filter-bar";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { grainFor } from "@/features/templates/gallery";
import { cn } from "@/lib/utils";
import { ICPS, WORKFLOWS, icpFor, type Icp, type Workflow } from "./workflows";

type Named = { code: string; name: string; icon: string };
const documentsOf = (w: Workflow, templates: Named[]) => w.templates.flatMap((code) => templates.find((t) => t.code === code)?.name ?? []);

// Workflows (Ika, 2026-11-10; FEEDBACK B3): three for each group Nia is for, the person's own
// group first (from their onboarding profession). Big picture cards with the goal's name and
// nothing else (Ika: creatives are visual; no explaining lines), like Strategy & Development's.
// Starting one asks for the project's name, creates the project with its documents as drafts and
// opens it. `templates` is the working templates the page already has (names and icons); the
// code that creates the project loads when one is started.
export function WorkflowCards({ templates, profession, headingId = "workflows", headingClassName = "text-subtitle font-semibold text-foreground", className }: { templates: Named[]; profession?: string | null; headingId?: string; headingClassName?: string; className?: string }) {
  const mine = icpFor(profession);
  const [chosen, setChosen] = useState<Icp | null>(null);
  const icp = chosen ?? mine ?? "creators";
  const [starting, setStarting] = useState<Workflow | null>(null);

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-5", className)}>
      <h2 id={headingId} className={headingClassName}>
        Workflows
      </h2>
      <ChipRow role="group" aria-label="Who it's for">
        {ICPS.map((g) => (
          <FilterChip key={g.id} on={g.id === icp} onClick={() => setChosen(g.id)}>
            {g.label}
          </FilterChip>
        ))}
      </ChipRow>
      <ul className="grid gap-4 sm:grid-cols-3">
        {WORKFLOWS.filter((w) => w.icp === icp).map((w) => {
          const lead = templates.find((t) => t.code === w.templates[0]);
          return (
            <li key={w.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`${w.name}: ${documentsOf(w, templates).join(", ")}`}
                onClick={() => setStarting(w)}
                className="group flex w-full flex-col gap-2.5 rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className={cn("grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-2xl transition-shadow duration-base group-hover:shadow-card-hover", grainFor(w.templates[0]))}>
                  {lead && <FlatIcon name={lead.icon} className="size-15 stroke-[1.3] text-current" />}
                </span>
                <span className="text-lg font-bold text-foreground">{w.name}</span>
              </button>
            </li>
          );
        })}
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
        <DialogDescription className="sr-only">A new project with {documents.length} documents, each a blank draft.</DialogDescription>
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
