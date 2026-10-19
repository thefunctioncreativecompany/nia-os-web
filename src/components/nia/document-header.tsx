import Link from "next/link";
import { Download } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type DocumentViewer = { name: string; avatarUrl?: string | null };

// Top of a document in the editor (Figma: Call Sheet editor "Back Navigation" + "Header
// Area"): back link, title in the accent serif, description, and on the right the save
// status and who else has it open.
export function DocumentHeader({
  backHref,
  backLabel,
  title,
  description,
  status,
  viewers = [],
  className,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  // Usually a <SavedIndicator />.
  status?: React.ReactNode;
  viewers?: DocumentViewer[];
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-9", className)}>
      <Link
        href={backHref}
        className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground print:hidden outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← {backLabel}
      </Link>
      <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-[500px] flex-col gap-2">
          <h1 className="text-h1 font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm leading-normal text-muted-foreground">{description}</p>
          )}
        </div>
        {(status || viewers.length > 0) && (
          <div className="flex items-center gap-4">
            {status}
            {viewers.length > 0 && (
              <div className="flex items-center">
                {viewers.map((viewer) => (
                  <Avatar
                    key={viewer.name}
                    title={viewer.name}
                    className="-mr-2 size-6 ring-2 ring-background last:mr-0"
                  >
                    {viewer.avatarUrl && <AvatarImage src={viewer.avatarUrl} alt={viewer.name} />}
                    <AvatarFallback className="bg-accent text-meta font-bold text-foreground">
                      {getInitials(viewer.name, "")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Label row at the top of the preview panel beside a document (Figma "DetailsHeader"), in
// sentence case (F1). `status` is the document's state, e.g. "Draft" or "Ready to export".
export function DocumentPreviewHeader({ status = "Ready to export", className }: { status?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between text-micro whitespace-nowrap", className)}>
      <p className="font-bold text-muted-foreground">Preview</p>
      <p role="status" className="text-nia-placeholder">{status}</p>
    </div>
  );
}

// Secondary action under the preview (Figma: "Download PDF" in the editor's preview panel).
export function DownloadPdfButton({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "variant">) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-auto gap-2 rounded-lg p-3 text-small font-semibold", className)}
      {...props}
    >
      <Download aria-hidden />
      Download PDF
    </Button>
  );
}
