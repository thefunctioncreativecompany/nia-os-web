// What a Marketplace booking costs (MARKETPLACE_SPEC.md "Fee logic"), in one place so the listing
// page, checkout and fleet booking can never disagree. Every amount is whole US cents, and each
// line is rounded on its own before the total adds them up.
//
// - Service fee: the renter's plan sets it, as the Plans page shows (Ika, 2026-10-20: 5% Free and
//   Starter, 4% Creator, 3% Pro and Enterprise), on the rental subtotal only.
// - Protection: optional, 10% of the rental subtotal, with a $100 excess.
// - Processing: passed through at cost, (rental + protection + fee) × the method's rate + its fixed
//   charge; 2.9% + $0.30 for every method until each provider's real rate is known.
// - The lister receives 100% of their listed price, and any delivery charge.
// - Delivery: the lister's charge each way (the design's $25), counted in processing.
// - Fleet rate: $45 a unit per day, or $39 a unit from 5 units.

import { planById, type PlanId } from "@/lib/plans";

export type PaymentMethod =
  | "card"
  | "apple-pay"
  | "google-pay"
  | "paypal"
  | "bank-transfer"
  | "afterpay"
  | "klarna"
  | "affirm"
  | "paypal-later";

/** Each method's processing charge: a rate and a fixed amount in cents. */
export const PROCESSING: Record<PaymentMethod, { rate: number; fixedCents: number }> = {
  card: { rate: 0.029, fixedCents: 30 },
  "apple-pay": { rate: 0.029, fixedCents: 30 },
  "google-pay": { rate: 0.029, fixedCents: 30 },
  paypal: { rate: 0.029, fixedCents: 30 },
  "bank-transfer": { rate: 0.029, fixedCents: 30 },
  afterpay: { rate: 0.029, fixedCents: 30 },
  klarna: { rate: 0.029, fixedCents: 30 },
  affirm: { rate: 0.029, fixedCents: 30 },
  "paypal-later": { rate: 0.029, fixedCents: 30 },
};

export const PROTECTION_RATE = 0.1;
export const PROTECTION_EXCESS_CENTS = 10_000;
export const DELIVERY_EACH_WAY_CENTS = 2_500;
export const FLEET_RATE = { standard: 45, bulk: 39, bulkFrom: 5 } as const;

const DAY_MS = 86_400_000;

export const toCents = (dollars: number) => Math.round(dollars * 100);

/** "$1,234.56". */
export const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Nights between pickup and return, at least one. Dates are calendar days (time of day ignored). */
export function rentalDays(pickup: Date, ret: Date) {
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(1, Math.round((day(ret) - day(pickup)) / DAY_MS));
}

/** Dollars per unit per day for a fleet of `units` (the Olto fleet's rate unless another is given). */
export function fleetRate(units: number, terms: { rate: number; bulkRate?: number; bulkFrom?: number } = { rate: FLEET_RATE.standard, bulkRate: FLEET_RATE.bulk, bulkFrom: FLEET_RATE.bulkFrom }) {
  return terms.bulkRate !== undefined && terms.bulkFrom !== undefined && units >= terms.bulkFrom ? terms.bulkRate : terms.rate;
}

/** The renter's plan's service fee, as a fraction ("5%" → 0.05). */
export function serviceRate(plan: PlanId) {
  const pct = Number.parseFloat(planById(plan).gearFee);
  return Number.isFinite(pct) ? pct / 100 : 0.05;
}

export type RentalQuote = {
  days: number;
  units: number;
  /** Day rate per unit, in cents. */
  rateCents: number;
  rental: number;
  protection: number;
  serviceFee: number;
  /** Delivery there and back, when chosen. */
  delivery: number;
  processing: number;
  total: number;
  /** Refundable hold on the card, not charged. */
  deposit: number;
  /** What the lister receives: all of the rental. */
  listerPayout: number;
};

/** A rental's lines and total. */
export function quoteRental({
  dayRate,
  days,
  units = 1,
  protection,
  plan,
  method = "card",
  depositDollars = 0,
  delivery = false,
}: {
  /** Dollars per unit per day. */
  dayRate: number;
  days: number;
  units?: number;
  protection: boolean;
  plan: PlanId;
  method?: PaymentMethod;
  depositDollars?: number;
  /** Local delivery there and back. */
  delivery?: boolean;
}): RentalQuote {
  const rateCents = toCents(dayRate);
  const rental = rateCents * days * units;
  const protectionCents = protection ? Math.round(rental * PROTECTION_RATE) : 0;
  const serviceFee = Math.round(rental * serviceRate(plan));
  const deliveryCents = delivery ? DELIVERY_EACH_WAY_CENTS * 2 : 0;
  const { rate, fixedCents } = PROCESSING[method];
  const processing = Math.round((rental + protectionCents + serviceFee + deliveryCents) * rate) + fixedCents;
  return {
    days,
    units,
    rateCents,
    rental,
    protection: protectionCents,
    serviceFee,
    delivery: deliveryCents,
    processing,
    total: rental + protectionCents + serviceFee + deliveryCents + processing,
    deposit: toCents(depositDollars),
    listerPayout: rental + deliveryCents,
  };
}

/** A one-off purchase (digital products, or buying gear): the price plus processing, no service fee. */
export function quotePurchase({ priceDollars, method = "card" }: { priceDollars: number; method?: PaymentMethod }) {
  const price = toCents(priceDollars);
  const { rate, fixedCents } = PROCESSING[method];
  const processing = Math.round(price * rate) + fixedCents;
  return { price, processing, total: price + processing, listerPayout: price };
}

/** Afterpay's four interest-free payments: the first three rounded, the last takes what's left. */
export function instalments(totalCents: number, count = 4) {
  const each = Math.round(totalCents / count);
  return { each, last: totalCents - each * (count - 1) };
}
