"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { NotYet } from "@/components/nia/not-yet";
import { CATEGORIES, type Category } from "@/features/marketplace/data";
import { formatMoney, toCents } from "@/features/marketplace/fees";
import { MarketplaceNav } from "./marketplace-nav";

const CONDITIONS = ["New", "Used · Excellent", "Used · Good", "Used · Fair"] as const;
const AVAILABILITY = ["Weekdays + weekends", "Weekdays only", "Weekends only"] as const;
// The service fee renters pay on top, across the plans (Plans page).
const FEES = PLANS.map((p) => Number.parseFloat(p.gearFee));
const FEE_RANGE = `${Math.min(...FEES)}–${Math.max(...FEES)}%`;

type Photo = { id: string; url: string; name: string };

// List your gear (MARKETPLACE_SPEC.md §5, Ika's Claude Design): photos with an "Add photos" tile,
// the eight details, what the listing offers (rent, sell, pickup, delivery, ID check), and a dark
// earnings card: rented days a month × the day rate, what the lister keeps (all of it) and
// "Publish listing". Publishing opens with Marketplace, so nothing is saved yet; photos stay on
// this computer.
export function ListGear() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [condition, setCondition] = useState<string>("");
  const [dayRate, setDayRate] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [replacement, setReplacement] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState<string>(AVAILABILITY[0]);
  const [offers, setOffers] = useState({ rent: true, sell: false, pickup: true, delivery: false, idCheck: true });
  const [days, setDays] = useState(8);
  const ids = { item: useId(), category: useId(), condition: useId(), rate: useId(), sale: useId(), replacement: useId(), location: useId(), availability: useId() };

  // Photo previews live only as long as the page.
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const addPhotos = (files: FileList | null) => {
    const next = [...(files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 8 - photos.length).map((f) => {
      const url = URL.createObjectURL(f);
      urls.current.push(url);
      return { id: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`, url, name: f.name };
    });
    setPhotos((p) => [...p, ...next]);
  };

  const rate = Number(dayRate) || 0;
  const monthly = toCents(rate) * days;
  const missing = [
    !item.trim() && "the item",
    !category && "a category",
    !condition && "its condition",
    offers.rent && !rate && "a day rate",
    offers.sell && !Number(salePrice) && "a sale price",
    !offers.rent && !offers.sell && "rent or sell",
    photos.length === 0 && "a photo",
  ].filter(Boolean) as string[];

  const toggle = (key: keyof typeof offers) => setOffers((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="dashboard" />
      <h1 className="mt-8 text-h1 font-extrabold tracking-tight text-foreground">List your gear</h1>
      <p className="mt-2 max-w-140 text-lead text-muted-foreground">Earn from kit you&rsquo;re not using. You set the price; renters pay Nia&rsquo;s service fee on top.</p>

      <div className="mt-7 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <span key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-nia-canvas">
                <Image src={p.url} alt={i === 0 ? `${item || "Listing"} photo` : ""} fill unoptimized sizes="200px" className="object-cover" />
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => setPhotos((all) => all.filter((x) => x.id !== p.id))}
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </span>
            ))}
            {photos.length < 8 && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-nia-line-strong text-small font-semibold text-muted-foreground outline-none transition-colors duration-fast hover:border-ring hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ImagePlus aria-hidden className="size-5" />
                Add photos
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={ids.item} label="Item">
              <Input id={ids.item} value={item} onChange={(e) => setItem(e.target.value)} placeholder="Sony FX3 (body)" />
            </Field>
            <Field id={ids.category} label="Category">
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id={ids.category} className="w-full"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c): c is Category => c !== "All").map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={ids.condition} label="Condition">
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger id={ids.condition} className="w-full"><SelectValue placeholder="Choose its condition" /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={ids.rate} label="Rental price, per day">
              <Money id={ids.rate} value={dayRate} onChange={setDayRate} placeholder="85" disabled={!offers.rent} />
            </Field>
            <Field id={ids.sale} label="Sale price (optional)">
              <Money id={ids.sale} value={salePrice} onChange={setSalePrice} placeholder="3,100" disabled={!offers.sell} />
            </Field>
            <Field id={ids.replacement} label="Replacement value">
              <Money id={ids.replacement} value={replacement} onChange={setReplacement} placeholder="3,900" />
            </Field>
            <Field id={ids.location} label="Location">
              <Input id={ids.location} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Back Bay, Boston" />
            </Field>
            <Field id={ids.availability} label="Availability">
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger id={ids.availability} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div role="group" aria-label="What this listing offers" className="flex flex-wrap gap-2">
            {(
              [
                ["rent", "Rent"],
                ["sell", "Sell"],
                ["pickup", "Pickup"],
                ["delivery", "Local delivery"],
                ["idCheck", "Require ID check"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={offers[key]}
                onClick={() => toggle(key)}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-small font-semibold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                  offers[key] ? "border-foreground bg-foreground text-primary-foreground" : "border-border bg-white text-foreground hover:border-ring",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <aside aria-label="Earnings estimate" className="flex min-w-0 flex-[1_1_22.5rem] flex-col gap-5 rounded-2xl bg-primary p-6 text-primary-foreground lg:sticky lg:top-6">
          <div>
            <span className="text-caption font-semibold text-primary-foreground/70">Estimated monthly earnings</span>
            <p className="mt-1 text-display leading-none font-extrabold">{formatMoney(monthly).replace(".00", "")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="mk-days" className="text-small font-medium text-primary-foreground/85">
              Rented days per month: {days}
            </Label>
            <Slider
              id="mk-days"
              aria-label="Rented days per month"
              min={1}
              max={20}
              step={1}
              value={[days]}
              onValueChange={(v) => setDays(v[0] ?? 8)}
              // White on the dark card.
              className="[&_[data-slot=slider-range]]:bg-primary-foreground [&_[data-slot=slider-thumb]]:border-primary-foreground [&_[data-slot=slider-track]]:bg-primary-foreground/25"
            />
          </div>
          <div className="flex flex-col gap-2 border-t border-primary-foreground/15 pt-4 text-sm">
            <Row label="Your price" value={rate ? `$${rate}/day` : "Set a day rate"} />
            <Row label="You keep" value="100% of your price" />
            <Row label="Renter pays on top" value={`${FEE_RANGE} service fee + processing`} />
            <Row label="Payouts" value="To your bank, after each return" />
          </div>
          {/* Greyed out until listings can be published (Marketplace opens). */}
          <Button variant="secondary" size="lg" disabled className="h-13 rounded-full text-lead">
            Publish listing
          </Button>
          <NotYet className="-mt-2 text-primary-foreground/70">
            Publishing opens with Marketplace.{missing.length > 0 ? ` Until then, add ${missing.join(", ")} to finish your draft.` : ""}
          </NotYet>
          <span className="text-micro leading-normal text-primary-foreground/60">
            Estimate only. Payouts through a payments partner (e.g. Stripe Connect), to be confirmed. The service fee depends on the renter&rsquo;s plan.
          </span>
        </aside>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-small font-semibold">{label}</Label>
      {children}
    </div>
  );
}

// A dollar amount: whole dollars, typed or pasted with commas.
function Money({ id, value, onChange, placeholder, disabled }: { id: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) {
  return (
    <div className={cn("flex h-10 items-center gap-1 rounded-md border border-input bg-white px-3 focus-within:ring-3 focus-within:ring-ring/50", disabled && "opacity-50")}>
      <span aria-hidden className="text-sm text-muted-foreground">$</span>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder disabled:cursor-not-allowed"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex justify-between gap-3">
      <span className="text-primary-foreground/70">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </span>
  );
}
