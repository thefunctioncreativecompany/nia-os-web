import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { CreatorsAll } from "@/components/explore/creators-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Creators · Explore · Nia OS",
};

// View all from Explore's Creators row: every creator's film, with search, in a new order on each
// visit (Ika, 2026-10-22).
// The order is picked per request, inside a boundary so the rest of the page isn't held up.
export default function Page({ searchParams }: PageProps<"/explore/creators">) {
  return (
    <Suspense fallback={null}>
      <Shuffled searchParams={searchParams} />
    </Suspense>
  );
}

// `?tag=` comes from a tag on a film's page and narrows the list to it.
async function Shuffled({ searchParams }: Pick<PageProps<"/explore/creators">, "searchParams">) {
  await connection();
  const { tag } = await searchParams;
  return <CreatorsAll seed={newSeed()} tag={typeof tag === "string" ? tag : undefined} />;
}
