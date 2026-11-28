// Finding gear to add, from the browser, on first use (never loaded with the page): the team's own
// kit first (what they've used before), then Nia's catalogue. Both are read under the database's
// rules (20261128000000_gear.sql): everyone signed in reads the catalogue, members read their kit.

import { createClient } from "@/lib/supabase/client";
import { rankCatalog, type CatalogItem } from "./catalog";

export type KitMatch = { gearId: string; catalogId: string | null; name: string; brand: string | null; quantityOwned: number | null };

type CatalogRow = { id: string; name: string; brand: string | null; department: string; category: string; kind: "branded" | "generic"; variants: string | null; image_url: string | null };

const like = (s: string) => `%${s.replace(/[%_\\]/g, "\\$&")}%`;
const toItem = (r: CatalogRow): CatalogItem => ({ id: r.id, name: r.name, brand: r.brand, department: r.department, category: r.category, kind: r.kind, variants: r.variants, imageUrl: r.image_url });

/** The longest word of a search narrows the read; rankCatalog then orders what came back. */
const keyWord = (query: string) =>
  query
    .split(/[\s-]+/)
    .filter(Boolean)
    .toSorted((a, b) => b.length - a.length)[0] ?? "";

export async function findGear(projectId: string, query: string, limit = 12): Promise<{ kit: KitMatch[]; catalog: CatalogItem[] }> {
  const word = keyWord(query.trim());
  if (word.length < 2) return { kit: [], catalog: [] };
  const db = createClient();
  const { data: project } = await db.from("projects").select("workspace_id").eq("id", projectId).single();
  const [kit, catalog] = await Promise.all([
    project
      ? db.from("gear").select("id, catalog_id, name, brand, quantity_owned").eq("workspace_id", project.workspace_id).is("deleted_at", null).or(`name.ilike.${like(word)},brand.ilike.${like(word)}`).limit(50)
      : Promise.resolve({ data: [] }),
    db.from("gear_catalog").select("id, name, brand, department, category, kind, variants, image_url").is("retired_at", null).or(`name.ilike.${like(word)},brand.ilike.${like(word)},category.ilike.${like(word)}`).limit(200).returns<CatalogRow[]>(),
  ]);
  const kitItems = (kit.data ?? []).map((k) => ({ gearId: k.id as string, catalogId: (k.catalog_id as string | null) ?? null, name: k.name as string, brand: (k.brand as string | null) ?? null, quantityOwned: (k.quantity_owned as number | null) ?? null }));
  // Rank the kit like the catalogue, then leave out catalogue items the team already has.
  const kitRanked = rankCatalog(
    kitItems.map((k) => ({ id: k.gearId, name: k.name, brand: k.brand, department: "", category: "", kind: "branded" as const, variants: null, imageUrl: null })),
    query,
    5,
  ).flatMap((r) => kitItems.filter((k) => k.gearId === r.id));
  const owned = new Set(kitItems.map((k) => k.catalogId).filter(Boolean));
  const catalogRanked = rankCatalog((catalog.data ?? []).map(toItem), query, limit).filter((c) => !owned.has(c.id));
  return { kit: kitRanked, catalog: catalogRanked.slice(0, limit - kitRanked.length) };
}

/** One department of the catalogue, in its order, for browsing (Add gear → Browse). */
export async function catalogDepartment(department: string): Promise<CatalogItem[]> {
  const { data } = await createClient()
    .from("gear_catalog")
    .select("id, name, brand, department, category, kind, variants, image_url")
    .eq("department", department)
    .is("retired_at", null)
    .order("position")
    .returns<CatalogRow[]>();
  return (data ?? []).map(toItem);
}
