"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { Card } from "@/components/arc/card/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestTemplates } from "@/features/templates/recommend";
import type { GalleryTemplate } from "@/features/templates/gallery";
import type { UserTemplateProfile } from "@/features/templates/types";
import { useHoverIntent } from "@/features/templates/use-hover-intent";
import { FlatIcon } from "@/features/templates/components/flat-icon";

const NONE = "none";

// "Suggested for you" (TEMPLATES_BUILD.md §4, Ika's C1: uiarc cards) under the Showcase row:
// six templates picked from the person's role and what they've opened and used, each saying
// why. "I work as…" changes the role straight away; "Reset what Nia learned" clears history.
export function SuggestedForYou({
  templates,
  profile,
  ready,
  onRoleChange,
  onReset,
  onPreview,
  className,
}: {
  className?: string;
  templates: GalleryTemplate[];
  profile: UserTemplateProfile;
  ready: boolean;
  onRoleChange: (role: string | null) => void;
  onReset: () => void;
  onPreview: (template: GalleryTemplate, list: GalleryTemplate[], viaHover?: boolean) => void;
}) {
  const roles = [...new Set(templates.flatMap((t) => t.icps))].sort();
  // Someone's onboarding profession may not be one of the template roles yet; keep it choosable.
  if (profile.role && !roles.includes(profile.role)) roles.unshift(profile.role);
  // Worked out in the browser once the person's history has loaded (it reads the clock).
  const suggestions = ready ? suggestTemplates(templates, profile) : [];
  const list = suggestions.map((s) => s.template);
  const learned = profile.events.length > 0;

  return (
    <section aria-labelledby="suggested" className={cn("px-4 md:px-11", className)}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h2 id="suggested" className="text-lg font-extrabold text-foreground">Suggested for you</h2>
          <p className="text-small text-muted-foreground">
            {learned
              ? "Based on your role and the templates you use. It adapts as you work."
              : "Based on your role. It adapts as you open and use templates."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={profile.role ?? NONE} onValueChange={(v) => onRoleChange(v === NONE ? null : v)}>
            <SelectTrigger aria-label="Your role" className="h-9 rounded-full bg-white">
              <span className="text-muted-foreground">I work as</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Choose your role</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {learned && (
            <Button variant="link" size="compact" onClick={onReset} className="text-muted-foreground">
              Reset what Nia learned
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3.5">
        {ready
          ? suggestions.map((s) => (
              <Suggestion key={s.template.code} template={s.template} why={s.why} onPreview={(t, viaHover) => onPreview(t, list, viaHover)} />
            ))
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </section>
  );
}

function Suggestion({ template: t, why, onPreview }: { template: GalleryTemplate; why: string; onPreview: (t: GalleryTemplate, viaHover?: boolean) => void }) {
  const hover = useHoverIntent(() => onPreview(t, true));
  return (
    <div onPointerEnter={hover.onPointerEnter} onPointerLeave={hover.onPointerLeave} className="min-w-0">
      <Card
        title={t.name}
        media={
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-white">
            <FlatIcon name={t.icon} size="md" className="size-11" />
          </div>
        }
        avatar={<Image src="/icon.png" alt="" width={24} height={24} className="size-6 rounded-full" />}
        meta={t.stage}
        status={why}
        action={
          <Button
            variant="outline"
            size="compact"
            onClick={() => {
              hover.cancel();
              onPreview(t);
            }}
            aria-label={`Preview ${t.name}`}
          >
            Preview
          </Button>
        }
      />
    </div>
  );
}
