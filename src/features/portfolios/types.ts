// Portfolios (beta, PORTFOLIOS_BUILD.md): shapes shared by the server loaders, the editor and the
// public page. Slice 1: a portfolio, its projects in order, a look (template, background, cover).

export const TEMPLATES = [
  { value: "grid", label: "Grid" },
  { value: "rows", label: "Rows" },
  { value: "slides", label: "Slides" },
] as const;
export type PortfolioTemplate = (typeof TEMPLATES)[number]["value"];

export const BACKGROUNDS = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
] as const;

export type Portfolio = {
  id: string;
  title: string;
  byline: string;
  slug: string;
  template: PortfolioTemplate;
  background: string;
  coverFileId: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

/** A final asset: a picture or a film, opened through a link that lasts an hour. */
export type Piece = { id: string; name: string; kind: "image" | "video"; url: string };

export type PortfolioProject = { id: string; title: string; pieces: Piece[] };

/** "Spring lookbook 2026" → "spring-lookbook-2026-k3f9": readable, and unlikely to clash. */
export function slugFor(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "portfolio";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export function portfolioFrom(row: {
  id: string;
  title: string;
  byline: string;
  slug: string;
  template: string;
  background: string;
  cover_file_id: string | null;
  published_at: string | null;
  updated_at: string;
}): Portfolio {
  return {
    id: row.id,
    title: row.title,
    byline: row.byline,
    slug: row.slug,
    template: (TEMPLATES.some((t) => t.value === row.template) ? row.template : "grid") as PortfolioTemplate,
    background: row.background,
    coverFileId: row.cover_file_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}
