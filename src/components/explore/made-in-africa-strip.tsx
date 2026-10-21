"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrubFilmstrip } from "@/components/nia/scrub-filmstrip";
import { MADE_IN_AFRICA, MADE_IN_AFRICA_HREF, madeInAfrica, titleHref } from "@/features/explore/made-in-africa";
import { TitlePoster } from "./title-poster";

// How many titles the filmstrip shows; View all has the rest (Ika, 2026-10-21).
const SHOWN = 15;

// Made in Africa on Explore (Ika, 2026-10-21): the first 15 titles in the look of the "05 ·
// Filmstrip scrub" gallery from her Claude Design (the chosen poster forward, its title large
// underneath), stepped with arrows from the first title, and View all for the full category.
export function MadeInAfricaStrip() {
  const shown = madeInAfrica.slice(0, SHOWN);
  return (
    <section aria-labelledby="made-in-africa-title" className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 id="made-in-africa-title" className="text-subtitle font-semibold text-foreground">
            {MADE_IN_AFRICA.name}
          </h3>
          <p className="mt-1 max-w-160 text-sm text-muted-foreground">{MADE_IN_AFRICA.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={MADE_IN_AFRICA_HREF}>
            View all {madeInAfrica.length}
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </Button>
      </div>
      <ScrubFilmstrip
        look="reel"
        control="arrows"
        className="mt-2"
        items={shown}
        label={`${MADE_IN_AFRICA.name}, first ${shown.length} titles`}
        getKey={(e) => e.title.slug}
        footer={(e) => e.title.title}
        renderCard={(e, i) => (
          <TitlePoster entry={e} number={i + 1} href={titleHref(e.title.slug)} sizes="(min-width: 40rem) 20rem, 16rem" className="w-64 sm:w-80" />
        )}
      />
    </section>
  );
}
