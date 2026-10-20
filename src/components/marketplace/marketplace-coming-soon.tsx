"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { features } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { ComingSoonCard, comingSoonButton } from "@/components/nia/coming-soon-card";
import { FINE_POINTER, isMouse, pointerIn, useFrame, useMediaQuery } from "@/hooks/use-pointer";
import { useWaitlist } from "@/hooks/use-waitlist";
import { FIELD_TILES, dayRate, getListing, type Listing, type ListingImage } from "@/features/marketplace/data";

// The field (MARKETPLACE_SPEC.md §1): a 2600 × 1800 plane of about 30 product tiles behind the
// screen, laid out the way the design lays them out, so the same tiles always sit in the same place.
const PLANE_W = 2600;
const PLANE_H = 1800;
const COUNT = 30;
const COLS = 6;
const MIN_W = 170;
const MAX_W = 260;
const RATIOS: [number, number][] = [[1, 1], [4, 5], [3, 4], [4, 3], [1, 1]];
// The mini-map is 180 wide, the plane drawn to scale inside it.
const MAP_W = 180;
const MAP_SCALE = MAP_W / PLANE_W;

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
    x: Math.floor(i % COLS) * cellW + ((i * 71) % Math.max(1, Math.round(cellW - w - 20))) + 10,
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

// The design's easing: the middle of the screen pans fastest, and the edges reach the plane's
// edges a little before the pointer does.
const ease = (v: number) => Math.max(0, Math.min(1, (v - 0.5) * 1.25 + 0.5));
const unease = (e: number) => (e - 0.5) / 1.25 + 0.5;

// Marketplace, coming soon: Ika's Claude Design "MarketplaceSoon" (field version, 2026-10-20).
// Product tiles on a plane bigger than the screen; moving the pointer looks around it, a mini-map
// in the corner shows where you are. Pointing at a tile lifts it and shows its name and day rate.
// The frosted card stays in the middle. Phones and tablets swipe around the field instead;
// reduced motion keeps the plane still. Platform font, colours, buttons and sentence case.
export function MarketplaceComingSoon() {
  const reduce = useReducedMotion();
  const fine = useMediaQuery(FINE_POINTER);
  // With a mouse the field follows it; on a touch screen people scroll it themselves.
  const pan = fine && !reduce;
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useFrame();
  const [size, setSize] = useState({ w: 1440, h: 920 });
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const waitlist = useWaitlist("marketplace", {
    joined: "We'll let you know when Marketplace opens.",
    left: "You won't get a note when Marketplace opens.",
  });
  const listers = useWaitlist("marketplace-lister", {
    joined: "We'll invite you to list your gear before Marketplace opens.",
    left: "You're off the early listers list.",
  });

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Touch screens start in the middle of the field.
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el || fine) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [fine]);

  const spareX = Math.max(0, PLANE_W - size.w);
  const spareY = Math.max(0, PLANE_H - size.h);
  const at = pan ? pointer : { x: 0.5, y: 0.5 };
  const tx = -ease(at.x) * spareX;
  const ty = -ease(at.y) * spareY;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pan || !isMouse(e)) return;
    const { fx, fy } = pointerIn(e);
    frame.next(() => setPointer({ x: fx, y: fy }));
  };

  // Tabbing to a tile brings it to the middle, as the pointer would.
  const focusTile = (t: Tile) => {
    if (!pan) return;
    const want = (centre: number, view: number, spare: number) => (spare ? unease(Math.max(0, Math.min(1, (centre - view / 2) / spare))) : 0.5);
    setPointer({ x: want(t.x + t.w / 2, size.w, spareX), y: want(t.y + t.h / 2, size.h, spareY) });
  };

  // While Marketplace is closed, every tile opens the store's preview.
  const hrefFor = (l: Listing) => (features.marketplaceUnlocked ? `/marketplace/listing/${l.id}` : "/marketplace/preview");

  return (
    <section aria-label="Marketplace coming soon" className="relative isolate h-[calc(100svh-5rem)] min-h-140 overflow-hidden bg-nia-canvas">
      <div
        ref={viewport}
        onPointerMove={onMove}
        // Tabbing makes the browser scroll a clipped field to the tile; the plane moves instead.
        onScroll={(e) => {
          if (!fine) return;
          e.currentTarget.scrollLeft = 0;
          e.currentTarget.scrollTop = 0;
        }}
        className={cn("absolute inset-0", fine ? "overflow-hidden" : "overflow-auto overscroll-contain [scrollbar-width:none]")}
      >
        <div
          style={{ width: PLANE_W, height: PLANE_H, transform: fine ? `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)` : undefined }}
          className="relative transition-transform duration-pan ease-glide"
        >
          {TILES.map((t) => {
            const price = dayRate(t.listing);
            return (
              <Link
                key={t.key}
                href={hrefFor(t.listing)}
                onFocus={() => focusTile(t)}
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
      </div>

      <ComingSoonCard
        status="Coming soon · Launch date TBD"
        tone="pending"
        title="Marketplace"
        titleClassName="font-extrabold tracking-tight sm:text-banner"
        bodyClassName="max-w-95"
        className="max-w-120 bg-white/90 sm:pb-9"
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
            <Button
              variant="outline"
              onClick={() => void listers.toggle()}
              disabled={listers.waiting === null}
              aria-pressed={!!listers.waiting}
              className={comingSoonButton}
            >
              {listers.waiting && <Check aria-hidden />}
              {listers.waiting ? "We'll invite you to list" : "List your gear early"}
            </Button>
          </>
        }
      >
        Rent, buy and list production gear, vehicles and digital assets, from creators and trusted rental houses, all inside Nia.
      </ComingSoonCard>

      {(pan || !fine) && (
        <p aria-hidden className="pointer-events-none absolute bottom-6 left-6 z-[150] inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-caption font-semibold text-muted-foreground max-sm:bottom-28">
          {fine ? "Move your cursor to look around" : "Swipe to look around"}
          <span className="animate-nudge">→</span>
        </p>
      )}

      {fine && (
        <div
          aria-hidden
          style={{ height: PLANE_H * MAP_SCALE }}
          className="pointer-events-none absolute right-6 bottom-6 z-[150] w-45 overflow-hidden rounded-lg border border-border bg-white/90"
        >
          {TILES.map((t) => (
            <span
              key={t.key}
              className="absolute rounded-xs bg-nia-line-strong"
              style={{ left: t.x * MAP_SCALE, top: t.y * MAP_SCALE, width: t.w * MAP_SCALE, height: t.h * MAP_SCALE }}
            />
          ))}
          <span
            className="absolute top-0 left-0 rounded-sm border-2 border-foreground transition-transform duration-pan ease-glide"
            style={{
              width: Math.min(size.w, PLANE_W) * MAP_SCALE,
              height: Math.min(size.h, PLANE_H) * MAP_SCALE,
              transform: `translate(${(-tx * MAP_SCALE).toFixed(1)}px, ${(-ty * MAP_SCALE).toFixed(1)}px)`,
            }}
          />
        </div>
      )}
    </section>
  );
}
