import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ProductionStatus = "confirmed" | "pending" | "on-hold" | "wrapped" | "cancelled";

const LABELS: Record<ProductionStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  "on-hold": "On Hold",
  wrapped: "Wrapped",
  cancelled: "Cancelled",
};

// Status pill for people, shoot days and projects (Figma: Script Breakdown, Cast & Crew).
export function StatusBadge({
  status,
  className,
}: {
  status: ProductionStatus;
  className?: string;
}) {
  return (
    <Badge variant={status} className={cn(className)}>
      {LABELS[status]}
    </Badge>
  );
}
