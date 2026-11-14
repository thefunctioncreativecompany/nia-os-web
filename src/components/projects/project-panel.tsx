"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { deliverableText, projectMeta, shootCountdown, shootDatesText, type Project } from "@/lib/projects";
import { formatDay } from "@/lib/dates";
import { sentenceCase } from "@/lib/sentence-case";
import { Button } from "@/components/ui/button";
import { PrevNext, SidePanel } from "@/components/nia/side-panel";

type Named = Project & { name: string };

// A project in the right panel on the Projects page (A/B, Ika 2026-11-14: "apply same to projects
// … including shoot day"): the cover the size of an Explore trailer, type · stage, the title,
// where the shoot stands, and Open project as the one main action. Only details that hold
// something show (minimalism wins). Previous / next and the arrow keys step through the grid.
export function ProjectPanel({
  project: p,
  list,
  now,
  onNavigate,
  onClose,
}: {
  project: Project;
  list: Project[];
  now: number;
  onNavigate: (project: Project) => void;
  onClose: () => void;
}) {
  const title = p.title || "Untitled project";
  const named = (x: Project | undefined): Named | null => (x ? { ...x, name: x.title || "Untitled project" } : null);
  const index = list.findIndex((x) => x.id === p.id);
  const prev = named(index > 0 ? list[index - 1] : undefined);
  const next = named(index >= 0 ? list[index + 1] : undefined);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight" && next) onNavigate(next);
    if (e.key === "ArrowLeft" && prev) onNavigate(prev);
  };

  const meta = [p.productionType && sentenceCase(p.productionType), sentenceCase(p.stage)].filter(Boolean).join(" · ");
  const shoot = shootDatesText(p.shootStart, p.shootEnd);
  const countdown = shootCountdown(p.shootStart, p.shootEnd, now);
  const genres = p.genres.split(",").map((g) => g.trim()).filter(Boolean).map(sentenceCase);
  const rows: [string, string][] = [
    ["Client", p.client],
    ["Agency", p.agency],
    ["Due", p.dueDate ? formatDay(p.dueDate) : ""],
    ["Deliverables", p.deliverables.map(deliverableText).join(", ")],
    ["Genre", genres.join(", ")],
    ["Crew & talent", p.crew.length ? `${p.crew.length} ${p.crew.length === 1 ? "person" : "people"}` : ""],
  ];

  return (
    <SidePanel label={`${title}, project preview`} onClose={onClose} onKeyDown={onKeyDown} tools={<PrevNext prev={prev} next={next} onNavigate={onNavigate} />}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-6 pt-6 pb-14 xl:px-9.5">
          <div className="relative aspect-[19/10] w-full overflow-hidden rounded-3xl bg-muted">
            {p.coverUrl && <Image key={p.coverUrl} src={p.coverUrl} alt="" fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />}
          </div>

          <div className="flex flex-col gap-2">
            {meta && <p className="text-small font-medium text-muted-foreground">{meta}</p>}
            <h2 className="text-h2 font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-small text-muted-foreground">{projectMeta(p, now)}</p>
          </div>

          <Button asChild className="w-fit">
            <Link href={`/projects/${p.id}`}>Open project</Link>
          </Button>

          {/* The shoot first: what a production plans around (Ika: "including shoot day"). */}
          <section aria-label="Shoot" className="flex items-center gap-4 rounded-2xl border border-border p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
              <CalendarDays aria-hidden className="size-5 text-foreground" />
            </span>
            {shoot ? (
              <span className="flex min-w-0 flex-col">
                <span className="text-lead font-semibold text-foreground">{countdown}</span>
                <span className="text-small text-muted-foreground">{shoot}</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No shoot days yet</span>
            )}
          </section>

          {p.description && <p className="text-lead leading-relaxed text-foreground/80">{p.description}</p>}

          {rows.some(([, v]) => v) && (
            <dl className="flex flex-col gap-3">
              {rows
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-6">
                    <dt className="w-28 shrink-0 text-sm text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 flex-1 text-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
            </dl>
          )}
        </div>
      </div>
    </SidePanel>
  );
}
