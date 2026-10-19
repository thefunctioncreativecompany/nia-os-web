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
  Clapperboard,
  ClipboardList,
  Contact,
  Disc3,
  Film,
  FolderOpen,
  Headphones,
  IdCard,
  Image,
  Lamp,
  ListOrdered,
  Mail,
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
  Sparkles,
  Stamp,
  StickyNote,
  Tag,
  Zap,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";

import manifest from "@/data/templates.manifest.json";

// The template catalogue, read from src/data/templates.manifest.json (see
// TEMPLATE_THUMBNAILS.md). Improve search by editing the manifest, not this file.

export type TemplateFamily = keyof typeof manifest.families;
export type TemplateStage = "Pre-production" | "Production" | "Post-production";
export type TemplateStatus = "live" | "designed" | "gap";

export type Template = {
  code: string;
  slug: string;
  name: string;
  kind: "workflow" | "document";
  family: TemplateFamily;
  variant: "a" | "b" | "c";
  stage: TemplateStage;
  label: string;
  status: TemplateStatus;
  icps: string[];
  object: string;
  alt: string | null;
  preview: string | null;
  thumbnail: {
    master: string;
    card: string;
    cardFallback: string;
    cardSmall: string;
    square: string;
  } | null;
  icon: string;
  keywords: string[];
};

export const TEMPLATES = manifest.templates as Template[];

export const STAGES: TemplateStage[] = ["Pre-production", "Production", "Post-production"];

export const FAMILY_ORDER: TemplateFamily[] = [
  "production",
  "creator",
  "camera",
  "post",
  "photo",
  "craft",
  "enterprise",
  "performance",
];

export const FAMILY_LABELS = manifest.familyLabels as Record<TemplateFamily, string>;

// Templates not built yet say "Coming soon" (Ika's wording; the guideline says "In design").
export const COMING_SOON = "Coming soon";

export function templateLabel(template: Template) {
  return template.status === "gap" ? COMING_SOON : template.label;
}

const CENTRES = manifest.variantGradientCentre;

// The family gradient: shown behind every card, and on its own until a thumbnail exists.
export function familyGradient(family: TemplateFamily, variant: Template["variant"] = "b") {
  return `radial-gradient(120% 95% at ${CENTRES[variant]}, var(--family-${family}-light) 0%, var(--family-${family}-core) 35%, var(--family-${family}-deep) 100%)`;
}

// One Lucide icon per manifest `icon` value (our rules allow Lucide icons only; the
// prototype's hand-drawn glyphs are matched as closely as Lucide allows).
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

export function templateIcon(template: Template): LucideIcon {
  return ICONS[template.icon] ?? ClipboardList;
}
