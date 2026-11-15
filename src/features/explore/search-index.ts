"use server";

import { featuredPeople } from "./people-index";
import { festivalRows } from "./festivals";
import { studioRows } from "./studios";

export type ExploreSearchIndex = {
  studios: { id: string; name: string; group: string; logo: string | null; count: number }[];
  people: { key: string; name: string; role: string; href: string; photo: string | null; credits: number }[];
  festivals: { id: string; name: string; logo: string | null; count: number }[];
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
  // Festivals too, so "Cannes" or "Sundance" finds the titles that screened there.
  const festivals = festivalRows();
  for (const f of festivals) for (const slug of f.slugs) (titleStudios[slug] ??= []).push(f.name);
  return {
    studios: rows.map((r) => ({ id: r.id, name: r.name, group: r.group, logo: r.logo, count: r.slugs.length })),
    festivals: festivals.map((f) => ({ id: f.id, name: f.name, logo: f.logo, count: f.slugs.length })),
    people: featuredPeople(3),
    titleStudios,
  };
}
