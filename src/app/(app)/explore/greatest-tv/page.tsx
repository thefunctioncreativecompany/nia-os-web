import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Greatest TV · Explore · Nia OS",
};

// View all for Greatest TV (2026-11-08): every series, by collection; the same page as Made in
// Africa's and Hollywood Classics' View all, in a new order on each visit.
// The order is picked per request, inside a boundary so the rest of the page isn't held up.
export default function Page({ searchParams }: PageProps<"/explore/greatest-tv">) {
  return (
    <Suspense fallback={null}>
      <Shuffled searchParams={searchParams} />
    </Suspense>
  );
}

// `?tag=` comes from a tag on a film's page and narrows the list to it.
async function Shuffled({ searchParams }: Pick<PageProps<"/explore/greatest-tv">, "searchParams">) {
  await connection();
  const { tag } = await searchParams;
  return <MadeInAfricaAll seed={newSeed()} tag={typeof tag === "string" ? tag : undefined} category="greatest-tv" />;
}
