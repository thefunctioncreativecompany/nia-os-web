"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { features } from "@/lib/features";
import { myPlan } from "@/lib/plan-client";
import { planById, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberStepper } from "@/components/nia/number-stepper";
import { marketplaceHome, type Listing } from "@/features/marketplace/data";
import { fleetRate, formatMoney, quoteRental, rentalDays, serviceRate } from "@/features/marketplace/fees";
import { MarketplaceNav } from "./marketplace-nav";
import { RentalDates, defaultRange, useToday } from "./rental-dates";

// Fleet booking (MARKETPLACE_SPEC.md §6, Ika's Claude Design): the vehicle, then units (1 to 20),
// start and end, where to deliver, and the price as it changes: units × rate × days (the fleet
// rate from 5 Olto units), protection, the service fee from the renter's plan, processing and the
// total. Requests open with Marketplace, so nothing is sent yet.
export function FleetBooking({ listing: l }: { listing: Listing & { fleet: NonNullable<Listing["fleet"]> } }) {
  const fleet = l.fleet;
  const image = l.images[0];
  const today = useToday();
  const [picked, setRange] = useState<DateRange | undefined>(undefined);
  const { tomorrow, range: suggested } = defaultRange(today, 2);
  const range = picked ?? suggested;
  const [units, setUnits] = useState(fleet.bulkFrom ?? 2);
  const [where, setWhere] = useState("");
  const [plan, setPlan] = useState<PlanId>("free");
  const whereId = useId();

  useEffect(() => {
    let live = true;
    void myPlan(createClient()).then((p) => live && setPlan(p));
    return () => {
      live = false;
    };
  }, []);

  const days = range?.from && range.to ? rentalDays(range.from, range.to) : null;
  const rate = fleetRate(units, fleet);
  const bulk = fleet.bulkRate !== undefined && rate === fleet.bulkRate;
  const quote = days ? quoteRental({ dayRate: rate, days, units, protection: true, plan }) : null;

  const request = () => {
    toast("Fleet requests open with Marketplace, so nothing was sent.", { description: "This is the booking as it will work at launch." });
  };

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="browse" />
      <Link
        href={marketplaceHome(features.marketplaceUnlocked)}
        className="mt-8 inline-flex items-center gap-1.5 rounded-sm text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Marketplace
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_35rem]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-nia-canvas">
            {image && (
              <span className="absolute inset-0" style={{ padding: image.fit === "contain" ? `${image.pad ?? 6}%` : undefined }}>
                <span className="relative block size-full">
                  <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 64rem) 60vw, 100vw" className={image.fit === "contain" ? "object-contain" : "object-cover"} />
                </span>
              </span>
            )}
            {fleet.bulkRate !== undefined && (
              <span className="absolute top-4 left-4 inline-flex h-7 items-center rounded-full bg-primary px-3 text-caption font-semibold text-primary-foreground">
                Fleet rate from {fleet.bulkFrom} units
              </span>
            )}
          </div>
          <h1 className="mt-6 text-h1 font-extrabold tracking-tight text-foreground">{fleet.title}</h1>
          <p className="mt-2 max-w-150 text-lead leading-relaxed text-muted-foreground">{fleet.description}</p>
        </div>

        <aside aria-label="Fleet booking" className="flex min-w-0 flex-[1_1_22.5rem] flex-col gap-4 rounded-2xl border border-border p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold">Units</span>
            <NumberStepper value={units} onChange={setUnits} min={1} max={20} label="Units" />
          </div>
          <RentalDates range={range} onChange={setRange} today={today} earliest={tomorrow} labels={["Start", "End"]} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={whereId} className="text-small font-semibold">Deliver to</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 focus-within:ring-3 focus-within:ring-ring/50">
              <MapPin aria-hidden className="size-4 text-muted-foreground" />
              <input
                id={whereId}
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Set location"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder"
              />
            </div>
          </div>

          {quote && (
            <>
              <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <Line label={`${units} × $${rate} × ${days} ${days === 1 ? "day" : "days"}${bulk ? " (fleet rate)" : ""}`} value={formatMoney(quote.rental)} />
                <Line label="Damage protection (10%)" value={formatMoney(quote.protection)} />
                <Line label={`Nia service fee (${Math.round(serviceRate(plan) * 100)}%, ${planById(plan).name} plan)`} value={formatMoney(quote.serviceFee)} />
                <Line label="Payment processing" value={formatMoney(quote.processing)} />
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-lead font-bold">Total</span>
                <span className="text-h3 font-extrabold">{formatMoney(quote.total)}</span>
              </div>
            </>
          )}
          {fleet.bulkRate !== undefined && !bulk && (
            <span className="-mt-2 text-caption text-muted-foreground">
              ${fleet.bulkRate} a unit from {fleet.bulkFrom} units.
            </span>
          )}

          <Button size="lg" disabled={!quote || !where.trim()} onClick={request} className="h-13 rounded-full text-lead">
            {!where.trim() ? "Set a delivery location" : "Request fleet booking"}
          </Button>
          <span className="text-caption text-muted-foreground">{fleet.note}</span>
        </aside>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </span>
  );
}
