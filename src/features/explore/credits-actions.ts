"use server";

import { hasPaidAccess } from "@/lib/plan-server";
import { exploreSlug } from "@/lib/schemas";
import { findCreatorFilm } from "./creators";
import type { Credit } from "./credit-format";
import { filmCastAndCrew } from "./film-people";
import { castAndCrew } from "./people";

export type AllCredits = { locked: true } | { locked: false; credits: Credit[] };

// The full Cast & Crew of an Explore title, film or creator film (Ika, 2026-11-01): the top 10
// are on every page; the rest comes from here, for people on a paid plan (any workspace they
// belong to). Like the other plan limits, it's open to everyone off the live site.
export async function loadAllCredits(slug: string): Promise<AllCredits> {
  if (!(await hasPaidAccess())) return { locked: true };
  const parsed = exploreSlug.safeParse(slug);
  if (!parsed.success) return { locked: false, credits: [] };
  const creator = findCreatorFilm(parsed.data);
  return { locked: false, credits: creator ? castAndCrew(creator) : filmCastAndCrew(parsed.data).map(({ wikidata: _w, ...c }) => c) };
}
