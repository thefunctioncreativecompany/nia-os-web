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
>;

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
