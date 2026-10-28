"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CREATORS, CREATORS_HREF, creatorFilms } from "@/features/explore/creators";
import { MADE_IN_AFRICA, MADE_IN_AFRICA_HREF, exploreHome, madeInAfrica } from "@/features/explore/made-in-africa";
import { RECENT_DAYS, type Added } from "@/features/explore/recent";
import { CreatorsStrip } from "./creators-strip";
import { DirectorsNotes } from "./directors-notes";
import { EpkLanes } from "./epk-lanes";
import { getCategory } from "./explore-data";
import { MadeInAfricaStrip } from "./made-in-africa-strip";
import { RecentlyAddedStrip } from "./recently-added-strip";

type Section = { id: string; name: string; description: string; count: string; href?: string; row: React.ReactNode };

// By category, in full (Ika, 2026-10-21; built 2026-10-28): every Explore category, each under a
// heading that shows or hides it, opened from "By category ›" on Explore. All start open.
export function ExploreCategories({ seed, recent }: { seed: number; recent: Added[] }) {
  const epk = getCategory("epk");
  const notes = getCategory("notes");
  const sections: Section[] = [
    ...(recent.length
      ? [{ id: "recent", name: "Recently added on Explore", description: `Titles and films added in the last ${RECENT_DAYS} days.`, count: `${recent.length} ${recent.length === 1 ? "title" : "titles"}`, row: <RecentlyAddedStrip added={recent} bare /> }]
      : []),
    { id: "made-in-africa", name: MADE_IN_AFRICA.name, description: MADE_IN_AFRICA.description, count: `${madeInAfrica.length} titles`, href: MADE_IN_AFRICA_HREF, row: <MadeInAfricaStrip seed={seed} bare /> },
    { id: "creators", name: CREATORS.name, description: CREATORS.description, count: `${creatorFilms.length} films`, href: CREATORS_HREF, row: <CreatorsStrip seed={seed} bare /> },
    { id: "epk", name: epk.title, description: "Each film's official trailer, press tour, what critics said and context.", count: `${epk.items.length} films`, row: <EpkLanes category={epk} bare /> },
    { id: "notes", name: notes.title, description: "The documents behind well-known productions.", count: `${notes.items.length} documents`, row: <DirectorsNotes category={notes} bare /> },
  ];
  const [open, setOpen] = useState(() => new Set(sections.map((s) => s.id)));
  const toggle = (id: string, on: boolean) =>
    setOpen((was) => {
      const next = new Set(was);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="flex w-full flex-col px-4 pt-10 pb-24 md:px-7.5 lg:pt-12.5">
      <Link
        href={exploreHome()}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Back to Explore
      </Link>
      <h1 className="mt-8 text-h2 font-semibold tracking-tight text-foreground">By category</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" size="compact" onClick={() => setOpen(new Set(sections.map((s) => s.id)))}>
          Show all
        </Button>
        <Button variant="outline" size="compact" onClick={() => setOpen(new Set())}>
          Hide all
        </Button>
      </div>

      <div className="mt-8 flex flex-col divide-y divide-border border-y border-border">
        {sections.map((s) => (
          <Collapsible key={s.id} open={open.has(s.id)} onOpenChange={(on) => toggle(s.id, on)}>
            <div className="flex flex-wrap items-center justify-between gap-3 py-5">
              <CollapsibleTrigger className="group flex min-w-0 flex-1 items-start gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <ChevronDown aria-hidden className={cn("mt-1.5 size-5 shrink-0 text-muted-foreground transition-transform duration-fast", !open.has(s.id) && "-rotate-90")} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-subtitle font-semibold text-foreground">{s.name}</span>
                    <span className="text-small text-muted-foreground">{s.count}</span>
                  </span>
                  <span className="mt-1 block max-w-160 text-sm text-muted-foreground">{s.description}</span>
                </span>
              </CollapsibleTrigger>
              {s.href && (
                <Button variant="outline" asChild>
                  <Link href={s.href}>
                    View all
                    <ArrowRight aria-hidden data-icon="inline-end" />
                  </Link>
                </Button>
              )}
            </div>
            <CollapsibleContent className="pb-8">{s.row}</CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
