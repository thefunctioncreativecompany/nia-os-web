import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FranchiseAll } from "@/components/explore/franchise-all";
import { franchiseRows } from "@/features/explore/franchises";

// A franchise's page (Ika, 2026-11-21): every film and series in it, in release order. The
// franchises and their titles are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return franchiseRows().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/explore/franchise/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = franchiseRows().find((r) => r.id === id);
  return { title: row ? `${row.name} · Explore · Nia OS` : "Explore · Nia OS" };
}

// Reading the address waits inside a boundary, so the rest of the page isn't held up.
export default function Page({ params }: PageProps<"/explore/franchise/[id]">) {
  return (
    <Suspense fallback={null}>
      <Franchise params={params} />
    </Suspense>
  );
}

async function Franchise({ params }: Pick<PageProps<"/explore/franchise/[id]">, "params">) {
  const { id } = await params;
  const row = franchiseRows().find((r) => r.id === id);
  if (!row) notFound();
  return <FranchiseAll row={row} />;
}
