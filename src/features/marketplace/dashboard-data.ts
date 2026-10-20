// Sample data for the lister dashboard (MARKETPLACE_SPEC.md §7, Ika's Claude Design
// "MarketplaceHost"), until earnings and payouts come from completed bookings in Supabase.
// Dates are days from today so "Today" and "Tomorrow" always read right.

export type Handover = "Pickup" | "Delivery" | "Return";

export type Renter = { id: string; name: string; rating: number | null; rentals: number; idVerified: boolean };

/** The spec's `request` shape, with dates as days from today and the response window in minutes. */
export type BookingRequest = {
  id: string;
  /** What's asked for: one listing, or a bundle shown under one name. */
  listingIds: string[];
  title: string;
  renterId: string;
  startInDays: number;
  endInDays: number;
  handover: string;
  /** What the lister earns, in US dollars. */
  payout: number;
  expiresInMinutes: number;
  status: "pending" | "accepted" | "declined" | "expired";
};

export const RENTERS: Renter[] = [
  { id: "jordan", name: "Jordan M.", rating: 4.9, rentals: 12, idVerified: true },
  { id: "thandi", name: "Thandi K.", rating: 5.0, rentals: 4, idVerified: true },
  { id: "sam", name: "Sam R.", rating: null, rentals: 0, idVerified: true },
  { id: "alex", name: "Alex P.", rating: 4.8, rentals: 7, idVerified: true },
  { id: "lerato", name: "Lerato N.", rating: 5.0, rentals: 3, idVerified: true },
  { id: "chris", name: "Chris D.", rating: 4.7, rentals: 9, idVerified: true },
  { id: "maya", name: "Maya L.", rating: 4.9, rentals: 5, idVerified: true },
];

export const REQUESTS: BookingRequest[] = [
  { id: "r1", listingIds: ["sony-fx3"], title: "Sony FX3", renterId: "jordan", startInDays: 4, endInDays: 7, handover: "Pickup", payout: 255, expiresInMinutes: 102, status: "pending" },
  { id: "r2", listingIds: ["dji-mini-4-pro"], title: "DJI Mini 4 Pro", renterId: "thandi", startInDays: 5, endInDays: 6, handover: "Delivery · Allston", payout: 45, expiresInMinutes: 190, status: "pending" },
  { id: "r3", listingIds: ["sony-a7-iv", "rode-wireless-go-ii"], title: "Sony α7 IV + RØDE Wireless GO II", renterId: "sam", startInDays: 10, endInDays: 13, handover: "Pickup", payout: 219, expiresInMinutes: 355, status: "pending" },
];

export type Upcoming = { inDays: number; time: string; kind: Handover; title: string; renterId: string; where: string };

export const UPCOMING: Upcoming[] = [
  { inDays: 0, time: "2:00 PM", kind: "Pickup", title: "Sony FX3", renterId: "alex", where: "at your location" },
  { inDays: 0, time: "6:30 PM", kind: "Return", title: "Aputure HR672C LED", renterId: "lerato", where: "at your location" },
  { inDays: 1, time: "10:00 AM", kind: "Delivery", title: "DJI Mini 4 Pro", renterId: "chris", where: "Allston" },
  { inDays: 1, time: "5:00 PM", kind: "Return", title: "RØDE Wireless GO II", renterId: "maya", where: "at your location" },
  { inDays: 2, time: "9:00 AM", kind: "Return", title: "Sony FX3", renterId: "alex", where: "at your location" },
];

/** The lister's listings this month: views, rented days and what they earned (US dollars). */
export const LISTER_LISTINGS: { listingId: string; views: number; bookedDays: number; earned: number }[] = [
  { listingId: "sony-fx3", views: 520, bookedDays: 9, earned: 765 },
  { listingId: "sony-a7-iv", views: 310, bookedDays: 6, earned: 330 },
  { listingId: "dji-mini-4-pro", views: 240, bookedDays: 7, earned: 315 },
  { listingId: "rode-wireless-go-ii", views: 110, bookedDays: 6, earned: 108 },
  { listingId: "aputure-hr672c", views: 60, bookedDays: 8, earned: 120 },
];

/** Earnings for the last eight weeks, oldest first (US dollars); weeks are days-ago labels. */
export const WEEKLY_EARNINGS: { weeksAgo: number; amount: number }[] = [
  { weeksAgo: 7, amount: 210 },
  { weeksAgo: 6, amount: 280 },
  { weeksAgo: 5, amount: 190 },
  { weeksAgo: 4, amount: 350 },
  { weeksAgo: 3, amount: 330 },
  { weeksAgo: 2, amount: 410 },
  { weeksAgo: 1, amount: 420 },
  { weeksAgo: 0, amount: 478 },
];

export type Period = "this-month" | "last-month";

export const PERIODS: Record<Period, { label: string; earnings: number; change: string; kpis: { label: string; value: string; sub: string }[] }> = {
  "this-month": {
    label: "This month",
    earnings: 1638,
    change: "+22% vs last month",
    kpis: [
      { label: "Bookings", value: "14", sub: "36 rented days" },
      { label: "Utilisation", value: "24%", sub: "Across 5 listings" },
      { label: "Rating", value: "4.9", sub: "From 23 reviews" },
      { label: "Pending earnings", value: "$592", sub: "Released after returns" },
    ],
  },
  "last-month": {
    label: "Last month",
    earnings: 1343,
    change: "+9% vs the month before",
    kpis: [
      { label: "Bookings", value: "11", sub: "29 rented days" },
      { label: "Utilisation", value: "19%", sub: "Across 5 listings" },
      { label: "Rating", value: "4.9", sub: "From 19 reviews" },
      { label: "Pending earnings", value: "$0", sub: "All paid out" },
    ],
  },
};

export const NEXT_PAYOUT = { amount: 478, inDays: 3 };

export const FUNNEL = [
  { label: "Listing views", value: 1240, width: 100 },
  { label: "Booking requests", value: 31, width: 44 },
  { label: "Confirmed bookings", value: 14, width: 22 },
];

export const ANALYTICS = [
  { label: "Acceptance rate", value: "94%" },
  { label: "Avg. response", value: "18 min" },
  { label: "Repeat renters", value: "36%" },
  { label: "Top category", value: "Cameras" },
];
