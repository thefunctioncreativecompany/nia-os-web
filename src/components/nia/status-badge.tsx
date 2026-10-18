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
// `children` renames the label while keeping the colour (e.g. "Ready" in the confirmed green).
export function StatusBadge({
  status,
  className,
  children,
}: {
  status: ProductionStatus;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge variant={status} className={cn(className)}>
      {children ?? LABELS[status]}
    </Badge>
  );
}
