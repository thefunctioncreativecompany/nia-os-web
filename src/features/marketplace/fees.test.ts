import { describe, expect, it } from "vitest";

import { fleetRate, formatMoney, instalments, quotePurchase, quoteRental, rentalDays, serviceRate } from "./fees";

describe("serviceRate", () => {
  it("follows the Plans page", () => {
    expect(serviceRate("free")).toBe(0.05);
    expect(serviceRate("starter")).toBe(0.05);
    expect(serviceRate("creator")).toBe(0.04);
    expect(serviceRate("pro")).toBe(0.03);
    expect(serviceRate("enterprise")).toBe(0.03);
  });
});

describe("quoteRental", () => {
  // The design's example: Apple Vision Pro, $75 × 3 days, protection on, paid by card.
  it("prices the design's example for a Pro renter (3%)", () => {
    const q = quoteRental({ dayRate: 75, days: 3, protection: true, plan: "pro", depositDollars: 500 });
    expect(q.rental).toBe(22_500);
    expect(q.protection).toBe(2_250);
    expect(q.serviceFee).toBe(675);
    // (225 + 22.50 + 6.75) × 2.9% = 7.37325 → $7.37, + $0.30
    expect(q.processing).toBe(767);
    expect(q.total).toBe(26_192);
    expect(q.deposit).toBe(50_000);
    expect(q.listerPayout).toBe(22_500);
  });

  it("charges a Free renter 5% and leaves protection off when asked", () => {
    const q = quoteRental({ dayRate: 75, days: 3, protection: false, plan: "free" });
    expect(q.protection).toBe(0);
    expect(q.serviceFee).toBe(1_125);
    // (225 + 11.25) × 2.9% = 6.85125 → $6.85, + $0.30
    expect(q.processing).toBe(715);
    expect(q.total).toBe(22_500 + 1_125 + 715);
  });

  it("multiplies by units for fleets, and rounds each line to cents", () => {
    const q = quoteRental({ dayRate: fleetRate(5), days: 2, units: 5, protection: true, plan: "creator" });
    expect(q.rental).toBe(39_000);
    expect(q.protection).toBe(3_900);
    expect(q.serviceFee).toBe(1_560);
    expect(Number.isInteger(q.processing)).toBe(true);
    expect(q.total).toBe(q.rental + q.protection + q.serviceFee + q.processing);
  });

  it("rounds odd amounts per line", () => {
    const q = quoteRental({ dayRate: 18.99, days: 1, protection: true, plan: "free" });
    expect(q.rental).toBe(1_899);
    expect(q.protection).toBe(190); // 189.9 → 190
    expect(q.serviceFee).toBe(95); // 94.95 → 95
  });
});

describe("fleetRate", () => {
  it("drops to $39 a unit from 5 units", () => {
    expect(fleetRate(1)).toBe(45);
    expect(fleetRate(4)).toBe(45);
    expect(fleetRate(5)).toBe(39);
    expect(fleetRate(20)).toBe(39);
  });
});

describe("rentalDays", () => {
  it("counts days between pickup and return, at least one", () => {
    expect(rentalDays(new Date(2026, 10, 9), new Date(2026, 10, 12))).toBe(3);
    expect(rentalDays(new Date(2026, 10, 9), new Date(2026, 10, 9))).toBe(1);
    // Across the end of daylight saving time (Nov 1, 2026, in the US).
    expect(rentalDays(new Date(2026, 9, 31), new Date(2026, 10, 2))).toBe(2);
  });
});

describe("quotePurchase and instalments", () => {
  it("adds processing to a one-off price, with no service fee", () => {
    const q = quotePurchase({ priceDollars: 29 });
    expect(q.price).toBe(2_900);
    expect(q.processing).toBe(114); // 84.1 → 84, + 30
    expect(q.total).toBe(3_014);
  });

  it("splits a total into four payments that add back up", () => {
    const { each, last } = instalments(26_192);
    expect(each * 3 + last).toBe(26_192);
    expect(each).toBe(6_548);
  });

  it("formats cents as dollars", () => {
    expect(formatMoney(26_192)).toBe("$261.92");
    expect(formatMoney(250_000)).toBe("$2,500.00");
  });
});
