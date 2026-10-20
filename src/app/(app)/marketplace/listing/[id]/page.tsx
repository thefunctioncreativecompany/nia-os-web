import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingDetail } from "@/components/marketplace/listing-detail";
import { LISTINGS, getListing } from "@/features/marketplace/data";

// Sample listings are known ahead of time, so each page is drawn once at build.
export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/marketplace/listing/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  return { title: listing ? `${listing.title} · Marketplace · Nia OS` : "Marketplace · Nia OS" };
}

// A Marketplace listing (MARKETPLACE_SPEC.md §3).
export default function Page({ params }: PageProps<"/marketplace/listing/[id]">) {
  return (
    <Suspense>
      <Listing params={params} />
    </Suspense>
  );
}

async function Listing({ params }: Pick<PageProps<"/marketplace/listing/[id]">, "params">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} />;
}
