import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadPublic } from "@/features/portfolios/data";
import { PortfolioView } from "@/features/portfolios/portfolio-view";

// A portfolio's public page (beta, PORTFOLIOS_BUILD.md P3, cut down): no Nia bar, like the share
// page. Published portfolios open for anyone with the link; an unpublished one opens only for people
// in its workspace, marked as a preview. Files stay private: the server opens each with a link that
// lasts an hour, only for the final assets of the portfolio's own projects.
export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <Public params={params} />
    </Suspense>
  );
}

async function Public({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  const { slug } = await params;
  const data = await loadPublic(slug);
  if (!data) notFound();
  return <PortfolioView {...data} />;
}
