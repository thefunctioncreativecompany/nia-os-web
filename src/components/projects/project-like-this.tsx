"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewMarker } from "@/components/nia/new-marker";
import { cn } from "@/lib/utils";
import type { GapItem } from "@/features/explore/gap";

export type Compared = { slug: string; title: string; image: string | null; aspect: number; href: string };

const storageKey = (projectId: string) => `nia:like-this-hidden:${projectId}`;

// "Projects like this had…" on the project page (Ika, 2026-10-30; the Start from a brief canvas,
// board 5): what finished work like this project had and this one doesn't yet, each with the step
// that fills it. "Not for this project" hides an item on this device.
export function ProjectLikeThis({
  projectId,
  items,
  compared,
  comparedCount,
  phase,
}: {
  projectId: string;
  items: GapItem[];
  /** The Explore work it was compared with; null without Explore access (names aren't shown). */
  compared: Compared[] | null;
  comparedCount: number;
  /** A line about where the project is: "Shooting in 15 days, so prep comes first." */
  phase: string | null;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(projectId)) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device's storage after the first paint
      if (Array.isArray(saved)) setHidden(saved);
    } catch {
      // Storage off (private window): nothing hidden.
    }
  }, [projectId]);
  const remember = (next: string[]) => {
    setHidden(next);
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(next));
    } catch {
      // Storage off: hidden until the page reloads.
    }
  };

  const shown = items.filter((i) => !hidden.includes(i.key));
  const open = shown.filter((i) => !i.done);
  const done = shown.filter((i) => i.done);
  if (!items.length) return null;

  return (
    <section aria-labelledby="like-this" className="flex flex-col gap-4 rounded-2xl border border-border p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <NewMarker label="Suggested" className="self-start" />
        <h2 id="like-this" className="text-xl leading-[1.4] font-bold text-foreground">
          Projects like this had
        </h2>
        <p className="text-small leading-normal text-muted-foreground">
          {comparedCount ? `Compared with ${comparedCount} finished ${comparedCount === 1 ? "project" : "projects"} like this on Explore.` : "What productions like this usually have."}
          {phase && ` ${phase}`}
        </p>
      </div>

      {open.length ? (
        <ol className="flex flex-col gap-2.5">
          {open.map((item, i) => (
            <li key={item.key} className="flex flex-col gap-2.5 rounded-xl bg-muted px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3 text-sm leading-[1.4]">
                <span className="font-bold text-foreground">{item.label}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">{item.status}</span>
              </div>
              {item.progress !== undefined && (
                <span aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
                  <span className="block h-full rounded-full bg-foreground" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                </span>
              )}
              {item.detail && <span className="text-small leading-normal text-muted-foreground">{item.detail}</span>}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="md" variant={i === 0 ? "default" : "outline"} className="rounded-full">
                  <Link href={item.action.href}>{item.action.label}</Link>
                </Button>
                <Button type="button" size="md" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => remember([...hidden, item.key])}>
                  Not for this project
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm leading-normal text-foreground">This project has everything finished work like it had.</p>
      )}

      {done.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {done.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5 px-1 text-sm leading-[1.4] text-muted-foreground">
              <Check aria-hidden className="size-4 shrink-0 text-foreground" strokeWidth={2.5} />
              <span>
                <span className="font-bold text-foreground">{item.label}</span> · {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hidden.length > 0 && (
        <button type="button" onClick={() => remember([])} className="self-start rounded-sm text-small font-semibold text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
          Show {hidden.length} hidden
        </button>
      )}

      {compared && compared.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          <span className="text-small text-muted-foreground">Compared with</span>
          <div className="flex flex-wrap items-end gap-2">
            {compared.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                title={c.title}
                className={cn("relative block h-18 overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}
                style={{ aspectRatio: c.aspect }}
              >
                {c.image && <Image src={c.image} alt={c.title} fill sizes="8rem" className="object-cover" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
