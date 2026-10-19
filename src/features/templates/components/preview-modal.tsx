"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORKFLOWS } from "@/lib/template-workflows";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { loadTemplatePreview, type TemplatePreview } from "@/features/templates/actions";
import { COMING_SOON, works, type GalleryTemplate } from "@/features/templates/gallery";
import { DocMiniature } from "@/features/templates/components/doc-miniature";
import { FlatIcon } from "@/features/templates/components/flat-icon";

// The template preview pop-up (TEMPLATES_BUILD.md §5, prototype PreviewModal): group and
// code, title, "Use this template", a miniature of the document (or the workflow map),
// description and keywords, About, How to use, FAQ and Related templates. Expand / shrink,
// previous / next (← →) within the list it was opened from, Escape or outside to close.
// Full screen on phones.
export function PreviewModal({
  template: t,
  list,
  onNavigate,
  onClose,
  onUse,
}: {
  template: GalleryTemplate;
  list: GalleryTemplate[];
  onNavigate: (template: GalleryTemplate) => void;
  onClose: () => void;
  onUse: (template: GalleryTemplate) => void;
}) {
  const [wide, setWide] = useState(false);
  const [loaded, setLoaded] = useState<{ code: string; data: TemplatePreview | null } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const index = list.findIndex((x) => x.code === t.code);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  const open = works(t);
  const preview = loaded?.code === t.code ? loaded.data : undefined;
  const workflow = t.kind === "workflow" ? WORKFLOWS[t.slug] : undefined;

  // Each template's copy comes from the server when it's shown; back to the top on every change.
  useEffect(() => {
    let live = true;
    void loadTemplatePreview(t.code).then((data) => live && setLoaded({ code: t.code, data }));
    scroller.current?.scrollTo({ top: 0 });
    return () => {
      live = false;
    };
  }, [t.code]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Arrow keys move between templates unless someone is typing.
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight" && next) onNavigate(next);
    if (e.key === "ArrowLeft" && prev) onNavigate(prev);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        className={cn(
          "flex max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "max-sm:h-svh max-sm:w-screen max-sm:rounded-none",
          wide ? "sm:h-[calc(100svh-1.5rem)] sm:w-[calc(100vw-1.5rem)]" : "sm:h-[min(92svh,62.5rem)] sm:w-[min(73.75rem,calc(100vw-3rem))]",
        )}
      >
        <div className="flex items-center gap-1 border-b border-border px-3.5 py-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setWide((w) => !w)} aria-label={wide ? "Shrink" : "Expand"} className="hidden sm:inline-flex">
            {wide ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <span aria-hidden className="mx-1.5 hidden h-4.5 w-px bg-border sm:block" />
          <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label={prev ? `Previous: ${prev.name}` : "Previous"}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => next && onNavigate(next)} aria-label={next ? `Next: ${next.name}` : "Next"}>
            <ChevronRight />
          </Button>
          <div className="flex-1" />
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-270 px-4 pt-8.5 pb-14 sm:px-9.5">
            <p className="text-micro font-semibold text-muted-foreground">
              {t.group ?? COMING_SOON} · {t.sku}
            </p>
            <DialogTitle className="mt-2.5 mb-4 text-display leading-tight font-semibold tracking-tight text-foreground">{t.name}</DialogTitle>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image src="/icon.png" alt="" width={34} height={34} className="size-8.5 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Nia</p>
                  <p className="text-small text-muted-foreground">Official template · {t.stage}</p>
                </div>
              </div>
              <Button disabled={!open} onClick={() => onUse(t)} className="px-6.5">
                {open ? "Use this template" : COMING_SOON}
              </Button>
            </div>

            <div className="mt-6.5 flex h-[48svh] max-h-118 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/60">
              {preview === undefined ? (
                <Skeleton className="size-[86%] rounded-lg" />
              ) : (
                <DocMiniature icon={t.icon} name={t.name} schema={preview?.schema ?? null} workflow={workflow} />
              )}
            </div>

            <DialogDescription className="mt-6 max-w-225 text-lead leading-relaxed text-foreground/80">
              {t.preview ?? preview?.details.about[0] ?? `${t.name} is coming soon.`}
            </DialogDescription>
            <ul className="mt-3.5 flex flex-wrap gap-2">
              {[...t.keywords.slice(0, 7), t.stage].map((k) => (
                <li key={k} className="rounded-full bg-secondary px-3 py-1.5 text-small text-foreground/80">{k}</li>
              ))}
            </ul>

            {preview === undefined ? (
              <div className="mt-9 flex max-w-225 flex-col gap-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : preview && (
              <>
                <Heading>About this template</Heading>
                {preview.details.about.map((p, i) => (
                  <p key={i} className="mb-3 max-w-225 text-lead leading-relaxed text-foreground/80">{p}</p>
                ))}

                {preview.details.howTo.length > 0 && (
                  <>
                    <Heading>How to use the {t.name}</Heading>
                    <ol className="flex flex-col gap-3">
                      {preview.details.howTo.map((step, i) => (
                        <li key={i} className="flex items-start gap-3.5 text-lead leading-normal text-foreground/80">
                          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-border text-micro text-foreground">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {preview.details.faq.length > 0 && (
                  <>
                    <Heading>Frequently asked questions</Heading>
                    <dl className="flex max-w-225 flex-col gap-4.5">
                      {preview.details.faq.map((f) => (
                        <div key={f.q}>
                          <dt className="mb-1.25 text-lead font-bold text-foreground">{f.q}</dt>
                          <dd className="text-lead leading-relaxed text-foreground/80">{f.a}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}

                {preview.related.length > 0 && (
                  <>
                    <Heading>Related templates</Heading>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16.25rem),1fr))] gap-4.5">
                      {preview.related.map((r) => (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => onNavigate(r)}
                          aria-label={`Preview ${r.name}`}
                          className="group rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span className={cn("flex h-37.5 items-center justify-center rounded-xl border border-border bg-secondary/60 transition-colors duration-fast group-hover:border-ring", !works(r) && "opacity-50")}>
                            <FlatIcon name={r.icon} size="md" className="size-16" />
                          </span>
                          <span className="mt-2.5 flex items-baseline justify-between gap-2">
                            <span className="text-lead font-semibold text-foreground">{r.name}</span>
                            <span className="text-meta text-muted-foreground">{r.sku}</span>
                          </span>
                          <span className="mt-0.5 block text-small text-muted-foreground">{works(r) ? `Nia · ${r.stage}` : COMING_SOON}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8.5 mb-3 text-subtitle font-bold tracking-tight text-foreground">{children}</h3>;
}
