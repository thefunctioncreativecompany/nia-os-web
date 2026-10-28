import {
  AlarmClock,
  Aperture,
  AudioWaveform,
  Award,
  Book,
  Brush,
  Calculator,
  CalendarDays,
  CalendarRange,
  Camera,
  ChartColumn,
  Clapperboard,
  ClipboardList,
  Contact,
  CookingPot,
  Disc3,
  Drama,
  Dumbbell,
  Film,
  FolderOpen,
  Headphones,
  House,
  IdCard,
  Image,
  Lamp,
  ListOrdered,
  Mail,
  MessagesSquare,
  Mic,
  Music,
  NotebookPen,
  Orbit,
  PackageOpen,
  Palette,
  PanelsTopLeft,
  PenTool,
  Phone,
  Plug,
  Presentation,
  Receipt,
  Ruler,
  Scan,
  Scissors,
  ScrollText,
  Shirt,
  Signpost,
  SlidersHorizontal,
  Smartphone,
  Sparkle,
  Sparkles,
  Stamp,
  StickyNote,
  Tag,
  Zap,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";

import type { Stage, TemplateEntry } from "./types";

// What the gallery views need from each template. The page loads the full manifest on the
// server and sends only this to the browser (the pop-up copy in `details` stays behind).
export type GalleryTemplate = Pick<
  TemplateEntry,
  "code" | "sku" | "slug" | "name" | "kind" | "family" | "stage" | "status" | "icon" | "preview" | "keywords" | "icps" | "object" | "group" | "tags" | "related"
> & {
  /** Opens in the editor today (set on the server). Others are greyed out as "Coming soon". */
  ready?: boolean;
  /** What it does for the person using it, and for their team (launches.ts). */
  forYou?: string;
  forTeam?: string;
  /** The day it went live, and whether it's still new (launches.ts; set on the server). */
  launched?: string;
  fresh?: boolean;
};

/** Whether "Use this template" works for it yet (Ika, 2026-10-19: grey out the rest). */
export const works = (t: Pick<GalleryTemplate, "ready">) => t.ready === true;

export const toGallery = ({ code, sku, slug, name, kind, family, stage, status, icon, preview, keywords, icps, object, group, tags, related }: TemplateEntry): GalleryTemplate => ({
  code, sku, slug, name, kind, family, stage, status, icon, preview, keywords, icps, object, group, tags, related,
});

export const STAGES: Stage[] = ["Pre-production", "Production", "Post-production"];
export const FILTERS = ["All", ...STAGES, "Administrative", "Camera & Visual"] as const;
export type Filter = (typeof FILTERS)[number];

export const inFilter = (t: GalleryTemplate, filter: Filter) =>
  filter === "All" || t.stage === filter || t.tags.includes(filter);

// Templates not built yet say "Coming soon" (Ika's wording; the build guide says "In design").
export const COMING_SOON = "Coming soon";

// One Lucide icon per manifest `icon` value. Our rules allow Lucide icons only, so the
// prototype's hand-drawn glyphs are matched as closely as Lucide allows.
const ICONS: Record<string, LucideIcon> = {
  film: Film,
  clipboard: ClipboardList,
  calculator: Calculator,
  receipt: Receipt,
  cards: Contact,
  script: ScrollText,
  viewfinder: Scan,
  sign: Signpost,
  lens: Aperture,
  storyboard: PanelsTopLeft,
  wave: AudioWaveform,
  book: Book,
  polaroid: Image,
  notebook: NotebookPen,
  clapper: Clapperboard,
  mirror: Sparkles,
  easel: Presentation,
  clock: AlarmClock,
  steps: ListOrdered,
  mic: Mic,
  magnifier: ZoomIn,
  box: PackageOpen,
  swatch: Palette,
  badge: IdCard,
  chart: ChartColumn,
  mask: Drama,
  pot: CookingPot,
  dumbbell: Dumbbell,
  home: House,
  chat: MessagesSquare,
  spark: Sparkle,
  lamp: Lamp,
  plug: Plug,
  camera: Camera,
  calendar: CalendarDays,
  phone: Smartphone,
  tag: Tag,
  splice: Scissors,
  planner: CalendarRange,
  trackball: SlidersHorizontal,
  sphere: Orbit,
  headphones: Headphones,
  music: Music,
  zoetrope: Disc3,
  seal: Award,
  flash: Zap,
  ruler: Ruler,
  rotary: Phone,
  hanger: Shirt,
  brush: Brush,
  pen: PenTool,
  memo: StickyNote,
  stamp: Stamp,
  envelope: Mail,
  folder: FolderOpen,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? ClipboardList;

// Listed in full so the styles are generated (see the grain utilities in globals.css).
const GRAINS = ["grain-1", "grain-2", "grain-3", "grain-4", "grain-5", "grain-6", "grain-7", "grain-8", "grain-9", "grain-10", "grain-11", "grain-12"];
/** A template's tile gradient: the same one wherever the template appears. */
export const grainFor = (code: string) => GRAINS[[...code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % GRAINS.length];
/** The nth gradient, for things that aren't templates (workflow steps). */
export const grainAt = (n: number) => GRAINS[n % GRAINS.length];
