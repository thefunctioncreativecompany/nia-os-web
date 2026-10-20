"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MapPin, PackageSearch, Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DriftColumns } from "@/components/nia/drift-columns";
import { EmptyState } from "@/components/nia/empty-state";
import {
  BRANDS,
  CATEGORIES,
  LISTINGS,
  buyEstimate,
  buyLine,
  dayRate,
  getProvider,
  listerLine,
  type Category,
  type Condition,
  type Listing,
} from "@/features/marketplace/data";
import { MarketplaceNav } from "./marketplace-nav";

type Mode = "rent" | "buy";

// Latest gear columns, as designed: how far each drifts with the pointer, and the odd columns'
// head start.
const DRIFT = [-50, 40, -80, 30, -45];
const ODD_OFFSET = -40;
const CONDITIONS: ("Any" | Condition)[] = ["Any", "New", "Used", "Kit"];
const MAX_DAY_RATE = 150;

const chip =
  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-small font-semibold text-foreground outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50";

// Marketplace home (MARKETPLACE_SPEC.md §2, Ika's Claude Design "Marketplace"): the heading with a
// Rent / Buy switch, search with the location, one compact filter bar (Category, Condition,
// Filters, and how many items match), the brands line, then Latest gear in columns that drift
// with the pointer. Sample data until Marketplace reads from Supabase.
export function MarketplaceHome() {
  const [mode, setMode] = useState<Mode>("rent");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Category>("All");
  const [condition, setCondition] = useState<"Any" | Condition>("Any");
  const [delivery, setDelivery] = useState(false);
  const [verified, setVerified] = useState(false);
  const [maxRate, setMaxRate] = useState(MAX_DAY_RATE);
  const extraFilters = [delivery, verified, maxRate < MAX_DAY_RATE].filter(Boolean).length;

  const gear = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LISTINGS.filter((l) => l.kind === "gear")
      .filter((l) => category === "All" || l.category === category)
      .filter((l) => condition === "Any" || l.condition === condition)
      .filter((l) => !q || [l.title, l.brand, l.category].some((s) => s.toLowerCase().includes(q)))
      .filter((l) => !delivery || l.delivery)
      .filter((l) => !verified || getProvider(l.providerId).verified)
      .filter((l) => maxRate >= MAX_DAY_RATE || (l.rentPerDay ?? 0) <= maxRate);
  }, [query, category, condition, delivery, verified, maxRate]);

  const clear = () => {
    setQuery("");
    setCategory("All");
    setCondition("Any");
    setDelivery(false);
    setVerified(false);
    setMaxRate(MAX_DAY_RATE);
  };

  const resultLine = `${gear.length} ${gear.length === 1 ? "item" : "items"} · ${mode === "rent" ? "For rent" : "For sale"} near Boston`;

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="browse" />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h1 font-extrabold tracking-tight text-foreground sm:text-display">Marketplace</h1>
        <div role="group" aria-label="Rent or buy" className="inline-flex rounded-full bg-accent p-1">
          {(["rent", "buy"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "h-9 rounded-full px-4.5 text-small font-semibold text-foreground outline-none transition-[background-color,box-shadow] duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                mode === m ? "bg-white shadow-card" : "hover:bg-white/60",
              )}
            >
              {m === "rent" ? "Rent" : "Buy"}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5.5 flex h-14 items-center gap-3 rounded-full border border-border px-5 text-lead text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50">
        <Search aria-hidden className="size-4.5 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the marketplace"
          placeholder="Search cameras, drones, vans, LUTs…"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-nia-placeholder"
        />
        <span className="inline-flex shrink-0 items-center gap-1.5 border-l border-border pl-3.5 text-small text-muted-foreground max-sm:hidden">
          <MapPin aria-hidden className="size-3.5" />
          Boston, MA
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(chip, category === "All" ? "border-border bg-white hover:border-ring" : "border-foreground bg-secondary")}>
              <span className="font-medium text-muted-foreground">Category</span>
              {category}
              <ChevronDown aria-hidden className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(32.5rem,calc(100vw-2rem))] rounded-2xl p-2">
            <DropdownMenuRadioGroup value={category} onValueChange={(v) => setCategory(v as "All" | Category)} className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {CATEGORIES.map((c) => (
                <DropdownMenuRadioItem key={c} value={c} className="h-10 rounded-lg text-sm data-[state=checked]:bg-accent data-[state=checked]:font-semibold">
                  {c}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(chip, condition === "Any" ? "border-border bg-white hover:border-ring" : "border-foreground bg-secondary")}>
              <span className="font-medium text-muted-foreground">Condition</span>
              {condition}
              <ChevronDown aria-hidden className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 rounded-2xl p-2">
            <DropdownMenuRadioGroup value={condition} onValueChange={(v) => setCondition(v as "Any" | Condition)}>
              {CONDITIONS.map((c) => (
                <DropdownMenuRadioItem key={c} value={c} className="h-10 rounded-lg text-sm data-[state=checked]:bg-accent data-[state=checked]:font-semibold">
                  {c}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn(chip, extraFilters ? "border-foreground bg-secondary" : "border-border bg-white hover:border-ring")}>
              <SlidersHorizontal aria-hidden className="size-3.5" />
              Filters{extraFilters ? ` · ${extraFilters}` : ""}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-72 flex-col gap-5 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="mk-delivery" className="text-sm font-medium">Delivery available</Label>
              <Switch id="mk-delivery" checked={delivery} onCheckedChange={setDelivery} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="mk-verified" className="text-sm font-medium">Verified listers</Label>
              <Switch id="mk-verified" checked={verified} onCheckedChange={setVerified} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="mk-rate" className="text-sm font-medium">Day rate</Label>
                <span className="text-small text-muted-foreground">{maxRate >= MAX_DAY_RATE ? "Any" : `Up to $${maxRate}`}</span>
              </div>
              <Slider id="mk-rate" aria-label="Highest day rate" min={5} max={MAX_DAY_RATE} step={5} value={[maxRate]} onValueChange={(v) => setMaxRate(v[0] ?? MAX_DAY_RATE)} />
            </div>
            {extraFilters > 0 && (
              <Button variant="outline" size="compact" onClick={() => { setDelivery(false); setVerified(false); setMaxRate(MAX_DAY_RATE); }}>
                Clear filters
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <span className="flex-1" />
        <span aria-live="polite" className="text-small text-muted-foreground">{resultLine}</span>
      </div>

      <p className="mt-4.5 text-small text-muted-foreground">Brands you&rsquo;ll find: {BRANDS.join(" · ")}</p>

      <div className="mt-16 flex items-baseline justify-between">
        <h2 className="text-subtitle font-extrabold tracking-tight text-foreground">Latest gear</h2>
      </div>

      {gear.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={PackageSearch}
            message={category === "Vehicles & Fleet" || category === "Digital products" ? `${category} have their own section below Latest gear.` : "No gear matches these filters."}
            action={<Button variant="outline" onClick={clear}>Clear filters</Button>}
          />
        </div>
      ) : (
        <DriftColumns
          label="Latest gear"
          items={gear}
          getKey={(l) => l.id}
          renderItem={(l) => <GearCard listing={l} mode={mode} />}
          drift={DRIFT}
          oddOffset={ODD_OFFSET}
          className="mt-4.5 lg:h-250 lg:overflow-hidden"
          gridClassName="grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:gap-4 lg:pt-15"
          columnClassName="lg:gap-4.5"
        />
      )}
    </div>
  );
}

// A photo tile with the condition, then the name and price; under them the category and, in Rent
// mode, what buying it costs (in Buy mode, who lists it). Lifts on hover or focus.
function GearCard({ listing: l, mode }: { listing: Listing; mode: Mode }) {
  const image = l.images[0];
  const price = mode === "rent" ? dayRate(l) : (buyEstimate(l) ?? "Rent only");
  const sub = mode === "rent" ? buyLine(l) : listerLine(l);
  return (
    <Link
      href={`/marketplace/listing/${l.id}`}
      aria-label={`${l.title}, ${price}`}
      className="group block rounded-xl text-foreground outline-none transition-transform duration-lift ease-glide hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <span style={{ aspectRatio: l.aspect ?? "4 / 3" }} className="relative block overflow-hidden rounded-xl bg-nia-canvas transition-shadow duration-lift ease-glide group-hover:shadow-card-hover group-focus-visible:shadow-card-hover">
        {image && (
          <span className="absolute inset-0" style={{ padding: image.fit === "contain" ? `${image.pad ?? 8}%` : undefined }}>
            <span className="relative block size-full transition-transform duration-strip ease-glide group-hover:scale-105 motion-reduce:group-hover:scale-100">
              <Image src={image.src} alt="" fill sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 50vw" className={image.fit === "contain" ? "object-contain" : "object-cover"} />
            </span>
          </span>
        )}
        {l.condition && (
          <span className="absolute top-2.5 left-2.5 inline-flex h-5.5 items-center rounded-full bg-white/90 px-2 text-micro font-semibold">{l.condition}</span>
        )}
      </span>
      <span className="mt-2.5 flex justify-between gap-2.5 text-lead font-bold">
        <span className="min-w-0">{l.title}</span>
        <span className="whitespace-nowrap">{price}</span>
      </span>
      <span className="mt-0.5 flex justify-between gap-2.5 text-caption text-muted-foreground">
        <span className="min-w-0 truncate">{l.category}</span>
        <span className="whitespace-nowrap">{sub}</span>
      </span>
    </Link>
  );
}
