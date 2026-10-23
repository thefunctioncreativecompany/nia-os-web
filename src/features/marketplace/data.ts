// Sample data for Marketplace until it reads from Supabase (MARKETPLACE_SPEC.md "Data"): the gear,
// vehicles, digital products and rental partners from Ika's Claude Design "Marketplace"
// (2026-10-20), in the design's order. Product photos live in public/marketplace. The shapes
// match the spec, so Supabase can take over without the screens changing.

export type ListingKind = "gear" | "fleet" | "digital";
export type Condition = "New" | "Used" | "Kit";

export type Category =
  | "Cameras"
  | "Lenses"
  | "Drones"
  | "Lighting & Grip"
  | "Audio"
  | "Gimbals & Support"
  | "Computing & Editing"
  | "XR & Wearables"
  | "Wardrobe & Set"
  | "Vehicles & Fleet"
  | "Digital products";

/** Every category, in the design's menu order, behind "All". */
export const CATEGORIES: ("All" | Category)[] = [
  "All", "Cameras", "Lenses", "Drones", "Lighting & Grip", "Audio", "Gimbals & Support",
  "Computing & Editing", "XR & Wearables", "Wardrobe & Set", "Vehicles & Fleet", "Digital products",
];

export type ListingImage = {
  src: string;
  alt: string;
  /** "contain" shows the whole product on a light tile with room around it; "cover" fills it. */
  fit: "contain" | "cover";
  /** Room around a "contain" photo, as a percentage of the tile. */
  pad?: number;
};

export type Provider = {
  id: string;
  name: string;
  type: "creator" | "partner";
  city: string;
  /** What a rental partner rents out. */
  speciality?: string;
  /** Identity checked by Nia (every sample lister is). */
  verified: boolean;
};

export type Listing = {
  id: string;
  title: string;
  brand: string;
  category: Category;
  kind: ListingKind;
  images: ListingImage[];
  condition?: Condition;
  /** Day rate in US dollars; fleet listings with a fleet rate charge per unit. */
  rentPerDay?: number;
  /** Rough buy price in US dollars. */
  buyPrice?: number;
  /** For digital products: the one-off price. */
  price?: number;
  providerId: string;
  location: string;
  /** One line under the name. */
  blurb?: string;
  /** The photo tile's shape in Latest gear (CSS aspect-ratio), as designed. */
  aspect?: string;
  /** The lister can deliver it. */
  delivery?: boolean;
  /** Fleet listings: a dark badge on the photo ("Fleet", "Fleet available"). */
  tag?: string;
  /** Fleet listings: the day rate is per unit (the fleet rate). */
  perUnit?: boolean;
  /** The listing page's spec line, when the lister wrote one. */
  specs?: string;
  /** Refundable hold on the renter's card, in US dollars, when the lister set one. */
  deposit?: number;
  /** Fleets: the booking page's name and description, and the rate per unit (a lower rate from
   *  `bulkFrom` units, where there is one). */
  fleet?: { title: string; description: string; note: string; rate: number; bulkRate?: number; bulkFrom?: number };
  /** Digital products: the kind of file, shown as a pill. */
  productType?: string;
  /** Digital products: the Templates gradient their tile uses (`grain-1` … `grain-12`). */
  grain?: string;
  /** Digital products: the Lucide icon on the tile. */
  icon?: "palette" | "camera" | "headphones" | "music" | "film" | "package";
};

export const PROVIDERS: Provider[] = [
  { id: "bh-photo", name: "B&H Photo", type: "partner", city: "New York, US", speciality: "Cameras, lighting, audio", verified: true },
  { id: "rule-boston", name: "Rule Boston", type: "partner", city: "Boston, MA", speciality: "Camera, lighting & grip rental", verified: true },
  { id: "magic-lightbox", name: "Magic Lightbox Glow Hire", type: "partner", city: "South Africa", speciality: "Lighting & grip hire", verified: true },
  // Sample creators, standing in until real listers sign up.
  { id: "creator-boston", name: "Sample creator", type: "creator", city: "Boston, MA", verified: true },
  { id: "nia-fleet", name: "Nia Fleet", type: "partner", city: "Boston, MA", speciality: "Electric mopeds, cars and vans", verified: true },
];

const img = (file: string, alt: string, fit: ListingImage["fit"], pad?: number): ListingImage => ({
  src: `/marketplace/${file}.jpg`,
  alt,
  fit,
  pad,
});

// "Verified creator" listings in the design go to the sample creator; "Rental house" ones to
// Rule Boston, the partner the listing page names.
const CREATOR = "creator-boston";
const HOUSE = "rule-boston";
const NEAR = "Boston, MA";

