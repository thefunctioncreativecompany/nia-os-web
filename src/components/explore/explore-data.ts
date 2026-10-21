// Sample data for Explore until it reads from Supabase: the films, posters and stills from Ika's
// Claude Design "ExploreLibrary" (2026-10-20), in the design's order. Images live in
// public/explore; the Latest projects stills are Ika's picks (2026-10-20). Directors the design
// left blank were looked up (2026-10-20).

export type Film = {
  id: string;
  title: string;
  director: string;
  posterUrl: string | null;
  stillUrl?: string | null;
};

export type DocumentType =
  | "Call Sheet"
  | "Script"
  | "Shot List"
  | "Storyboard"
  | "Lookbook"
  | "Treatment"
  | "Production Bible"
  | "Director's Notes";

// `position` frames a still inside a Latest projects strip (CSS object-position).
export type CategoryItem = { filmId: string; rank?: number; documentType?: DocumentType; position?: string };

export type Category = {
  id: string;
  title: string;
  kind: "grid" | "epk" | "notes" | "latest";
  items: CategoryItem[];
};

const film = (id: string, title: string, director: string, still?: string): Film => ({
  id,
  title,
  director,
  posterUrl: `/explore/posters/${id}.jpg`,
  stillUrl: still ? `/explore/stills/${still}.jpg` : null,
});

// The design's list (its order drives every section below).
export const FILMS: Film[] = [
  film("hamnet", "Hamnet", "Chloé Zhao", "hamnet"),
  film("sinners", "Sinners", "Ryan Coogler", "sinners"),
  film("heart-of-the-hunter", "Heart of the Hunter", "Mandla Dube"),
  film("the-odyssey", "The Odyssey", "Christopher Nolan", "the-odyssey"),
  film("the-polygamist", "The Polygamist", "Akin Omotoso", "the-polygamist-office"),
  film("avatar-the-way-of-water", "Avatar: The Way of Water", "James Cameron"),
  film("obsession", "Obsession", "Glenn Leyburn & Lisa Barros D'Sa"),
  film("the-dink", "The Dink", "Josh Greenbaum"),
  film("the-woman-king", "The Woman King", "Gina Prince-Bythewood", "the-woman-king"),
  film("phantom", "Phantom", "Lee Hae-young"),
  film("blonde", "Blonde", "Andrew Dominik"),
  film("500-days-of-summer", "500 Days of Summer", "Marc Webb"),
  film("scream", "Scream", "Wes Craven"),
  film("the-queens-gambit", "The Queen's Gambit", "Scott Frank"),
  film("michael", "Michael", "Antoine Fuqua"),
  film("madeas-destination-wedding", "Madea's Destination Wedding", "Tyler Perry"),
  film("obsession-series", "Obsession (series)", "Glenn Leyburn & Lisa Barros D'Sa"),
];

// Only in Latest projects, so it has a still and no poster.
const OPPENHEIMER: Film = {
  id: "oppenheimer",
  title: "Oppenheimer",
  director: "Christopher Nolan",
  posterUrl: null,
  stillUrl: "/explore/stills/oppenheimer-los-alamos.jpg",
};

const BY_ID = new Map([...FILMS, OPPENHEIMER].map((f, i) => [f.id, { film: f, index: i }]));

export function getFilm(id: string): Film {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown film ${id}`);
  return found.film;
}

// The design picks films by position, wrapping round the list.
const at = (i: number) => FILMS[i % FILMS.length].id;

// Written out in full so Tailwind finds each class name in the code.
const GRAINS = [
  "grain-1", "grain-2", "grain-3", "grain-4", "grain-5", "grain-6",
  "grain-7", "grain-8", "grain-9", "grain-10", "grain-11", "grain-12",
] as const;

// Stand-in behind a film that has no picture yet.
export function grainFor(id: string) {
  return GRAINS[(BY_ID.get(id)?.index ?? 0) % GRAINS.length];
}

const DOCS: DocumentType[] = [
  "Call Sheet", "Director's Notes", "Shot List", "Script", "Storyboard",
  "Lookbook", "Treatment", "Production Bible", "Call Sheet", "Shot List",
];

export const CATEGORIES: Category[] = [
  {
    // Each film once (Ika, 2026-10-21: the design's 20 slots repeated three films); the grid deals
    // them into five columns (film i goes to column i % 5).
    id: "explore-all",
    title: "Explore all",
    kind: "grid",
    items: FILMS.map((f) => ({ filmId: f.id })),
  },
  {
    id: "top-epk",
    title: "Top 10 electronic press kits",
    kind: "epk",
    items: Array.from({ length: 10 }, (_, i) => ({ filmId: at(i + 7), rank: i + 1 })),
  },
  {
    id: "top-directors-notes",
    title: "Top 10 director's notes",
    kind: "notes",
    items: DOCS.map((documentType, i) => ({ filmId: at(i + 3), rank: i + 1, documentType })),
  },
  {
    id: "latest-projects",
    title: "Latest projects",
    kind: "latest",
    items: [
      { filmId: "sinners", position: "50% 30%" },
      { filmId: "oppenheimer", position: "50% 30%" },
      { filmId: "the-polygamist", position: "45% 35%" },
      { filmId: "the-woman-king", position: "45% 40%" },
      { filmId: "the-odyssey", position: "32% 40%" },
      { filmId: "hamnet", position: "50% 35%" },
    ],
  },
];

export function getCategory(kind: Category["kind"]): Category {
  const found = CATEGORIES.find((c) => c.kind === kind);
  if (!found) throw new Error(`No ${kind} category`);
  return found;
}
