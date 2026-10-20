"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FREE_LIMITS, PAID_UPLOAD_MB, PLANS, money } from "@/lib/plans";

export type UpgradeReason = "explore" | "projects" | "documents" | "duplicate" | "collaborators" | "branding" | "upload";

const COPY: Record<UpgradeReason, { title: string; body: string }> = {
  explore: {
    title: "Start from a film on a paid plan",
    body: "Opening a film's press kit and documents, and starting a project from it, comes with every paid plan.",
  },
  projects: {
    title: `You have ${FREE_LIMITS.projects} projects`,
    body: `A free workspace holds up to ${FREE_LIMITS.projects} projects. Paid plans have no limit.`,
  },
  documents: {
    title: `This project has ${FREE_LIMITS.documentsPerProject} documents`,
    body: `On Free a project holds up to ${FREE_LIMITS.documentsPerProject} documents. Paid plans have no limit.`,
  },
  duplicate: {
    title: "One of each document on Free",
    body: "On Free a project keeps one of each kind of document. Paid plans let you keep several, like a call sheet for every shoot day.",
  },
  collaborators: {
    title: "Bring in the whole team",
    body: `On Free a project can be shared with ${FREE_LIMITS.collaboratorsPerProject} person. Paid plans let you invite everyone on the production.`,
  },
  branding: {
    title: "Export with your own branding",
    body: "Downloads on Free carry the Nia footer. Paid plans let you remove it.",
  },
  upload: {
    title: `That file is over ${FREE_LIMITS.uploadMb} MB`,
    body: `Free uploads are up to ${FREE_LIMITS.uploadMb} MB each. Paid plans take files up to ${PAID_UPLOAD_MB} MB.`,
  },
};

const EVENT = "nia:upgrade";

/** Opens the upgrade prompt from anywhere (a limit reached, a paid feature tapped). */
export function openUpgrade(reason: UpgradeReason) {
  window.dispatchEvent(new CustomEvent<UpgradeReason>(EVENT, { detail: reason }));
}

// The upgrade prompt (Ika, 2026-10-20): what the free plan stops at, the paid plans in brief and a
// way to the full Plans page. Mounted once in the app shell; `openUpgrade` shows it.
export function UpgradeDialog() {
  const [reason, setReason] = useState<UpgradeReason | null>(null);

  useEffect(() => {
    const show = (e: Event) => setReason((e as CustomEvent<UpgradeReason>).detail);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  const copy = reason ? COPY[reason] : null;
  const paid = PLANS.filter((p) => p.id !== "free" && p.id !== "enterprise");

  return (
    <Dialog open={reason !== null} onOpenChange={(open) => !open && setReason(null)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-120 gap-5 rounded-2xl p-6 sm:max-w-120 sm:p-7">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-h3 font-semibold tracking-tight">{copy?.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{copy?.body}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {paid.map((plan) => (
            <li key={plan.id} className="flex items-center gap-3 px-4 py-3">
              <Check aria-hidden className="size-4 shrink-0 text-status-confirmed-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{plan.name}</span>
                <span className="block truncate text-small text-muted-foreground">{plan.tagline}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {money(plan.monthly)}
                <span className="text-small font-normal text-muted-foreground">{plan.unit}</span>
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-row justify-end gap-2.5 sm:justify-end">
          <Button variant="outline" onClick={() => setReason(null)}>
            Not now
          </Button>
          <Button asChild onClick={() => setReason(null)}>
            <Link href="/plans">
              See all plans
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
