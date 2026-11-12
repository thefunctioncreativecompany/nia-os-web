// Nia's plans (Ika's subscription tiers, 2026-10-20) and the free plan's limits. Prices are USD.
// There are no payments yet: every workspace is on Free unless Ika moves it by hand (see
// supabase/migrations/20261028000000_plans.sql), and "Get …" buttons save interest.

export type PlanId = "free" | "starter" | "creator" | "pro" | "enterprise";
export type Billing = "monthly" | "annual";

export type Plan = {
  id: PlanId;
  name: string;
  /** One line under the name. */
  tagline: string;
  /** Price per month; null when it's quoted rather than listed. */
  monthly: number;
  /** Price per month when paid yearly; null when there's no yearly price. */
  annual: number | null;
  /** "/mo" or "/seat a month". */
  unit: string;
  credits: string;
  studio: string;
  bestFor: string;
  /** What the plan gives, shown as the card's checklist. */
  features: { title: string; detail: string }[];
};

// What every paid plan adds over Free.
const PAID = [
  { title: "Unlimited projects", detail: "No cap on projects in your workspace." },
  { title: "Unlimited documents", detail: "As many documents as a project needs, several of the same kind." },
  { title: "Your whole team", detail: "Invite as many collaborators as the production needs." },
  { title: "Your branding on exports", detail: "Download PDFs and Word files without the Nia footer." },
  { title: "Larger uploads", detail: "Files up to 50 MB each." },
];

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try Nia on your first productions.",
    monthly: 0,
    annual: null,
    unit: "/mo",
    credits: "100, one-time",
    studio: "Rate card",
    bestFor: "Trying Nia",
    features: [
      { title: "Up to 5 projects", detail: "Each with up to 5 documents, one of each kind." },
      { title: "Three collaborators per project", detail: "Share a project with up to three other people." },
      { title: "Uploads up to 25 MB", detail: "Stills, documents and voice memos." },
      { title: "100 AI credits, once", detail: "Enough to try what Nia's AI can do." },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Everything a first production needs.",
    monthly: 9.99,
    annual: 7.99,
    unit: "/mo",
    credits: "300 a month",
    studio: "15% member discount",
    bestFor: "Students and emerging creators",
    features: [...PAID, { title: "300 AI credits a month", detail: "Renewed every billing period." }],
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "For working creatives and freelancers.",
    monthly: 19,
    annual: 15.2,
    unit: "/mo",
    credits: "750 a month",
    studio: "15% member discount",
    bestFor: "Working creatives and freelancers",
    features: [...PAID, { title: "750 AI credits a month", detail: "Renewed every billing period." }],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "The full production suite.",
    monthly: 50,
    annual: 40,
    unit: "/mo",
    credits: "3,000 a month",
    studio: "15% member discount",
    bestFor: "Producers and small studios",
    features: [...PAID, { title: "3,000 AI credits a month", detail: "Renewed every billing period." }],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For production companies, agencies and schools.",
    monthly: 35,
    annual: null,
    unit: "/seat a month",
    credits: "750 a seat, pooled",
    studio: "15% member discount",
    bestFor: "Production companies, agencies and schools (3+ seats)",
    features: [...PAID, { title: "750 AI credits a seat, pooled", detail: "Shared across the whole team." }, { title: "Annual contract", detail: "Three seats or more, invoiced yearly." }],
  },
];

export const TOP_UPS = [
  { name: "Small", price: 10, credits: 500 },
  { name: "Medium", price: 25, credits: 1500 },
  { name: "Large", price: 50, credits: 3500 },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0];

/** "$9.99", "$19", "$15.20". */
export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// The free plan's limits. They apply on the live site only, so they don't get in the way while
// building on localhost (Ika, 2026-10-20). The document limits are also kept by the database.
export const FREE_LIMITS = {
  projects: 5,
  documentsPerProject: 5,
  // Raised from 1 to 3 (Ika, 2026-11-11).
  collaboratorsPerProject: 3,
  uploadMb: 25,
} as const;

/** Paid plans' upload limit (the storage bucket's own limit). */
export const PAID_UPLOAD_MB = 50;

export const limitsOn = process.env.NODE_ENV === "production";

/** Whether the free limits apply to a workspace on this plan. */
export const isLimited = (plan: PlanId | null | undefined) => limitsOn && (plan ?? "free") === "free";
