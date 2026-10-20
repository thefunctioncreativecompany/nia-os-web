import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FleetBooking } from "@/components/marketplace/fleet-booking";
import { LISTINGS, getListing, type Listing } from "@/features/marketplace/data";

const hasFleet = (l: Listing | null): l is Listing & { fleet: NonNullable<Listing["fleet"]> } => !!l?.fleet;

export function generateStaticParams() {
  return LISTINGS.filter(hasFleet).map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/marketplace/fleet/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  return { title: hasFleet(listing) ? `${listing.fleet.title} · Marketplace · Nia OS` : "Marketplace · Nia OS" };
}

// Fleet booking (MARKETPLACE_SPEC.md §6), for listings that rent as a fleet.
export default function Page({ params }: PageProps<"/marketplace/fleet/[id]">) {
  return (
    <Suspense>
      <Fleet params={params} />
    </Suspense>
  );
}

async function Fleet({ params }: Pick<PageProps<"/marketplace/fleet/[id]">, "params">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!hasFleet(listing)) notFound();
  return <FleetBooking listing={listing} />;
}
