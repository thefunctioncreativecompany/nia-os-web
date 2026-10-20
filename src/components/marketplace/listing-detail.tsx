"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { features } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";
import { buyEstimate, depositFor, getProvider, initials, marketplaceHome, specLine, type Listing } from "@/features/marketplace/data";
import { formatMoney, rentalDays, toCents } from "@/features/marketplace/fees";
import { DigitalIcon } from "./digital-icon";
import { MarketplaceNav } from "./marketplace-nav";

type Mode = "rent" | "buy";

const DAY_MS = 86_400_000;
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const noSubscribe = () => () => {};

// Today, once the page is in the browser (the page itself is drawn without a clock).
function useToday() {
  const key = useSyncExternalStore(noSubscribe, () => isoDay(new Date()), () => null);
  return key ? fromIso(key) : undefined;
}

// A listing (MARKETPLACE_SPEC.md §3, "focus viewer"): photos on the left, a thumbnail rail beside
// them (pointing at or choosing one crossfades the big picture, which drifts a little with the
// pointer); on the right the name and specs, who lists it, Rent or Buy, pickup and return, the
// price with the deposit hold, and Continue to checkout. Digital products show their tile and a
// one-off price instead.
export function ListingDetail({ listing: l }: { listing: Listing }) {
  const provider = getProvider(l.providerId);
  const digital = l.kind === "digital";
  const canRent = !!l.rentPerDay;
  const canBuy = !!l.buyPrice;
  const [mode, setMode] = useState<Mode>(canRent ? "rent" : "buy");
  // Until someone picks dates: pickup tomorrow, return three days later.
  const today = useToday();
  const [picked, setRange] = useState<DateRange | undefined>(undefined);
  const tomorrow = today ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) : undefined;
  const range = picked ?? (tomorrow ? { from: tomorrow, to: new Date(tomorrow.getTime() + 3 * DAY_MS) } : undefined);

  const days = range?.from && range.to ? rentalDays(range.from, range.to) : null;
  const rental = days && l.rentPerDay ? toCents(l.rentPerDay) * days : null;
  const deposit = depositFor(l);
  const home = marketplaceHome(features.marketplaceUnlocked);

  const checkout = new URLSearchParams({ listing: l.id, mode: digital ? "buy" : mode });
  if (!digital && mode === "rent" && range?.from && range.to) {
    checkout.set("from", isoDay(range.from));
    checkout.set("to", isoDay(range.to));
  }

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="browse" />

      <nav aria-label="Breadcrumb" className="mt-8 flex flex-wrap items-center gap-1 text-small text-muted-foreground">
        <Link href={home} className="rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">Marketplace</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span>{l.category}</span>
        <ChevronRight aria-hidden className="size-3.5" />
        <span aria-current="page" className="text-foreground">{l.title}</span>
      </nav>

      <div className="mt-4.5 flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_35rem]">{digital ? <DigitalTile listing={l} /> : <FocusViewer listing={l} />}</div>

        <div className="flex min-w-0 flex-[1_1_23.75rem] flex-col gap-4.5">
          <div>
            <p className="text-small text-muted-foreground">
              {l.brand} · {l.category}
            </p>
            <h1 className="mt-1.5 text-h1 font-extrabold tracking-tight text-foreground">{l.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{digital ? `${l.productType} · Instant download · licence included` : specLine(l)}</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border p-3.5">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-small font-bold">{initials(provider.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{provider.name}</span>
              <span className="block text-caption text-muted-foreground">
                {provider.type === "partner" ? "Rental partner" : "Verified creator"} · {provider.city}
              </span>
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} aria-disabled="true" className="cursor-not-allowed rounded-sm text-small font-semibold text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  Message
                </span>
              </TooltipTrigger>
              <TooltipContent>Messages come with Inbox</TooltipContent>
            </Tooltip>
          </div>

          {digital ? (
            <div className="rounded-xl border-2 border-foreground p-3.5">
              <span className="block text-caption text-muted-foreground">Buy once</span>
              <span className="text-h3 font-extrabold">${l.price}</span>
            </div>
          ) : (
            <div role="group" aria-label="Rent or buy" className="grid grid-cols-2 gap-2.5">
              <OptionCard on={mode === "rent"} disabled={!canRent} onClick={() => setMode("rent")} label="Rent">
                {l.rentPerDay ? (
                  <>
                    ${l.rentPerDay}
                    <span className="text-small font-medium text-muted-foreground">/{l.perUnit ? "unit/day" : "day"}</span>
                  </>
                ) : (
                  "Not for rent"
                )}
              </OptionCard>
              <OptionCard on={mode === "buy"} disabled={!canBuy} onClick={() => setMode("buy")} label={l.condition === "New" ? "Buy new" : l.condition === "Used" ? "Buy used" : "Buy"}>
                {buyEstimate(l) ?? <span className="text-lead font-semibold text-muted-foreground">Rent only</span>}
              </OptionCard>
            </div>
          )}

          {!digital && mode === "rent" && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Choose pickup and return dates"
                  className="grid grid-cols-2 overflow-hidden rounded-xl border border-border text-left outline-none transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="border-r border-border px-3.5 py-3">
                    <span className="block text-micro font-semibold text-muted-foreground">Pick up</span>
                    <span className="text-sm font-semibold">{range?.from ? shortDate(range.from) : "Choose a day"}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <span>
                      <span className="block text-micro font-semibold text-muted-foreground">Return</span>
                      <span className="text-sm font-semibold">{range?.to ? shortDate(range.to) : "Choose a day"}</span>
                    </span>
                    <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto rounded-2xl p-3">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  today={today}
                  defaultMonth={range?.from}
                  disabled={tomorrow ? { before: tomorrow } : undefined}
                  className="[--cell-size:2.5rem]"
                />
              </PopoverContent>
            </Popover>
          )}

          <div className="flex flex-col gap-2 text-sm">
            {digital ? (
              <PriceRow label="Price" value={formatMoney(toCents(l.price ?? 0))} />
            ) : mode === "rent" ? (
              <>
                <PriceRow
                  label={days && l.rentPerDay ? `$${l.rentPerDay} × ${days} ${days === 1 ? "day" : "days"}` : "Rental"}
                  value={rental !== null ? formatMoney(rental) : "Choose dates"}
                />
                <PriceRow label="Refundable deposit hold" value={formatMoney(toCents(deposit))} />
              </>
            ) : (
              <PriceRow label="Price (estimate)" value={buyEstimate(l) ?? "—"} />
            )}
            <span className="text-caption text-nia-placeholder">
              {digital || mode === "buy" ? "Processing is shown at checkout." : "Fees and protection are shown at checkout."}
            </span>
          </div>

          {!digital && mode === "rent" && !days ? (
            <Button size="lg" disabled className="h-13 rounded-full text-lead">
              Choose dates to continue
            </Button>
          ) : (
            <Button asChild size="lg" className="h-13 rounded-full text-lead">
              <Link href={`/marketplace/checkout?${checkout.toString()}`}>{digital ? "Buy and download" : mode === "rent" ? "Continue to checkout" : "Continue to buy"}</Link>
            </Button>
          )}

          <ul className="flex flex-wrap gap-2 text-caption text-muted-foreground">
            {(digital
              ? ["Instant download", "Licence included", "Secure payment"]
              : ["Free cancellation up to 48h", l.delivery ? "Pickup or local delivery" : "Pickup", "Cleaned & checked"]
            ).map((t) => (
              <li key={t} className="rounded-full bg-muted px-2.5 py-1.5">{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ on, disabled, onClick, label, children }: { on: boolean; disabled: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl bg-white p-3.5 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        on ? "border-2 border-foreground" : "border border-border hover:border-ring",
      )}
    >
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-h3 font-extrabold">{children}</span>
    </button>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </span>
  );
}

// The photos: a rail of thumbnails, and the big picture that crossfades between them and drifts a
// little with the pointer. Hovering, focusing or choosing a thumbnail shows it. Reduced motion
// keeps the picture still.
function FocusViewer({ listing: l }: { listing: Listing }) {
  const reduce = useReducedMotion();
  const frame = useFrame();
  const [shown, setShown] = useState(0);
  const [at, setAt] = useState({ x: 0.5, y: 0.5 });
  const images = l.images;
  const many = images.length > 1;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !isMouse(e)) return;
    const { fx, fy } = pointerIn(e);
    frame.next(() => setAt({ x: fx, y: fy }));
  };

  return (
    <div className="flex flex-col-reverse gap-3.5 sm:flex-row">
      {many && (
        <div role="group" aria-label="Photos" className="flex shrink-0 gap-2.5 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              aria-label={`Show photo ${i + 1}: ${img.alt}`}
              aria-pressed={i === shown}
              onPointerEnter={(e) => isMouse(e) && setShown(i)}
              onFocus={() => setShown(i)}
              onClick={() => setShown(i)}
              className={cn(
                "relative size-19 overflow-hidden rounded-lg bg-nia-canvas outline-none transition-transform duration-base ease-glide hover:-translate-y-0.75 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0",
                i === shown && "ring-2 ring-foreground ring-offset-2",
              )}
            >
              <Image src={img.src} alt="" fill sizes="76px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div
        onPointerMove={onMove}
        onPointerLeave={() => {
          frame.cancel();
          setAt({ x: 0.5, y: 0.5 });
        }}
        className="relative aspect-square max-h-160 min-w-0 flex-1 overflow-hidden rounded-2xl bg-nia-canvas"
      >
        <div
          className="absolute -inset-[4%] transition-transform duration-zoom ease-glide"
          style={{ transform: `translate3d(${((0.5 - at.x) * 24).toFixed(1)}px, ${((0.5 - at.y) * 24).toFixed(1)}px, 0)` }}
        >
          {images.map((img, i) => (
            <span
              key={img.src + i}
              aria-hidden={i !== shown}
              className={cn(
                "absolute inset-0 transition-[opacity,scale] duration-settle ease-glide",
                i === shown ? "scale-100 opacity-100" : "scale-106 opacity-0",
              )}
              style={{ padding: img.fit === "contain" ? `${(img.pad ?? 8) + 4}%` : undefined }}
            >
              <span className="relative block size-full">
                <Image src={img.src} alt={img.alt} fill priority={i === 0} sizes="(min-width: 64rem) 50vw, 100vw" className={img.fit === "contain" ? "object-contain" : "object-cover"} />
              </span>
            </span>
          ))}
        </div>
        {many && (
          <span className="absolute bottom-3.5 left-4 inline-flex h-6.5 items-center rounded-full bg-white/90 px-2.5 text-caption font-semibold">
            {shown + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

function DigitalTile({ listing: l }: { listing: Listing }) {
  return (
    <div className={cn("grid aspect-square max-h-160 place-items-center rounded-2xl", l.grain)}>
      <DigitalIcon listing={l} className="size-20" strokeWidth={1.25} />
    </div>
  );
}
