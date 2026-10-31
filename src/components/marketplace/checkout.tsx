"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { myPlan } from "@/lib/plan-client";
import { planById, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NotYet } from "@/components/nia/not-yet";
import { depositFor, getProvider, type Listing } from "@/features/marketplace/data";
import {
  DELIVERY_EACH_WAY_CENTS,
  PROTECTION_EXCESS_CENTS,
  formatMoney,
  instalments,
  quotePurchase,
  quoteRental,
  rentalDays,
  serviceRate,
  type PaymentMethod,
} from "@/features/marketplace/fees";
import { DigitalIcon } from "./digital-icon";
import { MarketplaceNav } from "./marketplace-nav";
import { fromIso, shortDate } from "./rental-dates";

const PAY_NOW: { id: PaymentMethod; name: string; sub: string }[] = [
  { id: "card", name: "Card", sub: "Visa, Mastercard, Amex" },
  { id: "apple-pay", name: "Apple Pay", sub: "Instant" },
  { id: "google-pay", name: "Google Pay", sub: "Instant" },
  { id: "paypal", name: "PayPal", sub: "Instant" },
  { id: "bank-transfer", name: "Bank transfer", sub: "ACH (US) · Instant EFT (ZA)" },
];
const PAY_LATER: { id: PaymentMethod; name: string; sub: string }[] = [
  { id: "afterpay", name: "Afterpay", sub: "4 interest-free payments" },
  { id: "klarna", name: "Klarna", sub: "Pay in 4 or monthly" },
  { id: "affirm", name: "Affirm", sub: "Monthly instalments" },
  { id: "paypal-later", name: "PayPal Pay Later", sub: "Pay in 4" },
];
const METHOD_NAME = Object.fromEntries([...PAY_NOW, ...PAY_LATER].map((m) => [m.id, m.name])) as Record<PaymentMethod, string>;

// The design's rental terms (draft wording, for legal review before launch).
const RENTAL_TERMS = [
  "Rentals run per 24-hour day from pickup or delivery; a 1-day minimum applies.",
  "A refundable deposit is held before handover and released within 48 hours of an undamaged return.",
  "Free cancellation up to 48 hours before pickup; 50% of the rental after that; no refund once collected.",
  "Late returns are charged at 1.5× the daily rate for each day or part day.",
  "You're responsible for the item from handover to return. Damage protection reduces this to a $100 excess; theft and loss aren't covered.",
  "Items over $1,000 require ID verification, and the account holder must collect.",
  "Use the item lawfully and as intended; drones must be flown within local aviation rules by a qualified pilot.",
  "Nia facilitates the booking; the lister owns the item and is responsible for its condition and description.",
];

