import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Checkout } from "@/components/marketplace/checkout";
import { getListing } from "@/features/marketplace/data";

export const metadata: Metadata = {
  title: "Checkout · Marketplace · Nia OS",
};

// Marketplace checkout (MARKETPLACE_SPEC.md §4), opened from a listing:
// ?listing=<id>&mode=rent|buy&from=YYYY-MM-DD&to=YYYY-MM-DD.
export default function Page({ searchParams }: PageProps<"/marketplace/checkout">) {
  return (
    <Suspense>
      <CheckoutPage searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutPage({ searchParams }: Pick<PageProps<"/marketplace/checkout">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  const listing = getListing(one(params.listing) ?? "");
  if (!listing) notFound();
  return <Checkout listing={listing} mode={one(params.mode) === "buy" ? "buy" : "rent"} from={one(params.from)} to={one(params.to)} />;
}
