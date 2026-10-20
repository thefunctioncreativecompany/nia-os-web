"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ComingSoonCard, comingSoonButton } from "@/components/nia/coming-soon-card";
import { useWaitlist } from "@/hooks/use-waitlist";
import { FIELD_TILES, dayRate, getListing, type Listing, type ListingImage } from "@/features/marketplace/data";

// The field (MARKETPLACE_SPEC.md §1): a 2600 × 1800 plane of about 30 product tiles behind the
// card, laid out the way the design lays them out, so the same tiles always sit in the same place.
const PLANE_W = 2600;
const PLANE_H = 1800;
const COUNT = 30;
const COLS = 6;
const MIN_W = 170;
const MAX_W = 260;
const RATIOS: [number, number][] = [[1, 1], [4, 5], [3, 4], [4, 3], [1, 1]];

type Tile = { key: string; x: number; y: number; w: number; h: number; rotate: number; listing: Listing; image: ListingImage; name: string };

const TILES: Tile[] = Array.from({ length: COUNT }, (_, i) => {
  const rows = Math.ceil(COUNT / COLS);
  const cellW = PLANE_W / COLS;
  const cellH = PLANE_H / rows;
  const w = MIN_W + ((i * 53) % 5) * ((MAX_W - MIN_W) / 4);
  const [a, b] = RATIOS[(i * 7) % 5];
  const h = (w * b) / a;
  const pick = FIELD_TILES[i % FIELD_TILES.length];
  const listing = getListing(pick.listingId);
  if (!listing) throw new Error(`Unknown listing ${pick.listingId}`);
  return {
    key: `tile-${i}`,
    x: (i % COLS) * cellW + ((i * 71) % Math.max(1, Math.round(cellW - w - 20))) + 10,
    y: Math.floor(i / COLS) * cellH + ((i * 43) % Math.max(1, Math.round(cellH - h - 20))) + 10,
    w,
    h,
    // A slight tilt, up to 1.8° either way.
    rotate: (((i * 37) % 7) - 3) * 0.6,
    listing,
    image: listing.images[pick.image] ?? listing.images[0],
    name: pick.name,
  };
});

// Marketplace, coming soon: Ika's Claude Design "MarketplaceSoon" (field version, 2026-10-20),
// held still (Ika, 2026-10-20: the panning felt clunky). The middle of the field sits behind the
// frosted card; pointing at a tile lifts it and shows its name and day rate, and every tile opens
// the store's preview. Platform font, colours, buttons and sentence case.
export function MarketplaceComingSoon() {
  const waitlist = useWaitlist("marketplace", {
    joined: "We'll let you know when Marketplace opens.",
    left: "You won't get a note when Marketplace opens.",
  });

  return (
    <section aria-label="Marketplace coming soon" className="relative isolate h-[calc(100svh-5rem)] min-h-140 overflow-hidden bg-nia-canvas">
      {/* The plane's middle under the middle of the screen. */}
      <div style={{ width: PLANE_W, height: PLANE_H, marginLeft: -PLANE_W / 2, marginTop: -PLANE_H / 2 }} className="absolute top-1/2 left-1/2">
        {TILES.map((t) => {
          const price = dayRate(t.listing);
          return (
            <Link
              key={t.key}
              href="/marketplace/preview"
              aria-label={price ? `${t.name}, ${price}` : t.name}
              style={{ left: t.x, top: t.y, width: t.w, height: t.h, rotate: `${t.rotate.toFixed(1)}deg` }}
              className="group absolute overflow-hidden rounded-xl bg-white text-foreground shadow-card outline-none transition-[scale,box-shadow] duration-lift ease-glide hover:z-[3] hover:scale-106 hover:shadow-card-hover focus-visible:z-[3] focus-visible:scale-106 focus-visible:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100"
            >
              <span aria-hidden className="absolute inset-0" style={{ padding: t.image.fit === "contain" ? `${t.image.pad ?? 10}%` : undefined }}>
                <span className="relative block size-full">
                  <Image src={t.image.src} alt="" fill sizes="260px" className={t.image.fit === "contain" ? "object-contain" : "object-cover"} />
                </span>
              </span>
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-2 flex translate-y-1.5 justify-between gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.75 text-caption font-semibold opacity-0 transition-[opacity,translate] duration-base ease-glide group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                <span className="truncate">{t.name}</span>
                {price && <span className="whitespace-nowrap">{price}</span>}
              </span>
            </Link>
          );
        })}
      </div>

      <ComingSoonCard
        status="Coming soon · Launch date TBD"
        tone="pending"
        title="Marketplace"
        titleClassName="font-extrabold tracking-tight sm:text-banner"
        bodyClassName="max-w-95"
        className="max-w-120 bg-white/90 sm:pb-9"
        note={waitlist.email && <>We&rsquo;ll email {waitlist.email} when Marketplace opens.</>}
        actions={
          <>
            {waitlist.waiting ? (
              <Button variant="outline" onClick={() => void waitlist.toggle()} aria-pressed className={comingSoonButton}>
                <Check aria-hidden /> On the waitlist
              </Button>
            ) : (
              <Button onClick={() => void waitlist.toggle()} disabled={waitlist.waiting === null} className={comingSoonButton}>
                Join the waitlist
              </Button>
            )}
            <Button variant="outline" asChild className={comingSoonButton}>
              <Link href="/marketplace/preview">
                Preview Marketplace
                <ArrowRight aria-hidden data-icon="inline-end" />
              </Link>
            </Button>
          </>
        }
      >
        Rent, buy and list production gear, vehicles and digital assets, from creators and trusted rental houses, all inside Nia.
      </ComingSoonCard>

      {/* Some tiles are Wikimedia Commons photos whose licences need a credit. */}
      <Link
        href="/marketplace/preview#credits"
        className="absolute right-4 bottom-4 z-[150] rounded-full bg-white/90 px-3 py-1.5 text-caption text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:bottom-28"
      >
        Photo credits
      </Link>
    </section>
  );
}
