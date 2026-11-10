import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudioAll } from "@/components/explore/studio-all";
import { studioRows } from "@/features/explore/studios";

// A studio's View all (Ika, 2026-11-10), opened from its logo under Top 10 on Explore. The studios
// and their titles are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return studioRows().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/explore/studio/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = studioRows().find((r) => r.id === id);
  return { title: row ? `${row.name} · Explore · Nia OS` : "Explore · Nia OS" };
}

// Reading the address waits inside a boundary, so the rest of the page isn't held up.
export default function Page({ params }: PageProps<"/explore/studio/[id]">) {
  return (
    <Suspense fallback={null}>
      <Studio params={params} />
    </Suspense>
  );
}

async function Studio({ params }: Pick<PageProps<"/explore/studio/[id]">, "params">) {
  const { id } = await params;
  const row = studioRows().find((r) => r.id === id);
  if (!row) notFound();
  return <StudioAll row={row} />;
}
