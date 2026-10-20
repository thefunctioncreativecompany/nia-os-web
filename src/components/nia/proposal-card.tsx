import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const actionClassName = "h-auto rounded-sm px-4 py-2 text-caption leading-normal font-bold";

// Something Copilot suggests, which changes nothing until the producer applies it
// (Figma: Copilot "NIA Bubble" 840:32496). Pass the suggestion as children.
export function ProposalCard({
  children,
  onApply,
  onModify,
  applyLabel = "Apply changes",
  isApplying = false,
  className,
}: {
  children: React.ReactNode;
  onApply: () => void;
  onModify: () => void;
  applyLabel?: string;
  isApplying?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg rounded-bl-sm border border-border bg-card p-4 text-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-2 text-sm leading-normal font-medium">{children}</div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" size="compact" disabled={isApplying} onClick={onApply} className={actionClassName}>
          {isApplying ? "Applying…" : applyLabel}
        </Button>
        <Button type="button" size="compact" variant="outline" onClick={onModify} className={actionClassName}>
          Modify
        </Button>
      </div>
    </div>
  );
}
