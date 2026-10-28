import { User, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GalleryTemplate } from "@/features/templates/gallery";

// What a template does for the person using it and for their team (launches.ts), side by side.
export function TemplateValue({ template: t, className }: { template: Pick<GalleryTemplate, "forYou" | "forTeam">; className?: string }) {
  if (!t.forYou && !t.forTeam) return null;
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {t.forYou && <Value icon={User} title="For you">{t.forYou}</Value>}
      {t.forTeam && <Value icon={Users} title="For your team">{t.forTeam}</Value>}
    </dl>
  );
}

function Value({ icon: Icon, title, children }: { icon: typeof User; title: string; children: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <dt className="flex items-center gap-1.5 text-small font-semibold text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        {title}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}
