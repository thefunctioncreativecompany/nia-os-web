// A project's gear list (docs/GEAR_SPEC.md): shapes, grouping and counts only. Lines come from the
// gear and project_gear tables (data.ts) and are changed in mutations.ts.

import { GEAR_DEPARTMENTS } from "./catalog";

/** Where a line stands, prep to wrap: on the list, secured (rental confirmed or own kit held),
 * checked out and in the van, checked back in. */
export type GearStatus = "needed" | "booked" | "packed" | "returned";
export const GEAR_STATUSES: { value: GearStatus; label: string }[] = [
  { value: "needed", label: "Needed" },
  { value: "booked", label: "Booked" },
  { value: "packed", label: "Packed" },
  { value: "returned", label: "Returned" },
];
export const statusLabel = (s: GearStatus) => GEAR_STATUSES.find((x) => x.value === s)?.label ?? s;
/** The next step, for one tap: Needed → Booked → Packed → Returned. */
export const nextStatus = (s: GearStatus): GearStatus => GEAR_STATUSES[Math.min(GEAR_STATUSES.findIndex((x) => x.value === s) + 1, GEAR_STATUSES.length - 1)].value;

export type GearSource = "owned" | "rental" | "borrowed" | "client";
export const GEAR_SOURCES: { value: GearSource; label: string }[] = [
  { value: "owned", label: "Own kit" },
  { value: "rental", label: "Rental" },
  { value: "borrowed", label: "Borrowed" },
  { value: "client", label: "Client's" },
];
export const sourceLabel = (s: GearSource) => GEAR_SOURCES.find((x) => x.value === s)?.label ?? s;

export type GearEntry = {
  /** The project's line (project_gear), or a stand-in for the samples. */
  id: string;
  /** The workspace's kit item (gear). */
  gearId?: string;
  /** The catalogue item it came from, when it was picked there. */
  catalogId: string | null;
  name: string;
  brand: string | null;
  department: string;
  category: string | null;
  /** The team's own photo, else the catalogue's licensed one. */
  photo: string | null;
  quantity: number;
  source: GearSource;
  /** The rental house. */
  vendor: string | null;
  /** ISO days; empty: the whole shoot. */
  neededFrom: string | null;
  neededTo: string | null;
  /** Who looks after it (a person on the project's cast & crew). */
  responsible: { id: string; name: string } | null;
  status: GearStatus;
  notes: string | null;
  serialNumber: string | null;
  /** Who it belongs to (own and borrowed kit). */
  owner: string | null;
};

/** Lines grouped by department, in GEAR_DEPARTMENTS order (gear in an unknown one goes last). */
export function byDepartment(entries: GearEntry[]) {
  const order = GEAR_DEPARTMENTS.includes("Other") ? GEAR_DEPARTMENTS : [...GEAR_DEPARTMENTS, "Other"];
  const home = (e: GearEntry) => (GEAR_DEPARTMENTS.includes(e.department) ? e.department : "Other");
  return order.map((d) => ({ department: d, lines: entries.filter((e) => home(e) === d) })).filter((g) => g.lines.length);
}

/** The counts the tab and the page lead with: lines, pieces, how many still to book, how many
 * are out (packed), and whether everything is secured. */
export function gearTotals(entries: GearEntry[]) {
  const by = (s: GearStatus) => entries.filter((e) => e.status === s).length;
  return {
    lines: entries.length,
    pieces: entries.reduce((n, e) => n + e.quantity, 0),
    needed: by("needed"),
    booked: by("booked"),
    packed: by("packed"),
    returned: by("returned"),
    rentals: entries.filter((e) => e.source === "rental").length,
    /** Nothing left to book (an empty list isn't ready). */
    ready: entries.length > 0 && by("needed") === 0,
    /** Everything that went out came back (for wrap). */
    allBack: entries.length > 0 && entries.every((e) => e.status === "returned" || e.status === "needed"),
  };
}

/** Rental lines grouped by rental house, for the pick-up run and the rental log. */
export function byVendor(entries: GearEntry[]) {
  const map = new Map<string, GearEntry[]>();
  for (const e of entries.filter((x) => x.source === "rental")) {
    const key = e.vendor?.trim() || "Rental house to be confirmed";
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return [...map].map(([vendor, lines]) => ({ vendor, lines }));
}

/** A small one-day shoot's list, for the development preview only (never a real project). */
export const SAMPLE: GearEntry[] = (
  [
    ["Sony FX6", "Sony", "Cameras", "Cinema cameras", 1, "owned", null, "packed", "Serial 5021774"],
    ["DZOFilm VESPID 35mm T2.1 Cine Prime", "DZO Film", "Lenses", "Cinema primes", 1, "rental", "Magic Lightbox", "booked", null],
    ["DZOFilm VESPID 50mm T2.1 Cine Prime", "DZO Film", "Lenses", "Cinema primes", 1, "rental", "Magic Lightbox", "booked", null],
    ["Tiffen 4x5.65 Black Pro-Mist 1/4", "Tiffen", "Camera accessories", "Filters", 1, "rental", "Magic Lightbox", "needed", null],
    ["V-Mount Battery", "FXLion", "Camera accessories", "Batteries & power", 4, "owned", null, "packed", "Charge the night before"],
    ["Secced 100mm Tripod System", "Secced", "Camera support", "Tripods & heads", 1, "owned", null, "packed", null],
    ["Atomos Ninja V", "Atomos", "Monitors & video", "Recorders", 1, "borrowed", null, "booked", "Tshiamo's; back on Monday"],
    ["Aputure LS 600x Pro", "Aputure", "Lighting", "LED point source", 2, "rental", "Glow Hire", "booked", null],
    ["Aputure Light Dome II", "Aputure", "Lighting", "Modifiers", 1, "rental", "Glow Hire", "needed", null],
    ["C-Stand 40\"", null, "Grip", "Stands", 4, "owned", null, "packed", null],
    ["Sandbag", null, "Grip", "Sandbags & weights", 8, "owned", null, "packed", null],
    ["Rag - Full Silk", null, "Grip", "Frames & rags", 1, "rental", "Glow Hire", "needed", "8x8"],
    ["Sennheiser EW 100 G4 Wireless Lav Kit", "Sennheiser", "Audio", "Wireless", 2, "rental", "Magic Lightbox", "booked", null],
    ["SD Card (SDXC)", "SanDisk", "Media & DIT", "Memory cards", 4, "owned", null, "packed", "128GB V30"],
  ] as const
).map(([name, brand, department, category, quantity, source, vendor, status, notes], i) => ({
  id: `sample-${i}`,
  catalogId: null,
  name,
  brand,
  department,
  category,
  photo: null,
  quantity,
  source,
  vendor,
  neededFrom: null,
  neededTo: null,
  responsible: null,
  status,
  notes,
  serialNumber: null,
  owner: null,
}));
