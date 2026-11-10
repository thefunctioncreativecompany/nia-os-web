"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CREATORS, CREATORS_HREF } from "@/features/explore/creators";
import { GREATEST_TV, GREATEST_TV_HREF, HOLLYWOOD_CLASSICS, HOLLYWOOD_CLASSICS_HREF, MADE_IN_AFRICA, MADE_IN_AFRICA_HREF, greatestTv } from "@/features/explore/made-in-africa";
import { CreatorsStrip } from "./creators-strip";
import { EpkLanes } from "./epk-lanes";
import { getCategory } from "./explore-data";
import { CategoryStrip } from "./category-strip";
import { MadeInAfricaStrip } from "./made-in-africa-strip";

type Section = { id: string; name: string; href?: string; row: React.ReactNode };

// By category on Explore (Ika, 2026-10-21; on the Explore page itself since 2026-10-29): every
// category under a heading that shows or hides it, with Show all / Hide all. All start open.
// Headings are the name alone, no count or explaining line (Ika, 2026-10-30).
// Top 10 on Explore sits above Recently added since 2026-11-08 (explore-library.tsx).
export function CategorySections({ seed }: { seed: number }) {
  const epk = getCategory("epk");
  const sections: Section[] = [
    { id: "made-in-africa", name: MADE_IN_AFRICA.name, href: MADE_IN_AFRICA_HREF, row: <MadeInAfricaStrip seed={seed} bare /> },
    { id: "hollywood-classics", name: HOLLYWOOD_CLASSICS.name, href: HOLLYWOOD_CLASSICS_HREF, row: <CategoryStrip category="hollywood-classics" /> },
    // Greatest TV (approved 2026-10-30) shows once a title in it has a cover.
    ...(greatestTv.length ? [{ id: "greatest-tv", name: GREATEST_TV.name, href: GREATEST_TV_HREF, row: <CategoryStrip category="greatest-tv" /> }] : []),
    { id: "creators", name: CREATORS.name, href: CREATORS_HREF, row: <CreatorsStrip seed={seed} bare /> },
    // By studio moved under Top 10 (Ika, 2026-11-10; explore-library.tsx).
    { id: "epk", name: epk.title, row: <EpkLanes category={epk} bare /> },
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
    <section aria-labelledby="by-category" className="mt-14 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="by-category" className="text-h3 font-semibold text-foreground">
          By category
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="compact" onClick={() => setOpen(new Set(sections.map((s) => s.id)))}>
            Show all
          </Button>
          <Button variant="outline" size="compact" onClick={() => setOpen(new Set())}>
            Hide all
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col divide-y divide-border border-y border-border">
        {sections.map((s) => (
          <Collapsible key={s.id} open={open.has(s.id)} onOpenChange={(on) => toggle(s.id, on)}>
            <div className="flex flex-wrap items-center justify-between gap-3 py-5">
              <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-fast", !open.has(s.id) && "-rotate-90")} />
                <span className="min-w-0 text-subtitle font-semibold text-foreground">{s.name}</span>
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
    </section>
  );
}
