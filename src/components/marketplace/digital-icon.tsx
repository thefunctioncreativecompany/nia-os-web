import { createElement } from "react";
import { Camera, Film, Headphones, Music, Package, Palette, type LucideIcon, type LucideProps } from "lucide-react";

import type { Listing } from "@/features/marketplace/data";

const ICONS: Record<NonNullable<Listing["icon"]>, LucideIcon> = {
  palette: Palette,
  camera: Camera,
  headphones: Headphones,
  music: Music,
  film: Film,
  package: Package,
};

/** The Lucide icon on a digital product's tile. */
export function DigitalIcon({ listing, ...props }: { listing: Listing } & LucideProps) {
  return createElement(ICONS[listing.icon ?? "package"], { "aria-hidden": true, ...props });
}
