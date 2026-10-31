import type { CSSProperties } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { referenceHref, type InstagramReference } from "@/lib/instagram-references";

/** A poster's shape, as in Explore's cards (title-card.tsx). */
const POSTER = 268 / 373;

/** For a row's cell, like Explore's `cardSpan`: as tall as the posters beside it. */
export function referenceSpan(ref: InstagramReference): CSSProperties {
  return { "--span": (ref.aspect ?? POSTER) / POSTER } as CSSProperties;
}

/** Who made it: the director when the credits name one, else the first credit, else the account. */
export function leadName(ref: InstagramReference) {
  const lead = ref.credits.find((c) => /^director$/i.test(c.role)) ?? ref.credits[0];
  if (lead) return lead.handle && lead.name === lead.handle ? `@${lead.name}` : lead.name;
  return ref.account ? `@${ref.account}` : "Instagram";
}

// An Instagram post in a project's references, looking like Explore's cards (Ika, 2026-10-22): the
// cover at the film's true shape, its title and who made it. The cover is the project's private
// copy, opened with a short-lived link, so it isn't passed through the image optimiser (which
// would keep a copy).
export function InstagramReferenceCard({ projectId, reference, actions }: { projectId: string; reference: InstagramReference; actions?: React.ReactNode }) {
  const by = leadName(reference);
  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={referenceHref(projectId, reference.id)}
        aria-label={`${reference.title}, from Instagram, ${by}`}
        className="group flex w-full flex-col gap-2 rounded-lg text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "relative block overflow-hidden rounded-lg transition-[transform,box-shadow] duration-lift ease-glide group-hover:-translate-y-1 group-hover:shadow-card-hover group-focus-visible:-translate-y-1 motion-reduce:translate-y-0!",
            reference.coverUrl ? "bg-muted" : "grain-5",
          )}
          style={{ aspectRatio: reference.aspect ?? POSTER }}
        >
          {reference.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- private covers use short-lived links (see above)
            <img src={reference.coverUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span aria-hidden className="absolute inset-x-0 bottom-0 p-4 text-h3 leading-tight font-bold tracking-tight">
              {reference.title}
            </span>
          )}
          {reference.productionType && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-card/90 px-2.5 py-1 text-micro font-semibold text-foreground">{reference.productionType}</span>
          )}
        </span>
        <span className="truncate text-lead font-semibold">{reference.title}</span>
        <span className="-mt-1.5 truncate text-small text-muted-foreground">{by}</span>
      </Link>
      {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}
