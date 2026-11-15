import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FestivalAll } from "@/components/explore/festival-all";
import { festivalRows } from "@/features/explore/festivals";

// A festival's View all (Ika, 2026-11-15), opened from its logo under By festival on Explore. The
// festivals and their titles are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return festivalRows().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/explore/festival/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = festivalRows().find((r) => r.id === id);
  return { title: row ? `${row.name} · Explore · Nia OS` : "Explore · Nia OS" };
}

// Reading the address waits inside a boundary, so the rest of the page isn't held up.
export default function Page({ params }: PageProps<"/explore/festival/[id]">) {
  return (
    <Suspense fallback={null}>
      <Festival params={params} />
    </Suspense>
  );
}

async function Festival({ params }: Pick<PageProps<"/explore/festival/[id]">, "params">) {
  const { id } = await params;
  const row = festivalRows().find((r) => r.id === id);
  if (!row) notFound();
  return <FestivalAll row={row} />;
}
