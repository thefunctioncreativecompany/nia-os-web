import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canUsePortfolios, listPortfolios } from "@/features/portfolios/data";
import { NewPortfolioTile } from "@/features/portfolios/new-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsNav } from "@/components/projects/projects-nav";

export const metadata: Metadata = {
  title: "Portfolios · Nia OS",
};

// Projects › Portfolios (beta, PORTFOLIOS_BUILD.md P4, cut down): the New portfolio tile, then each
// portfolio as a picture and a name (few words). Only for the accounts in the beta.
export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-15 md:px-page">
      <ProjectsNav />
      <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
        <Portfolios />
      </Suspense>
    </div>
  );
}

async function Portfolios() {
  if (!(await canUsePortfolios())) notFound();
  const portfolios = await listPortfolios();
  return (
    <section aria-labelledby="portfolios" className="flex flex-col gap-6">
      <h1 id="portfolios" className="text-h2 font-semibold tracking-tight text-foreground">
        Portfolios
      </h1>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(16.25rem,1fr))] gap-6">
        <li>
          <NewPortfolioTile />
        </li>
        {portfolios.map(({ portfolio: p, cover }) => (
          <li key={p.id}>
            <Link href={`/projects/portfolios/${p.id}`} className="group flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="group-sweep relative block aspect-[19/10] overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour */}
                {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-base font-bold text-foreground">{p.title}</span>
                <span className="text-small text-muted-foreground">{p.publishedAt ? "Published" : "Not published"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
