import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { canUsePortfolios, loadEditor } from "@/features/portfolios/data";
import { PortfolioEditor } from "@/features/portfolios/portfolio-editor";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Portfolio · Nia OS",
};

// A portfolio's editor (beta, PORTFOLIOS_BUILD.md P5, cut down): Sequence, Look and Details.
export default function Page({ params }: PageProps<"/projects/portfolios/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-10 h-96 rounded-2xl md:mx-page" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/projects/portfolios/[id]">, "params">) {
  const { id } = await params;
  if (!(await canUsePortfolios())) notFound();
  const data = await loadEditor(id);
  if (!data) notFound();
  return <PortfolioEditor initial={data.portfolio} initialChosen={data.chosen} projects={data.projects} />;
}
