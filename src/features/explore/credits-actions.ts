"use server";

import { getSession } from "@/lib/supabase/session";
import { isLimited, type PlanId } from "@/lib/plans";
import { findCreatorFilm } from "./creators";
import type { Credit } from "./credit-format";
import { filmCastAndCrew } from "./film-people";
import { castAndCrew } from "./people";

export type AllCredits = { locked: true } | { locked: false; credits: Credit[] };

// The full Cast & Crew of an Explore title, film or creator film (Ika, 2026-11-01): the top 10
// are on every page; the rest comes from here, for people on a paid plan (any workspace they
// belong to). Like the other plan limits, it's open to everyone off the live site.
export async function loadAllCredits(slug: string): Promise<AllCredits> {
  const { supabase, user } = await getSession();
  if (!user) return { locked: true };
  const { data } = await supabase.from("workspaces").select("plan");
  const paid = (data ?? []).some((w) => !isLimited((w.plan as PlanId) ?? "free"));
  if (isLimited("free") && !paid) return { locked: true };
  const creator = findCreatorFilm(slug);
  return { locked: false, credits: creator ? castAndCrew(creator) : filmCastAndCrew(slug).map(({ wikidata: _w, ...c }) => c) };
}
