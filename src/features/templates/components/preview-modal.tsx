"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { sentenceCase } from "@/lib/sentence-case";
import { WORKFLOWS } from "@/lib/template-workflows";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PrevNext, SidePanel } from "@/components/nia/side-panel";
import { loadTemplatePreview, type TemplatePreview } from "@/features/templates/actions";
import { COMING_SOON, works, type GalleryTemplate } from "@/features/templates/gallery";
import { DocMiniature } from "@/features/templates/components/doc-miniature";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { TemplateValue } from "@/features/templates/components/template-value";
import { voiceFor } from "@/features/templates/tutorial/voice";

// The mini tutorial (Ika, 2026-10-31) is its own download: Remotion's player loads with it.
const TutorialPlayer = dynamic(() => import("@/features/templates/tutorial/tutorial-player").then((m) => m.TutorialPlayer), { ssr: false });

// The template preview pop-up (TEMPLATES_BUILD.md §5, prototype PreviewModal): group and
// code, title, "Use this template", a miniature of the document (or the workflow map),
// description, keywords and About, then What it does, How to use, FAQ and Related templates as
// fold-out rows. Expand / shrink,
// previous / next (← →) within the list it was opened from, Escape or outside to close.
// Full screen on phones. PreviewPanel shows the same thing docked on the right (A/B, Ika
// 2026-11-14: "a right panel open for … template preview", like Claude's artifacts panel).
type PreviewProps = {
  template: GalleryTemplate;
  list: GalleryTemplate[];
  onNavigate: (template: GalleryTemplate) => void;
  onClose: () => void;
  onUse: (template: GalleryTemplate) => void;
};

export function PreviewModal(props: PreviewProps) {
  const [wide, setWide] = useState(false);
  const preview = usePreview(props.template, props.list, props.onNavigate);
  return (
    <Dialog open onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={preview.onKeyDown}
        className={cn(
          "flex max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "max-sm:h-svh max-sm:w-screen max-sm:rounded-none",
          wide ? "sm:h-[calc(100svh-1.5rem)] sm:w-[calc(100vw-1.5rem)]" : "sm:h-[min(92svh,62.5rem)] sm:w-[min(73.75rem,calc(100vw-3rem))]",
        )}
      >
        <PreviewBar {...props} {...preview} wide={wide} onWide={() => setWide((w) => !w)} close={<DialogClose asChild><CloseButton /></DialogClose>} />
        <PreviewBody {...props} {...preview} Title={DialogTitle} Description={DialogDescription} />
      </DialogContent>
    </Dialog>
  );
}

// The same preview docked on the right of the page on computers (SidePanel).
export function PreviewPanel(props: PreviewProps) {
  const preview = usePreview(props.template, props.list, props.onNavigate);
  return (
    <SidePanel
      label={`${props.template.name}, template preview`}
      onClose={props.onClose}
      onKeyDown={preview.onKeyDown}
      tools={<PrevNext prev={preview.prev} next={preview.next} onNavigate={props.onNavigate} />}
    >
      <PreviewBody {...props} {...preview} Title="h2" Description="p" />
    </SidePanel>
  );
}

function CloseButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Close" {...props}>
      <X />
    </Button>
  );
}

// What both forms share: the template's copy (loaded from the server when shown), its neighbours
// in the list it was opened from, and the arrow keys.
function usePreview(t: GalleryTemplate, list: GalleryTemplate[], onNavigate: (template: GalleryTemplate) => void) {
  const [loaded, setLoaded] = useState<{ code: string; data: TemplatePreview | null } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const index = list.findIndex((x) => x.code === t.code);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  const open = works(t);
  const preview = loaded?.code === t.code ? loaded.data : undefined;
  const workflow = t.kind === "workflow" ? WORKFLOWS[t.slug] : undefined;
  // A template that works plays its mini tutorial in the picture box (not under reduced motion).
  const reduce = useReducedMotion();
  const tutorial =
    open && preview && !workflow && !reduce
      ? {
          code: t.code,
          name: t.name,
          icon: t.icon,
          stage: t.stage,
          forYou: t.forYou ?? null,
          forTeam: t.forTeam ?? null,
          steps: preview.details.howTo,
          sections: (preview.schema?.sections ?? []).map((x) => x.title),
          voice: voiceFor(t.code),
        }
      : null;

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

  return { scroller, prev, next, open, preview, workflow, tutorial, onKeyDown };
}