// Checkout (MARKETPLACE_SPEC.md §4, Ika's Claude Design): 1 Delivery, 2 Protection, 3 Payment, then
// the rental terms with "I agree", beside a summary of what it costs. The service fee follows the
// renter's plan. Payments are not switched on yet: Pay says so and charges nothing. Purchases
// (digital products, or buying gear) skip protection, the deposit and the rental terms.
export function Checkout({ listing: l, mode, from, to }: { listing: Listing; mode: "rent" | "buy"; from: string | null; to: string | null }) {
  const provider = getProvider(l.providerId);
  const digital = l.kind === "digital";
  const renting = mode === "rent" && !!l.rentPerDay && !digital;
  const pickup = fromIso(from);
  const ret = fromIso(to);
  const days = pickup && ret ? rentalDays(pickup, ret) : 1;

  const [plan, setPlan] = useState<PlanId>("free");
  const [deliver, setDeliver] = useState(false);
  const [protection, setProtection] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("apple-pay");
  const [agreed, setAgreed] = useState(false);
  const agreeId = useId();

  useEffect(() => {
    let live = true;
    void myPlan(createClient()).then((p) => live && setPlan(p));
    return () => {
      live = false;
    };
  }, []);

  const rental = renting
    ? quoteRental({ dayRate: l.rentPerDay!, days, protection, plan, method, depositDollars: depositFor(l), delivery: deliver })
    : null;
  const purchase = renting ? null : quotePurchase({ priceDollars: digital ? (l.price ?? 0) : (l.buyPrice ?? 0), method });
  const total = rental?.total ?? purchase?.total ?? 0;
  const later = PAY_LATER.some((m) => m.id === method);
  const planName = planById(plan).name;

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="browse" />

      <Link
        href={`/marketplace/listing/${l.id}`}
        className="mt-8 inline-flex items-center gap-1.5 rounded-sm text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Back to {l.title}
      </Link>
      <h1 className="mt-3 text-h1 font-extrabold tracking-tight text-foreground">Checkout</h1>

      <div className="mt-6 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-8">
          {!digital && (
            <Step title="1. Delivery">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Option on={!deliver} onClick={() => setDeliver(false)} title={`Collect from ${provider.name}`} sub={`${provider.city} · Free · exact address after booking`} />
                <Option
                  on={deliver}
                  disabled={!l.delivery}
                  onClick={() => setDeliver(true)}
                  title="Local delivery"
                  sub={l.delivery ? `From ${provider.name} · within 15 mi · ${formatMoney(DELIVERY_EACH_WAY_CENTS).replace(".00", "")} each way` : "Not offered for this listing"}
                />
              </div>
            </Step>
          )}

          {renting && (
            <Step title="2. Protection">
              <button
                type="button"
                aria-pressed={protection}
                onClick={() => setProtection((p) => !p)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl bg-card p-4 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                  protection ? "border-2 border-foreground" : "border border-border hover:border-ring",
                )}
              >
                <ShieldCheck aria-hidden className={cn("mt-0.5 size-5 shrink-0", protection ? "text-foreground" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-bold">Damage protection · 10% of rental</span>
                  <span className="mt-0.5 block text-small leading-snug text-muted-foreground">
                    Covers accidental damage up to the listed value, after a {formatMoney(PROTECTION_EXCESS_CENTS).replace(".00", "")} excess. Theft and loss excluded.
                  </span>
                </span>
              </button>
            </Step>
          )}

          <Step title={`${digital ? 1 : renting ? 3 : 2}. Payment`}>
            <p className="text-caption font-semibold text-muted-foreground">Pay now</p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {PAY_NOW.map((m) => (
                <Option key={m.id} on={method === m.id} onClick={() => setMethod(m.id)} title={m.name} sub={m.sub} />
              ))}
            </div>
            <p className="mt-5 text-caption font-semibold text-muted-foreground">Pay over time</p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {PAY_LATER.map((m) => (
                <Option
                  key={m.id}
                  on={method === m.id}
                  onClick={() => setMethod(m.id)}
                  title={m.name}
                  sub={m.id === "afterpay" ? `4 × ${formatMoney(instalments(total).each)} interest-free` : m.sub}
                />
              ))}
            </div>
            <p className="mt-3 text-caption text-muted-foreground">
              Pay-over-time options are subject to the provider&rsquo;s approval.{renting ? " The refundable deposit is held on a card or digital wallet." : ""}
            </p>
          </Step>

          <Step title={renting ? "Rental terms (summary)" : "Terms"}>
            {renting && (
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-small leading-relaxed text-foreground/80">
                {RENTAL_TERMS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            )}
            <div className={cn("flex items-start gap-3", renting && "mt-4")}>
              <Checkbox id={agreeId} checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
              <Label htmlFor={agreeId} className="text-sm leading-snug font-medium">
                {renting ? "I agree to the rental terms and Nia's marketplace policy" : "I agree to Nia's marketplace policy"}
              </Label>
            </div>
            <p className="mt-2 text-caption text-nia-placeholder">Draft wording, for legal review before launch.</p>
          </Step>
        </div>

        <aside aria-label="Order summary" className="flex min-w-0 flex-[1_1_22.5rem] flex-col gap-4 rounded-2xl border border-border p-5 lg:sticky lg:top-6">
          <div className="flex gap-3">
            <span className={cn("relative size-16 shrink-0 overflow-hidden rounded-lg bg-nia-canvas", digital && cn("grid place-items-center", l.grain))}>
              {digital ? (
                <DigitalIcon listing={l} className="size-7" strokeWidth={1.5} />
              ) : (
                l.images[0] && <Image src={l.images[0].src} alt="" fill sizes="64px" className={l.images[0].fit === "contain" ? "object-contain p-1.5" : "object-cover"} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{l.title}</span>
              <span className="block text-caption text-muted-foreground">
                {renting && pickup && ret
                  ? `${shortDate(pickup)} → ${shortDate(ret)} · ${days} ${days === 1 ? "day" : "days"}`
                  : digital
                    ? "Instant download · licence included"
                    : "Purchase"}
              </span>
              {!digital && (
                <span className="block text-caption text-muted-foreground">
                  {deliver ? "Delivered by" : "Collect from"} <span className="font-semibold text-foreground">{provider.name}</span>
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            {rental ? (
              <>
                <Line label={`Rental ($${l.rentPerDay} × ${days})`} value={formatMoney(rental.rental)} />
                <Line label="Damage protection" value={protection ? formatMoney(rental.protection) : "—"} />
                <Line label={`Nia service fee (${Math.round(serviceRate(plan) * 100)}%, ${planName} plan)`} value={formatMoney(rental.serviceFee)} />
                {deliver && <Line label="Local delivery (both ways)" value={formatMoney(rental.delivery)} />}
                <Line label="Payment processing" value={formatMoney(rental.processing)} />
              </>
            ) : (
              purchase && (
                <>
                  <Line label={digital ? "Price" : "Price (estimate)"} value={formatMoney(purchase.price)} />
                  <Line label="Payment processing" value={formatMoney(purchase.processing)} />
                </>
              )
            )}
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-lead font-bold">Total</span>
            <span className="text-h3 font-extrabold">{formatMoney(total)}</span>
          </div>
          <span className="-mt-2 text-caption text-muted-foreground">
            {later ? `${METHOD_NAME[method]} will confirm your plan after you continue.` : `Paying with ${METHOD_NAME[method]}.`}
          </span>
          {rental && <Line label="Deposit hold (refundable)" value={formatMoney(rental.deposit)} quiet />}

          {/* Greyed out until payments are switched on (Marketplace opens). */}
          <Button size="lg" disabled className="h-13 rounded-full text-lead">
            {agreed ? `Pay ${formatMoney(total)}` : renting ? "Agree to the rental terms to continue" : "Agree to the terms to continue"}
          </Button>
          <NotYet className="-mt-2">Payments open with Marketplace. Nothing is charged in this preview.</NotYet>
          <span className="text-micro leading-normal text-nia-placeholder">
            Processing is passed through at cost and varies by method. Card rate shown is 2.9% + $0.30 (illustrative).
          </span>
        </aside>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lead font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Option({ on, disabled, onClick, title, sub }: { on: boolean; disabled?: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl bg-card p-3.5 text-left outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        on ? "border-2 border-foreground" : "border border-border hover:border-ring",
      )}
    >
      <span className="text-sm font-bold">{title}</span>
      <span className="text-caption text-muted-foreground">{sub}</span>
    </button>
  );
}

function Line({ label, value, quiet }: { label: string; value: string; quiet?: boolean }) {
  return (
    <span className={cn("flex justify-between gap-3", quiet && "text-small text-muted-foreground")}>
      <span className={cn(!quiet && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </span>
  );
}
