import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { MadeInAfricaAll } from "@/components/explore/made-in-africa-all";
import { newSeed } from "@/lib/shuffle";

export const metadata: Metadata = {
  title: "Hollywood Classics · Explore · Nia OS",
};

// View all for Hollywood Classics (Ika, 2026-10-29): every title, by collection, with an Essentials
// filter; the same page as Made in Africa's View all, in a new order on each visit.
// The order is picked per request, inside a boundary so the rest of the page isn't held up.
export default function Page({ searchParams }: PageProps<"/explore/hollywood-classics">) {
  return (
    <Suspense fallback={null}>
      <Shuffled searchParams={searchParams} />
    </Suspense>
  );
}

// `?tag=` comes from a tag on a film's page and narrows the list to it.
async function Shuffled({ searchParams }: Pick<PageProps<"/explore/hollywood-classics">, "searchParams">) {
  await connection();
  const { tag } = await searchParams;
  return <MadeInAfricaAll seed={newSeed()} tag={typeof tag === "string" ? tag : undefined} category="hollywood-classics" />;
}
