"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Plus, Star } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { NotYet } from "@/components/nia/not-yet";
import { dayRate, getListing, initials } from "@/features/marketplace/data";
import {
  ANALYTICS,
  FUNNEL,
  LISTER_LISTINGS,
  NEXT_PAYOUT,
  PERIODS,
  RENTERS,
  REQUESTS,
  UPCOMING,
  WEEKLY_EARNINGS,
  type BookingRequest,
  type Handover,
  type Period,
} from "@/features/marketplace/dashboard-data";
import { MarketplaceNav } from "./marketplace-nav";
import { shortDate, useToday } from "./rental-dates";

const DAY_MS = 86_400_000;
const renter = (id: string) => RENTERS.find((r) => r.id === id)!;
const dollars = (n: number) => `$${n.toLocaleString("en-US")}`;
// Pickup, Delivery and Return use the phase colours, as designed; accepted bookings are black.
const TAG: Record<Handover | "Accepted", string> = {
  Pickup: "bg-phase-pre text-phase-pre-foreground",
  Delivery: "bg-phase-soon text-phase-soon-foreground",
  Return: "bg-phase-production text-phase-production-foreground",
  Accepted: "bg-primary text-primary-foreground",
};

// The lister dashboard (MARKETPLACE_SPEC.md §7, Ika's Claude Design "MarketplaceHost"): an
// Accepting bookings switch, the period, + New listing; the dark earnings card with next payout and
// eight weeks of earnings; four figures; requests to accept or decline before their window closes;
// upcoming handovers by day; your listings with Active / Paused; and how listings turn into
// bookings. Sample data until bookings are real.
export function ListerDashboard() {
  const today = useToday();
  const [accepting, setAccepting] = useState(true);
  const [period, setPeriod] = useState<Period>("this-month");
  const [requests, setRequests] = useState<BookingRequest[]>(REQUESTS);
  const [paused, setPaused] = useState<Record<string, boolean>>({});
  const [week, setWeek] = useState(WEEKLY_EARNINGS.length - 1);
  // Minutes since the page opened, for the response countdowns.
  const [elapsed, setElapsed] = useState(0);
  const acceptingId = useId();

  useEffect(() => {
    const timer = setInterval(() => setElapsed((m) => m + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const p = PERIODS[period];
  const dayFrom = (n: number) => (today ? new Date(today.getTime() + n * DAY_MS) : null);
  const pending = requests.filter((r) => r.status === "pending" && r.expiresInMinutes - elapsed > 0);
  const accepted = requests.filter((r) => r.status === "accepted");
  const maxWeek = Math.max(...WEEKLY_EARNINGS.map((w) => w.amount));

  const answer = (id: string, status: "accepted" | "declined") => {
    setRequests((all) => all.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const dayLabel = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : dayFrom(n) ? shortDate(dayFrom(n)!) : `In ${n} days`);
  const weekLabel = (weeksAgo: number) => {
    const d = dayFrom(-weeksAgo * 7);
    return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : weeksAgo === 0 ? "This week" : `${weeksAgo} wk ago`;
  };
  const range = (r: BookingRequest) => {
    const days = r.endInDays - r.startInDays;
    const from = dayFrom(r.startInDays);
    const to = dayFrom(r.endInDays);
    if (!from || !to) return `${days} ${days === 1 ? "day" : "days"}`;
    return days <= 1 ? `${shortDate(from)} · 1 day` : `${shortDate(from)} → ${shortDate(to)} · ${days} days`;
  };
  const countdown = (r: BookingRequest) => {
    const left = r.expiresInMinutes - elapsed;
    return `Respond within ${Math.floor(left / 60) ? `${Math.floor(left / 60)}h ` : ""}${left % 60}m`;
  };

  const byDay = [...new Set(UPCOMING.map((u) => u.inDays))].map((n) => ({ n, items: UPCOMING.filter((u) => u.inDays === n) }));

  return (
    <div className="mx-auto w-full max-w-310 px-4 pt-8 pb-20 sm:px-6 lg:pt-10">
      <MarketplaceNav current="dashboard" />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex h-6 items-center rounded-full bg-secondary px-2.5 text-micro font-semibold text-muted-foreground">Sample data</span>
          <h1 className="mt-2 text-h1 font-extrabold tracking-tight text-foreground">Lister dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-10 items-center gap-2.5 rounded-full border border-border px-4">
            <Label htmlFor={acceptingId} className="text-small font-semibold">{accepting ? "Accepting bookings" : "Paused"}</Label>
            <Switch id={acceptingId} disabled checked={accepting} onCheckedChange={setAccepting} className="data-[state=checked]:bg-nia-success" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-small font-semibold outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {p.label}
                <ChevronDown aria-hidden className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2">
              <DropdownMenuRadioGroup value={period} onValueChange={(v) => setPeriod(v as Period)}>
                {(Object.keys(PERIODS) as Period[]).map((k) => (
                  <DropdownMenuRadioItem key={k} value={k} className="h-10 rounded-lg text-sm">{PERIODS[k].label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="h-10 rounded-full">
            <Link href="/marketplace/list">
              <Plus aria-hidden data-icon="inline-start" />
              New listing
            </Link>
          </Button>
        </div>
      </div>

      {!accepting && (
        <p role="status" className="mt-5 rounded-xl bg-status-pending px-4 py-3 text-sm font-medium text-status-pending-foreground">
          You&rsquo;re paused. New requests won&rsquo;t come in, and existing bookings stay as they are.
        </p>
      )}

      <section aria-label="Earnings overview" className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="flex flex-wrap justify-between gap-6">
            <div>
              <p className="text-caption font-semibold text-primary-foreground/70">Earnings {period === "this-month" ? "this month" : "last month"}</p>
              <p className="mt-1 text-display leading-none font-extrabold">{dollars(p.earnings)}</p>
              <p className="mt-2 text-small text-nia-success-bg">{p.change}</p>
            </div>
            <div className="text-right">
              <p className="text-caption font-semibold text-primary-foreground/70">Next payout</p>
              <p className="mt-1 text-lead font-bold">
                {dollars(NEXT_PAYOUT.amount)} · {dayFrom(NEXT_PAYOUT.inDays) ? shortDate(dayFrom(NEXT_PAYOUT.inDays)!) : `in ${NEXT_PAYOUT.inDays} days`}
              </p>
              <p className="mt-1 text-caption text-primary-foreground/70">To your bank · connected at launch</p>
            </div>
          </div>
          <div role="group" aria-label="Earnings, last eight weeks" className="flex h-36 items-end gap-2" onPointerLeave={() => setWeek(WEEKLY_EARNINGS.length - 1)}>
            {WEEKLY_EARNINGS.map((w, i) => (
              <button
                key={w.weeksAgo}
                type="button"
                onPointerEnter={() => setWeek(i)}
                onFocus={() => setWeek(i)}
                aria-label={`Week of ${weekLabel(w.weeksAgo)}: ${dollars(w.amount)}`}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className={cn("text-caption font-semibold transition-opacity duration-fast", i === week ? "opacity-100" : "opacity-0")}>{dollars(w.amount)}</span>
                <span
                  className={cn("w-full rounded-t-md transition-colors duration-fast", i === week ? "bg-primary-foreground" : "bg-primary-foreground/20")}
                  style={{ height: `${((w.amount / maxWeek) * 82).toFixed(1)}%` }}
                />
                <span className="text-micro whitespace-nowrap text-primary-foreground/60">{weekLabel(w.weeksAgo)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {p.kpis.map((k) => (
            <div key={k.label} className="flex flex-col gap-1 rounded-2xl border border-border p-4">
              <span className="text-caption font-semibold text-muted-foreground">{k.label}</span>
              <span className="text-h3 font-extrabold">{k.value}</span>
              <span className="text-caption text-muted-foreground">{k.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="mk-req">
          <div className="flex items-center gap-2.5">
            <h2 id="mk-req" className="text-subtitle font-extrabold tracking-tight">Requests</h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-caption font-bold">{pending.length}</span>
          </div>
          <p className="mt-1 text-small text-muted-foreground">Accept within the window or the request expires. Fast replies rank your listings higher.</p>
          <NotYet className="mt-2">Accepting, declining and pausing listings open with Marketplace. These are sample requests.</NotYet>
          <div className="mt-4 flex flex-col gap-3">
            {pending.map((r) => {
              const who = renter(r.renterId);
              const listing = getListing(r.listingIds[0]);
              const img = listing?.images[0];
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-nia-canvas">
                    {img && <Image src={img.src} alt="" fill sizes="64px" className={img.fit === "contain" ? "object-contain p-1.5" : "object-cover"} />}
                  </span>
                  <div className="min-w-0 flex-[1_1_14rem]">
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-caption text-muted-foreground">{range(r)} · {r.handover}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-caption">
                      <span aria-hidden className="grid size-5 place-items-center rounded-full bg-secondary text-tiny font-bold">{initials(who.name)}</span>
                      <span className="font-semibold">{who.name}</span>
                      <span className="text-muted-foreground">
                        {who.rating ? (
                          <>
                            <Star aria-label="Rating" className="mb-0.5 inline size-3 fill-current" /> {who.rating.toFixed(1)} · {who.rentals} rentals
                          </>
                        ) : (
                          "New renter"
                        )}
                        {who.idVerified && " · ID verified"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-caption text-muted-foreground">You earn</span>
                    <span className="text-lead font-extrabold">{dollars(r.payout)}</span>
                    <span className="text-micro text-status-pending-foreground">{countdown(r)}</span>
                  </div>
                  <div className="flex gap-2 max-sm:w-full">
                    <Button variant="outline" size="compact" disabled onClick={() => answer(r.id, "declined")} className="max-sm:flex-1">Decline</Button>
                    <Button size="compact" disabled onClick={() => answer(r.id, "accepted")} className="max-sm:flex-1">Accept</Button>
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">You&rsquo;re all caught up. New requests will appear here.</p>}
          </div>
        </section>

        <section aria-labelledby="mk-up">
          <h2 id="mk-up" className="text-subtitle font-extrabold tracking-tight">Upcoming</h2>
          <div className="mt-4 flex flex-col gap-5">
            {accepted.length > 0 && (
              <DayGroup label="Accepted · awaiting handover">
                {accepted.map((r) => (
                  <Row key={r.id} time={dayFrom(r.startInDays) ? shortDate(dayFrom(r.startInDays)!) : "Soon"} kind="Accepted" title={r.title} who={`${renter(r.renterId).name} · ${r.handover}`} />
                ))}
              </DayGroup>
            )}
            {byDay.map(({ n, items }) => (
              <DayGroup key={n} label={dayLabel(n)}>
                {items.map((u) => (
                  <Row key={`${u.title}-${u.time}`} time={u.time} kind={u.kind} title={u.title} who={`${renter(u.renterId).name} · ${u.where}`} />
                ))}
              </DayGroup>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="mk-lst" className="min-w-0">
          <h2 id="mk-lst" className="text-subtitle font-extrabold tracking-tight">Your listings</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="border-b border-border text-caption text-muted-foreground">
                <tr>
                  {["Item", "Price", "Views", "Booked", "Utilisation", "Earned", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LISTER_LISTINGS.map((row) => {
                  const l = getListing(row.listingId)!;
                  const img = l.images[0];
                  const util = Math.round((row.bookedDays / 30) * 100);
                  const active = !paused[row.listingId];
                  return (
                    <tr key={row.listingId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-nia-canvas">
                            {img && <Image src={img.src} alt="" fill sizes="36px" className={img.fit === "contain" ? "object-contain p-0.5" : "object-cover"} />}
                          </span>
                          <span className="font-semibold whitespace-nowrap">{l.title}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{dayRate(l)}</td>
                      <td className="px-4 py-3">{row.views}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.bookedDays} days</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                            <span className="block h-full rounded-full bg-foreground" style={{ width: `${util}%` }} />
                          </span>
                          {util}%
                        </span>
                      </td>
                      <td className="px-4 py-3">{dollars(row.earned)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-pressed={active}
                          disabled
                          aria-label={`${l.title}: ${active ? "active, press to pause" : "paused, press to make active"}`}
                          onClick={() => setPaused((all) => ({ ...all, [row.listingId]: active }))}
                          className={cn(
                            "inline-flex h-7 items-center rounded-full border px-3 text-caption font-semibold outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                            active ? "border-foreground bg-foreground text-primary-foreground" : "border-nia-line-strong bg-white text-muted-foreground",
                          )}
                        >
                          {active ? "Active" : "Paused"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="mk-an">
          <h2 id="mk-an" className="text-subtitle font-extrabold tracking-tight">Analytics</h2>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border p-5">
            {FUNNEL.map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-bold">{f.value.toLocaleString("en-US")}</span>
                </div>
                <div aria-hidden className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${f.width}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-3 border-t border-border pt-4">
              {ANALYTICS.map((a) => (
                <span key={a.label} className="flex flex-col">
                  <span className="text-caption text-muted-foreground">{a.label}</span>
                  <span className="text-lead font-bold">{a.value}</span>
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-caption text-muted-foreground">You keep 100% of your listed price. Renters pay Nia&rsquo;s service fee and processing on top.</p>
        </section>
      </div>
    </div>
  );
}

function DayGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-caption font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">{children}</div>
    </div>
  );
}

function Row({ time, kind, title, who }: { time: string; kind: Handover | "Accepted"; title: string; who: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-18 shrink-0 text-small font-semibold">{time}</span>
      <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-micro font-semibold", TAG[kind])}>{kind}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-caption text-muted-foreground">{who}</span>
      </span>
    </div>
  );
}
