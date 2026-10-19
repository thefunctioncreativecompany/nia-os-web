"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { FlatIcon } from "@/features/templates/components/flat-icon";
import { PreviewModal } from "@/features/templates/components/preview-modal";
import type { GalleryTemplate } from "@/features/templates/gallery";
import { suggestTemplates } from "@/features/templates/recommend";
import { useHoverIntent } from "@/features/templates/use-hover-intent";
import { useTemplateProfile } from "@/features/templates/use-template-profile";

const SHOWN = 8;
// Before anything is learned: the everyday production paperwork.
const STARTERS = ["D01", "D13", "D07", "D24", "D08", "D14", "D05", "D03"];

// "Start from a template" on Home (H4, Ika 2026-10-19): cards the width of the project cards,
// icon beside the name with the stage under it. Recently viewed first, then Suggested for you.
// Pointing at one (0.8s) or tapping it opens the preview here on Home, and closing it stays on
// Home; only "Use this template" leaves, into the editor.
export function HomeTemplates({ templates, editable }: { templates: GalleryTemplate[]; editable: string[] }) {
  const router = useRouter();
  const learning = useTemplateProfile();
  const [open, setOpen] = useState<GalleryTemplate | null>(null);
  const quietUntil = useRef(0);

  const byCode = new Map(templates.map((t) => [t.code, t]));
  const recent = learning.profile.events
    .filter((e) => e.type === "view" || e.type === "use")
    .sort((a, b) => b.at - a.at)
    .map((e) => e.code);
  const suggested = learning.ready ? suggestTemplates(templates, learning.profile).map((s) => s.template.code) : [];
  const order = [...new Set([...recent, ...suggested, ...STARTERS])];
  const shown = order.map((code) => byCode.get(code)).filter((t): t is GalleryTemplate => !!t && t.status !== "gap").slice(0, SHOWN);

  // Every template shown in the preview counts as a view, as on the Templates page.
  const openCode = open?.code;
  useEffect(() => {
    if (openCode) learning.record(openCode, "view");
    // record is a fresh function each render; only a newly shown template should count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCode]);

  const show = (t: GalleryTemplate, viaHover = false) => {
    // Hover never replaces an open preview, and waits a moment after one closes.
    if (viaHover && (open || Date.now() < quietUntil.current)) return;
    setOpen(t);
  };
  const close = () => {
    quietUntil.current = Date.now() + 1500;
    setOpen(null);
  };
  const use = (t: GalleryTemplate) => {
    learning.record(t.code, "use");
    if (editable.includes(t.code)) return router.push(`/templates/${t.code}`);
    close();
    toast(t.kind === "workflow" ? "The project launcher comes in a later build step." : `${t.name} opens in the document editor, which is coming soon.`);
  };

  return (
    <section aria-labelledby="templates" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileText aria-hidden className="size-4.5 text-muted-foreground" />
        <h2 id="templates" className="text-base leading-normal font-bold text-foreground">
          Start from a template
        </h2>
      </div>
      {/* Room above and below inside the scroller so a card's hover shadow isn't cut off. Four
          per row on wide screens, the width of the Recent projects cards. */}
      <div className="-mx-4 -my-5 flex snap-x scroll-px-4 gap-6 overflow-x-auto px-4 py-5 md:-mx-6 md:scroll-px-6 md:px-6">
        {learning.ready
          ? shown.map((t) => <TemplateTile key={t.code} template={t} onOpen={show} />)
          : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-19 w-[78%] shrink-0 rounded-xl sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]" />)}
      </div>
      {open && <PreviewModal template={open} list={shown} onNavigate={setOpen} onClose={close} onUse={use} />}
    </section>
  );
}

function TemplateTile({ template: t, onOpen }: { template: GalleryTemplate; onOpen: (t: GalleryTemplate, viaHover?: boolean) => void }) {
  const hover = useHoverIntent(() => onOpen(t, true));
  return (
    <button
      type="button"
      onClick={() => {
        hover.cancel();
        onOpen(t);
      }}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      className="flex w-[78%] shrink-0 snap-start items-center gap-3.5 rounded-xl border border-border bg-white p-4 text-left outline-none transition-[box-shadow,border-color,translate] duration-base ease-out hover:-translate-y-0.5 hover:border-ring hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)] motion-reduce:hover:translate-y-0"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
        <FlatIcon name={t.icon} size="sm" className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm leading-[1.4] font-bold text-foreground">{t.name}</span>
        <span className="block truncate text-small text-muted-foreground">{t.stage}</span>
      </span>
    </button>
  );
}
