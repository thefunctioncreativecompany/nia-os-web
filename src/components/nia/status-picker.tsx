"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { StatusBadge, type ProductionStatus } from "@/components/nia/status-badge";

const OPTIONS: { value: ProductionStatus | "unavailable"; dot: string }[] = [
  { value: "confirmed", dot: "bg-nia-success" },
  { value: "pending", dot: "bg-status-pending-foreground" },
  { value: "on-hold", dot: "bg-status-on-hold-foreground" },
  { value: "cancelled", dot: "bg-nia-danger" },
  { value: "unavailable", dot: "bg-muted-foreground" },
];

export type TalentStatus = (typeof OPTIONS)[number]["value"];

// Change someone's status, and choose whether to tell them (Figma cast & crew
// "status-dropdown"). Put it in a <Popover> or menu.
export function StatusPicker({
  value,
  onChange,
  notify,
  onNotifyChange,
  className,
}: {
  value: TalentStatus;
  onChange: (next: TalentStatus) => void;
  notify: boolean;
  onNotifyChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-64 flex-col", className)}>
      <span id="status-picker-label" className="px-2.5 py-2 text-micro font-bold text-muted-foreground">Update status</span>
      <div role="radiogroup" aria-labelledby="status-picker-label" className="flex flex-col gap-0.5">
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                selected && "bg-nia-success-bg/60 hover:bg-nia-success-bg/60",
              )}
            >
              <span aria-hidden className={cn("size-1.5 rounded-full", option.dot)} />
              {option.value === "unavailable" ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-bold text-muted-foreground">Unavailable</span>
              ) : (
                <StatusBadge status={option.value} />
              )}
              {selected && <Check aria-hidden className="ml-auto size-4 text-nia-success" />}
            </button>
          );
        })}
      </div>
      <label className="mt-1 flex items-center justify-between border-t border-border px-2.5 pt-2.5 pb-1 text-small text-foreground">
        Tell them about the change
        <Switch checked={notify} onCheckedChange={onNotifyChange} />
      </label>
    </div>
  );
}
