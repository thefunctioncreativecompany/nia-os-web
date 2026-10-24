"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { animate, useReducedMotion } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { createClient } from "@/lib/supabase/client";
import { myPlan } from "@/lib/plan-client";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { FREE_LIMITS, PAID_UPLOAD_MB, PLANS, TOP_UPS, money, type Billing, type Plan, type PlanId } from "@/lib/plans";

// Plans (Ika, 2026-10-20): the five plans as cards (after Storyflow's pricing page, in Nia's look),
// a monthly or annual switch whose prices count between the two (uiarc plan-comparison), a table
// of what changes between plans, and AI credit top-ups. There are no payments yet: picking a plan
// saves interest and we email when payments open.
export function PlansPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [current, setCurrent] = useState<PlanId | null>(null);
  const [wanted, setWanted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    // The plan and the waitlist load side by side.
    void myPlan(supabase).then(setCurrent);
    void supabase
      .from("feature_waitlist")
      .select("feature")
      .then(({ data }) => setWanted(new Set((data ?? []).map((r) => r.feature as string))));
  }, []);

  const register = async (plan: Plan) => {
    const { error } = await createClient().from("feature_waitlist").insert({ feature: plan.id });
    if (error && error.code !== "23505") return void toast.error("Couldn't save that. Try again.");
    setWanted((w) => new Set(w).add(plan.id));
    toast.success(plan.id === "enterprise" ? "Thanks. We'll be in touch about Enterprise." : `We'll email you when ${plan.name} opens.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 pt-10 pb-24 md:px-11">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-140">
          <h1 className="text-display font-extrabold tracking-tight text-foreground">Plans</h1>
          <p className="mt-2 text-lead text-muted-foreground">
            Start free and upgrade when the production grows. Paid plans open soon: pick one to save your place and we&rsquo;ll email you when payments start.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <SegmentedControl
            label="Billing period"
            value={billing}
            onValueChange={(v) => setBilling(v as Billing)}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "annual", label: "Annual" },
            ]}
          />
          <small className="text-caption text-muted-foreground">{billing === "annual" ? "Billed once a year, about 20% less" : "Billed month to month"}</small>
        </div>
      </header>

      <section aria-label="Plans" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} current={current === plan.id} wanted={wanted.has(plan.id)} onChoose={() => void register(plan)} />
        ))}
      </section>

      <Comparison billing={billing} />

      <section aria-labelledby="top-ups" className="flex flex-col gap-4">
        <div>
          <h2 id="top-ups" className="text-lg font-extrabold text-foreground">AI credit top-ups</h2>
          <p className="text-small text-muted-foreground">For months you need more than your plan includes. Credits arrive with Nia&rsquo;s Copilot.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {TOP_UPS.map((pack) => (
            <li key={pack.name} className="flex flex-col gap-1 rounded-2xl border border-border p-5">
              <span className="text-sm font-semibold text-foreground">{pack.name}</span>
              <span className="text-h2 font-bold tracking-tight text-foreground">{money(pack.price)}</span>
              <span className="text-small text-muted-foreground">
                {pack.credits.toLocaleString("en-US")} credits &middot; ${(pack.price / pack.credits).toFixed(3)} a credit
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-small text-muted-foreground">Prices in USD. Enterprise is priced per seat on an annual contract, three seats or more.</p>
    </div>
  );
}

function PlanCard({ plan, billing, current, wanted, onChoose }: { plan: Plan; billing: Billing; current: boolean; wanted: boolean; onChoose: () => void }) {
  const annual = billing === "annual" && plan.annual !== null;
  const price = annual ? plan.annual! : plan.monthly;
  const note =
    plan.id === "free"
      ? "Free for as long as you like."
      : plan.id === "enterprise"
        ? "Annual contract, three seats or more."
        : annual
          ? `${money(Math.round(plan.annual! * 12 * 100) / 100)} billed once a year`
          : "Billed monthly";

  return (
    <article aria-labelledby={`plan-${plan.id}`} className={cn("flex flex-col gap-5 rounded-2xl border bg-white p-6", current ? "border-foreground" : "border-border")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`plan-${plan.id}`} className="text-lg font-bold text-foreground">{plan.name}</h2>
        {current && <span className="inline-flex h-6 items-center rounded-full border border-foreground px-2.5 text-micro font-semibold text-foreground">Your plan</span>}
      </div>
      <p className="-mt-3.5 text-small text-muted-foreground">{plan.tagline}</p>

      <div>
        <span className={cn("block h-4 text-caption text-muted-foreground line-through", !annual && "invisible")}>{money(plan.monthly)}</span>
        <p className="flex items-baseline gap-1 text-foreground" aria-live="polite" aria-atomic="true">
          <span className="text-display leading-none font-bold tracking-tight">
            <AnimatedPrice value={price} />
          </span>
          <span className="text-small text-muted-foreground">{plan.unit}</span>
        </p>
        <span className="mt-1.5 block text-small text-muted-foreground">{note}</span>
      </div>

      <ul className="grid gap-x-5 gap-y-3.5 border-t border-border pt-5 sm:grid-cols-2">
        {plan.features.map((f) => (
          <li key={f.title} className="flex gap-2">
            <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-foreground text-primary-foreground">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            <span>
              <span className="block text-small font-semibold text-foreground">{f.title}</span>
              <span className="block text-small leading-snug text-muted-foreground">{f.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">
        {plan.id === "free" ? (
          <Button variant="outline" className="w-full" disabled={current}>
            {current ? "Your plan" : "Included with every account"}
          </Button>
        ) : current ? (
          <Button variant="outline" className="w-full" disabled>
            Your plan
          </Button>
        ) : wanted ? (
          <Button variant="outline" className="w-full" aria-pressed>
            <Check aria-hidden /> {plan.id === "enterprise" ? "We'll be in touch" : "We'll email you"}
          </Button>
        ) : (
          <Button className="w-full" onClick={onChoose}>
            {plan.id === "enterprise" ? "Talk to us" : `Get ${plan.name}`}
          </Button>
        )}
      </div>
    </article>
  );
}

// A price that counts to its new value when the billing period changes.
function AnimatedPrice({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce) {
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: DURATION.base,
      ease: [...EASE_OUT],
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [reduce, value]);
  const v = reduce ? value : shown;
  return <>{money(Number.isInteger(value) ? Math.round(v) : Math.round(v * 100) / 100)}</>;
}

// What changes between plans, one row each.
function Comparison({ billing }: { billing: Billing }) {
  const soon = <span className="ml-1.5 inline-flex h-5 items-center rounded-full bg-phase-soon px-2 text-micro font-medium text-phase-soon-foreground">Coming soon</span>;
  const rows: { label: React.ReactNode; values: (p: Plan) => string }[] = [
    {
      label: billing === "annual" ? "Price a month, paid yearly" : "Price a month",
      values: (p) => (billing === "annual" ? (p.annual !== null ? money(p.annual) : p.id === "free" ? "$0" : "Annual contract") : `${money(p.monthly)}${p.id === "enterprise" ? " a seat" : ""}`),
    },
    { label: "Projects", values: (p) => (p.id === "free" ? `Up to ${FREE_LIMITS.projects}` : "Unlimited") },
    { label: "Documents per project", values: (p) => (p.id === "free" ? `${FREE_LIMITS.documentsPerProject}, one of each` : "Unlimited") },
    { label: "Collaborators per project", values: (p) => (p.id === "free" ? String(FREE_LIMITS.collaboratorsPerProject) : "Unlimited") },
    { label: "Uploads", values: (p) => (p.id === "free" ? `Up to ${FREE_LIMITS.uploadMb} MB` : `Up to ${PAID_UPLOAD_MB} MB`) },
    { label: "Nia footer on exports", values: (p) => (p.id === "free" ? "Always" : "Your choice") },
    { label: <>AI credits{soon}</>, values: (p) => p.credits },
    { label: <>Gear rental fee{soon}</>, values: (p) => p.gearFee },
    { label: <>Studio &amp; co-working{soon}</>, values: (p) => p.studio },
    { label: "Best for", values: (p) => p.bestFor },
  ];

  return (
    <section aria-labelledby="compare" className="flex flex-col gap-4">
      <h2 id="compare" className="text-lg font-extrabold text-foreground">Compare plans</h2>
      <div className="overflow-x-auto rounded-2xl border border-border [scrollbar-width:thin]">
        <table className="w-full min-w-200 border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th scope="col" className="sticky left-0 bg-muted px-4 py-3 font-semibold text-muted-foreground">What changes</th>
              {PLANS.map((p) => (
                <th key={p.id} scope="col" className="px-4 py-3 font-semibold text-foreground">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <th scope="row" className="sticky left-0 bg-white px-4 py-3 font-medium whitespace-nowrap text-foreground">{row.label}</th>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3 align-top text-muted-foreground">{row.values(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