export const LISTINGS: Listing[] = [
  { id: "sony-fx3", title: "Sony FX3", brand: "Sony", category: "Cameras", kind: "gear", images: [img("mk-fx3", "Sony FX3 cinema camera", "contain", 8)], condition: "Used", rentPerDay: 85, buyPrice: 3100, providerId: CREATOR, location: NEAR, aspect: "4 / 3" },
  { id: "dji-osmo-pocket-3", title: "DJI Osmo Pocket 3", brand: "DJI", category: "Cameras", kind: "gear", images: [img("mk-osmo", "DJI Osmo Pocket 3", "contain", 10)], condition: "New", rentPerDay: 22, buyPrice: 519, providerId: HOUSE, location: NEAR, aspect: "1 / 1", delivery: true },
  { id: "aputure-hr672c", title: "Aputure HR672C LED", brand: "Aputure", category: "Lighting & Grip", kind: "gear", images: [img("mk-aputure", "Aputure HR672C LED panel", "cover")], condition: "Used", rentPerDay: 15, providerId: CREATOR, location: NEAR, aspect: "3 / 4" },
  { id: "sony-a7-iv", title: "Sony α7 IV", brand: "Sony", category: "Cameras", kind: "gear", images: [img("mk-a7iv", "Sony α7 IV camera", "cover")], condition: "Used", rentPerDay: 55, buyPrice: 1900, providerId: HOUSE, location: NEAR, aspect: "3 / 2", delivery: true },
  {
    id: "apple-vision-pro",
    title: "Apple Vision Pro",
    brand: "Apple",
    category: "XR & Wearables",
    kind: "gear",
    images: [
      img("mk-avp", "Apple Vision Pro, front", "contain", 10),
      img("mk-avp_front", "Apple Vision Pro worn, front view", "cover"),
      img("mk-avp_side", "Apple Vision Pro worn, side view", "cover"),
    ],
    condition: "Used",
    rentPerDay: 75,
    buyPrice: 2600,
    providerId: HOUSE,
    location: NEAR,
    aspect: "16 / 10",
    delivery: true,
    specs: "Used · Excellent · 256GB · includes Solo Knit and Dual Loop bands, battery, travel case",
    deposit: 500,
  },
  { id: "rode-wireless-go-ii", title: "RØDE Wireless GO II", brand: "RØDE", category: "Audio", kind: "gear", images: [img("mk-rode", "RØDE Wireless GO II microphones", "cover")], condition: "Used", rentPerDay: 18, buyPrice: 210, providerId: CREATOR, location: NEAR, aspect: "4 / 3" },
  { id: "dji-mini-4-pro", title: "DJI Mini 4 Pro", brand: "DJI", category: "Drones", kind: "gear", images: [img("mk-mini4", "DJI Mini 4 Pro drone", "contain", 6)], condition: "Used", rentPerDay: 45, buyPrice: 620, providerId: HOUSE, location: NEAR, aspect: "16 / 10", delivery: true },
  { id: "sennheiser-mkh-416", title: "Sennheiser MKH 416", brand: "Sennheiser", category: "Audio", kind: "gear", images: [img("mk-mkh416", "Sennheiser MKH 416 shotgun microphone", "cover")], condition: "Used", rentPerDay: 25, buyPrice: 750, providerId: HOUSE, location: NEAR, aspect: "2 / 1", delivery: true },
  { id: "wardrobe-rack", title: "Rolling wardrobe rack", brand: "Generic", category: "Wardrobe & Set", kind: "gear", images: [img("mk-rack", "Rolling wardrobe rack", "contain", 8)], condition: "New", rentPerDay: 10, buyPrice: 90, providerId: HOUSE, location: NEAR, aspect: "1 / 1", delivery: true },
  { id: "ray-ban-meta", title: "Ray-Ban Meta (Gen 2)", brand: "Ray-Ban", category: "XR & Wearables", kind: "gear", images: [img("mk-rayban", "Ray-Ban Meta smart glasses", "contain", 4)], condition: "New", rentPerDay: 18, buyPrice: 379, providerId: CREATOR, location: NEAR, aspect: "1 / 1" },
  { id: "dji-rsc-2", title: "DJI RSC 2 gimbal", brand: "DJI", category: "Gimbals & Support", kind: "gear", images: [img("mk-rsc2", "DJI RSC 2 gimbal", "cover")], condition: "Used", rentPerDay: 20, buyPrice: 260, providerId: CREATOR, location: NEAR, aspect: "3 / 4" },
  { id: "mac-mini-m4", title: "Mac mini (M4)", brand: "Apple", category: "Computing & Editing", kind: "gear", images: [img("mk-macmini", "Mac mini with M4", "contain", 6)], condition: "New", rentPerDay: 25, buyPrice: 599, providerId: HOUSE, location: NEAR, aspect: "16 / 11", delivery: true },
  { id: "c-stand", title: "40\" C-stand with arm", brand: "Generic", category: "Lighting & Grip", kind: "gear", images: [img("mk-cstand", "40-inch C-stand with arm", "contain", 6)], condition: "New", rentPerDay: 8, buyPrice: 180, providerId: HOUSE, location: NEAR, aspect: "16 / 9", delivery: true },
  { id: "vision-pro-spatial-kit", title: "Vision Pro spatial kit", brand: "Apple", category: "XR & Wearables", kind: "gear", images: [img("mk-avp_side", "Apple Vision Pro spatial capture kit", "cover")], condition: "Kit", rentPerDay: 95, providerId: CREATOR, location: NEAR, aspect: "1 / 1" },

  { id: "olto", title: "Infinite Machine Olto", brand: "Infinite Machine", category: "Vehicles & Fleet", kind: "fleet", images: [img("mk-olto", "Infinite Machine Olto electric moped", "contain", 6)], rentPerDay: 45, providerId: "nia-fleet", location: NEAR, blurb: "Electric moped. Crew runs, scouts and city shoots.", delivery: true },
  { id: "olto-fleet", title: "Olto fleet (5+)", brand: "Infinite Machine", category: "Vehicles & Fleet", kind: "fleet", images: [img("mk-olto", "Infinite Machine Olto electric mopeds", "contain", 6)], rentPerDay: 39, providerId: "nia-fleet", location: NEAR, blurb: "Fleet rate from 5 units, delivered charged with helmets.", tag: "Fleet", perUnit: true, delivery: true, fleet: { title: "Infinite Machine Olto · fleet", description: "Electric mopeds for crew runs, location scouts and city shoots. Delivered charged, with helmets and locks, and collected after wrap.", note: "Riders must be 18+ with a valid licence. Fleet requests are confirmed by the provider within 24 hours.", rate: 45, bulkRate: 39, bulkFrom: 5 } },
  { id: "tesla-model-y", title: "Tesla Model Y", brand: "Tesla", category: "Vehicles & Fleet", kind: "fleet", images: [img("mk-tesla", "Tesla Model Y", "cover")], rentPerDay: 110, providerId: "nia-fleet", location: NEAR, blurb: "5 seats, 200 mi/day included. Talent and crew transport.", tag: "Fleet available", delivery: true, fleet: { title: "Tesla Model Y · fleet", description: "Five-seat electric cars for talent and crew transport, 200 miles a day included. Delivered charged and collected after wrap.", note: "Drivers need a valid licence. Fleet requests are confirmed by the provider within 24 hours.", rate: 110 } },
  { id: "ford-e-transit", title: "Ford E-Transit Custom", brand: "Ford", category: "Vehicles & Fleet", kind: "fleet", images: [img("mk-etransit", "Ford E-Transit Custom electric van", "cover")], rentPerDay: 135, providerId: "nia-fleet", location: NEAR, blurb: "Electric van for gear moves and crew pickups.", delivery: true },

  { id: "cinematic-lut-pack", title: "Cinematic LUT pack · 35 looks", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 29, productType: "Colour", grain: "grain-7", icon: "palette", providerId: CREATOR, location: "Instant download" },
  { id: "film-stock-presets", title: "Film-stock Lightroom presets", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 19, productType: "Photo", grain: "grain-12", icon: "camera", providerId: CREATOR, location: "Instant download" },
  { id: "city-ambience-sfx", title: "City ambience SFX library", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 24, productType: "Sound", grain: "grain-5", icon: "headphones", providerId: CREATOR, location: "Instant download" },
  { id: "music-licence-social", title: "Music licence · social use", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 39, productType: "Music", grain: "grain-10", icon: "music", providerId: CREATOR, location: "Instant download" },
  { id: "motion-titles", title: "Motion titles for Premiere & AE", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 35, productType: "Motion", grain: "grain-3", icon: "film", providerId: CREATOR, location: "Instant download" },
  { id: "studio-set-3d", title: "Studio set 3D asset pack", brand: "Nia", category: "Digital products", kind: "digital", images: [], price: 49, productType: "3D", grain: "grain-9", icon: "package", providerId: CREATOR, location: "Instant download" },
];

