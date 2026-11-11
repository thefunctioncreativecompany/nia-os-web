"use server";

import { featuredPeople } from "./people-index";
import { studioRows } from "./studios";

export type ExploreSearchIndex = {
  studios: { id: string; name: string; group: string; logo: string | null; count: number }[];
  people: { key: string; name: string; role: string; href: string; photo: string | null; credits: number }[];
  /** Each title's studio names, so "Netflix" or "A24" finds their titles. */
  titleStudios: Record<string, string[]>;
};

// What global search needs from Explore beyond its titles (Ika, 2026-11-11: "every time we change
// the platform's data, improve search to consider it"): the studios, the cast & crew with three or
// more credits, and which studios made each title. Worked out on the server from Explore's curated
// data (nothing private), and fetched when search first opens.
export async function loadExploreSearchIndex(): Promise<ExploreSearchIndex> {
  const rows = studioRows();
  const titleStudios: Record<string, string[]> = {};
  for (const r of rows) for (const slug of r.slugs) (titleStudios[slug] ??= []).push(r.name);
  return {
    studios: rows.map((r) => ({ id: r.id, name: r.name, group: r.group, logo: r.logo, count: r.slugs.length })),
    people: featuredPeople(3),
    titleStudios,
  };
}
