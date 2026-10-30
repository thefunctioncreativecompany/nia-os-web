"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NewMarker, dayLabel } from "@/components/nia/new-marker";
import { grainFor, type GalleryTemplate } from "@/features/templates/gallery";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { TemplateValue } from "@/features/templates/components/template-value";

// New templates, announced once on Home (Ika, 2026-10-28): the newest one with what it does
// for you and your team, and the others by name. Using one or closing the card marks them all
// announced on the account (`templates_announced` in the sign-in metadata), so it doesn't come
// back on another device.
export function NewTemplatesNotice({ templates, announced }: { templates: GalleryTemplate[]; announced: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [lead, ...others] = templates;

  const markAnnounced = async () => {
    const supabase = createClient();
    const codes = [...new Set([...announced, ...templates.map((t) => t.code)])];
    const { error } = await supabase.auth.updateUser({ data: { templates_announced: codes } });
    // The sign-in token carries the list; refresh it so Home stops showing the card.
    if (!error) await supabase.auth.refreshSession();
  };
  const close = () => {
    setOpen(false);
    void markAnnounced();
  };
  const use = (t: GalleryTemplate) => {
    void markAnnounced();
    router.push(`/templates/${t.code}`);
  };

  if (!open || !lead) return null;
  return (
    <section aria-labelledby="new-templates" className="relative flex flex-col overflow-hidden rounded-2xl border border-gold/50 bg-white sm:flex-row">
      <span className={`grid min-h-24 place-items-center sm:min-h-32 sm:w-48 sm:flex-none ${grainFor(lead.code)}`}>
        <span className="grid size-16 place-items-center rounded-2xl bg-white shadow-elevation-2 sm:size-20">
          <FlatIcon name={lead.icon} size="md" className="size-9 sm:size-11" />
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 pr-14 sm:p-6 sm:pr-14">
        <div>
          {lead.launched && <NewMarker label={`New template · added ${dayLabel(lead.launched)}`} />}
          <h2 id="new-templates" className="mt-2.5 text-h3 font-bold tracking-tight text-foreground">{lead.name}</h2>
          <p className="text-small text-muted-foreground">{lead.stage}</p>
        </div>
        <TemplateValue template={lead} />
        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => use(lead)}>
            Use this template <ArrowRight aria-hidden />
          </Button>
          <Button asChild variant="outline">
            <Link href={`/templates?preview=${lead.code}`} onClick={() => void markAnnounced()}>Preview</Link>
          </Button>
          {/* A few by name, then the rest on Templates' Just added row (Ika, 2026-10-30: 20 at once read as a wall). */}
          {others.length > 0 && (
            <p className="text-small text-muted-foreground">
              Also new:{" "}
              {others.slice(0, 3).map((t, i) => (
                <span key={t.code}>
                  {i > 0 && ", "}
                  <Link href={`/templates?preview=${t.code}`} onClick={() => void markAnnounced()} className="font-semibold text-foreground underline-offset-4 hover:underline">
                    {t.name}
                  </Link>
                </span>
              ))}
              {others.length > 3 && (
                <>
                  {" "}and{" "}
                  <Link href="/templates" onClick={() => void markAnnounced()} className="font-semibold text-foreground underline-offset-4 hover:underline">
                    {others.length - 3} more
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close" className="absolute top-3 right-3">
        <X />
      </Button>
    </section>
  );
}