const BY_ID = new Map(LISTINGS.map((l) => [l.id, l]));
const PROVIDER_BY_ID = new Map(PROVIDERS.map((p) => [p.id, p]));

export function getListing(id: string): Listing | null {
  return BY_ID.get(id) ?? null;
}

export function getProvider(id: string): Provider {
  const found = PROVIDER_BY_ID.get(id);
  if (!found) throw new Error(`Unknown provider ${id}`);
  return found;
}

/** "$85/day". */
export const dayRate = (l: Listing) => (l.rentPerDay ? `$${l.rentPerDay}/${l.perUnit ? "unit/day" : "day"}` : null);

// The coming-soon field: the design's 18 tiles, each a listing and the photo it shows, with the
// short name the design gives it.
export const FIELD_TILES: { listingId: string; image: number; name: string }[] = [
  { listingId: "sony-fx3", image: 0, name: "Sony FX3" },
  { listingId: "olto", image: 0, name: "Infinite Machine Olto" },
  { listingId: "apple-vision-pro", image: 1, name: "Apple Vision Pro" },
  { listingId: "dji-osmo-pocket-3", image: 0, name: "DJI Osmo Pocket 3" },
  { listingId: "tesla-model-y", image: 0, name: "Tesla Model Y" },
  { listingId: "dji-mini-4-pro", image: 0, name: "DJI Mini 4 Pro" },
  { listingId: "sennheiser-mkh-416", image: 0, name: "Sennheiser MKH 416" },
  { listingId: "ray-ban-meta", image: 0, name: "Ray-Ban Meta" },
  { listingId: "sony-a7-iv", image: 0, name: "Sony α7 IV" },
  { listingId: "wardrobe-rack", image: 0, name: "Wardrobe rack" },
  { listingId: "mac-mini-m4", image: 0, name: "Mac mini (M4)" },
  { listingId: "ford-e-transit", image: 0, name: "Ford E-Transit" },
  { listingId: "rode-wireless-go-ii", image: 0, name: "RØDE Wireless GO II" },
  { listingId: "c-stand", image: 0, name: "40\" C-stand" },
  { listingId: "dji-rsc-2", image: 0, name: "DJI RSC 2" },
  { listingId: "aputure-hr672c", image: 0, name: "Aputure HR672C" },
  { listingId: "vision-pro-spatial-kit", image: 0, name: "Vision Pro kit" },
  { listingId: "apple-vision-pro", image: 0, name: "Apple Vision Pro" },
];