type Shared = ReturnType<typeof usePreview> & PreviewProps;

function PreviewBar({ prev, next, onNavigate, wide, onWide, close }: Shared & { wide: boolean; onWide: () => void; close: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-3.5 py-3">
      <Button variant="ghost" size="icon-sm" onClick={onWide} aria-label={wide ? "Shrink" : "Expand"} className="hidden sm:inline-flex">
        {wide ? <Minimize2 /> : <Maximize2 />}
      </Button>
      <span aria-hidden className="mx-1.5 hidden h-4.5 w-px bg-border sm:block" />
      <PrevNext prev={prev} next={next} onNavigate={onNavigate} />
      <div className="flex-1" />
      {close}
    </div>
  );
}

function PreviewBody({
  template: t,
  scroller,
  open,
  preview,
  workflow,
  tutorial,
  onNavigate,
  onUse,
  Title,
  Description,
}: Shared & { Title: React.ElementType; Description: React.ElementType }) {
  return (
    <div ref={scroller} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-270 px-4 pt-8.5 pb-14 sm:px-9.5">
        <p className="flex flex-wrap items-center gap-2.5 text-micro font-semibold text-muted-foreground">
          {t.group ? sentenceCase(t.group) : COMING_SOON} · {t.sku}
        </p>
        <Title className="mt-2.5 mb-4 text-display leading-tight font-semibold tracking-tight text-foreground">{t.name}</Title>

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
          ) : tutorial ? (
            <TutorialPlayer key={t.code} tutorial={tutorial} className="w-full max-w-[calc(min(48svh,29.5rem)*16/9)] p-2" />
          ) : (
            <DocMiniature icon={t.icon} name={t.name} schema={preview?.schema ?? null} workflow={workflow} />
          )}
        </div>

        <Description className="mt-6 max-w-225 text-lead leading-relaxed text-foreground/80">
          {t.preview ?? preview?.details.about[0] ?? `${t.name} is coming soon.`}
        </Description>
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

            {/* The description, tags and About show; everything else folds out, FAQ style (Ika, 2026-11-14). */}
            <Accordion type="multiple" className="mt-6 max-w-225 border-y border-border">
                {(t.forYou || t.forTeam) && (
                  <AccordionItem value="value" className="border-border">
                    <AccordionTrigger className={foldTrigger}>What it does for you and your team</AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <TemplateValue template={t} />
                    </AccordionContent>
                  </AccordionItem>
                )}
                {preview.details.howTo.length > 0 && (
                  <AccordionItem value="how-to" className="border-border">
                    <AccordionTrigger className={foldTrigger}>How to use the {t.name}</AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <ol className="flex flex-col gap-3">
                        {preview.details.howTo.map((step, i) => (
                          <li key={i} className="flex items-start gap-3.5 text-lead leading-normal text-foreground/80">
                            <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-border text-micro text-foreground">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {preview.details.faq.map((f) => (
                  <AccordionItem key={f.q} value={f.q} className="border-border">
                    <AccordionTrigger className={foldTrigger}>{f.q}</AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <p className="text-lead leading-relaxed text-foreground/80">{f.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {preview.related.length > 0 && (
                  <AccordionItem value="related" className="border-border">
                    <AccordionTrigger className={foldTrigger}>Related templates</AccordionTrigger>
                    <AccordionContent className="pb-5">
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
                    </AccordionContent>
                  </AccordionItem>
                )}
            </Accordion>
          </>
        )}
      </div>
    </div>
  );
}

// A fold-out row in the preview: the question or "How to use", in the body text size.
const foldTrigger = "py-4 text-lead font-semibold text-foreground hover:no-underline";

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8.5 mb-3 text-subtitle font-bold tracking-tight text-foreground">{children}</h3>;
}
