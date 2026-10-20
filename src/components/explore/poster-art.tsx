import Image from "next/image";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { myPlan } from "@/lib/plan-client";
import { isLimited } from "@/lib/plans";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { grainFor, type Film } from "./explore-data";

// A film's picture: its poster, or its still (`still`), falling back to the other one and then to a
// grain gradient. Fills the nearest positioned parent.
export function PosterArt({
  film,
  still = false,
  position,
  sizes,
  className,
}: {
  film: Film;
  still?: boolean;
  position?: string;
  sizes: string;
  className?: string;
}) {
  const src = still ? (film.stillUrl ?? film.posterUrl) : (film.posterUrl ?? film.stillUrl);
  return (
    <span aria-hidden className={cn("absolute inset-0 block bg-muted", !src && grainFor(film.id), className)}>
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: position }} />}
    </span>
  );
}

// Film pages, press kits and starting a project from a film are on paid plans (Ika, 2026-10-20):
// on the live site a free workspace gets the upgrade prompt. Otherwise (localhost, paid plans) a
// click says when film pages open.
export function opensLater() {
  void myPlan(createClient()).then((plan) => (isLimited(plan) ? openUpgrade("explore") : toast("Film pages open with Explore in February 2027.")));
}