/** "~$3,100", or null when it's rent only. */
export const buyEstimate = (l: Listing) => (l.buyPrice ? `~$${l.buyPrice.toLocaleString("en-US")}` : null);

/** Under the name in Rent mode: what buying it would cost, or that it's rent only. */
export function buyLine(l: Listing) {
  const estimate = buyEstimate(l);
  if (estimate) return `Buy ${l.condition === "New" ? "new" : "used"} ${estimate}`;
  return l.condition === "Kit" ? "Kit · rent only" : "Rent only";
}

/** Who lists it, as the card says it: "Verified creator" or "Rental house". */
export const listerLine = (l: Listing) => (getProvider(l.providerId).type === "partner" ? "Rental house" : "Verified creator");

/** The brands line on Marketplace home, in the design's order. */
export const BRANDS = ["DJI", "Sony", "Apple", "Tesla", "Infinite Machine", "RØDE", "Sennheiser", "Aputure", "Ray-Ban Meta", "Ford"];

/** The spec line under a listing's name: the lister's own, or its condition and category. */
export const specLine = (l: Listing) => l.specs ?? [l.condition, l.category].filter(Boolean).join(" · ");

/** The refundable hold for renting it: the lister's, else (sample rule until listers set their
 *  own) a fifth of its buy price, or five days' rent, rounded up to $50, at least $100. */
export function depositFor(l: Listing) {
  if (l.deposit !== undefined) return l.deposit;
  const base = l.buyPrice ? l.buyPrice / 5 : (l.rentPerDay ?? 0) * 5;
  return Math.max(100, Math.ceil(base / 50) * 50);
}

/** "RB" for Rule Boston. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Marketplace home (the store; coming soon instead for people without access). */
export const MARKETPLACE_HOME = "/marketplace";

// The design's footnote (Ika's Claude Design "Marketplace"). Several photos are from Wikimedia
// Commons under Creative Commons licences, which require this credit wherever they're shown.
export const MARKETPLACE_FOOTNOTE =
  "Prices are suggested launch rates for review. Purchase prices are estimates for illustration. Partner names appear only at pickup while agreements are in progress, and none implies endorsement.";
export const PHOTO_CREDITS =
  "Photos from Wikimedia Commons: Sony α7 IV by Henry Söderlund (CC BY 2.0); Sennheiser MKH 416 by Galak76 (CC BY-SA 3.0); Aputure HR672C by Sam Wilson (CC BY-SA 4.0); RØDE Wireless GO II and DJI RSC 2 by -stk (CC BY-SA 4.0); Tesla Model Y and Ford E-Transit Custom by Alexander Migl (CC BY-SA 4.0). Other product images are from the Nia deck.";
