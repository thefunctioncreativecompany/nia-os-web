"use client";

import { useState } from "react";
import { AlertCircle, ShieldCheck, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// "Are you sure?" before something hard to take back (design system Section 6.1 /
// 12.1). The confirm button stays busy while `onConfirm` runs; throw to keep it open.
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
  onConfirm,
  children,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  // danger: red (deletes); warning: amber (discard); info: blue (permissions).
  tone?: "danger" | "warning" | "info" | "default";
  icon?: LucideIcon;
  onConfirm: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const Icon = icon ?? (tone === "info" ? ShieldCheck : AlertCircle);
  const tint = {
    danger: "bg-status-cancelled text-nia-danger",
    warning: "bg-status-pending text-status-pending-foreground",
    info: "bg-status-on-hold text-status-on-hold-foreground",
    default: "bg-muted text-foreground",
  }[tone];
  const [busy, setBusy] = useState(false);

  const confirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-[440px] gap-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tint)}>
            <Icon aria-hidden className="size-5" />
          </span>
          <AlertDialogTitle className="text-left text-lg">{title}</AlertDialogTitle>
        </div>
        <AlertDialogDescription className="text-sm leading-normal text-muted-foreground">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={tone === "danger" || tone === "warning" ? "danger" : "default"} disabled={busy} onClick={confirm}>
            {busy ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
