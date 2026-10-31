import { FileText, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

function formatSize(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;
}

// One file uploading: name, bar, size so far, cancel (design system Section 14.6).
export function UploadProgress({
  name,
  loaded,
  total,
  onCancel,
  className,
}: {
  name: string;
  loaded: number;
  total: number;
  onCancel?: () => void;
  className?: string;
}) {
  const percent = total > 0 ? (loaded / total) * 100 : 0;
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-2.5">
        <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{name}</span>
        {onCancel && (
          <button
            type="button"
            aria-label={`Cancel uploading ${name}`}
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>
      <Progress value={percent} aria-label={`Uploading ${name}`} />
      <span className="text-micro text-muted-foreground">
        {formatSize(loaded)} / {formatSize(total)}
      </span>
    </div>
  );
}
