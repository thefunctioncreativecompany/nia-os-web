// Changes to a project's gear, from the browser like the project page's other edits (cast & crew's
// mutations.ts is the pattern); the database's rules decide who may make them
// (20261128000000_gear.sql). Every line points at an item on the workspace's kit list, so gear
// used on one shoot is there to pick on the next.

import { createClient } from "@/lib/supabase/client";
import { guessDepartment, type CatalogItem } from "./catalog";
import type { GearSource, GearStatus } from "./list";

/** Something to add: picked from the team's kit (`gearId`), picked from the catalogue
 * (`catalog`), or typed (`name` alone). */
export type GearPick = { name: string; quantity: number; gearId?: string | null; catalog?: CatalogItem | null };

export type GearForm = {
  name: string;
  brand: string;
  department: string;
  category: string;
  quantity: number;
  source: GearSource;
  vendor: string;
  neededFrom: string;
  neededTo: string;
  responsibleId: string | null;
  status: GearStatus;
  notes: string;
  serialNumber: string;
  owner: string;
};

const text = (s: string, max: number) => s.trim().slice(0, max) || null;
const quantity = (n: number) => Math.min(Math.max(Math.round(n) || 1, 1), 999);

// The database turns away a change someone isn't allowed to make by changing nothing, without an
// error; so every change asks for the rows it changed back, and too few means it didn't save.
type Changed = { data: { id: string }[] | null; error: unknown };
function saved({ data, error }: Changed, expected = 1, what = "This change") {
  if (error) throw error;
  if ((data?.length ?? 0) < expected) throw new Error(`${what} wasn't saved. You may not have edit access any more; reload and try again.`);
}

/** Adds gear to the project in one go, all or nothing (the database's add_project_gear, which also
 * lets crew invited to the project add new kit). The kit item, in the order checked: the one
 * picked, the one made from the same catalogue item, the one kit item with exactly the typed name;
 * else a new kit item. Something already on the project gets its quantity raised instead of a
 * second line. Returns how many lines were added and the names whose quantity went up. */
export async function addGear(projectId: string, picks: GearPick[]): Promise<{ added: number; raised: string[] }> {
  const batch = picks.flatMap((p) => {
    const name = (p.catalog?.name ?? p.name).trim().slice(0, 160);
    if (!name && !p.gearId) return [];
    const typed = !p.gearId && !p.catalog;
    return [{ gearId: p.gearId ?? null, catalogId: p.gearId ? null : (p.catalog?.id ?? null), name, department: typed ? guessDepartment(name) : null, quantity: quantity(p.quantity) }];
  });
  if (!batch.length) return { added: 0, raised: [] };
  const { data, error } = await createClient().rpc("add_project_gear", { p_project_id: projectId, p_picks: batch });
  if (error) throw error;
  return data as { added: number; raised: string[] };
}

/** Saves a line and, with `kit`, its kit item (name, brand, department, category, serial and owner
 * belong to the team's kit list, so only the team's members change them; crew invited to the
 * project save the line alone). The line first: if the kit then fails, the error says so. */
export async function updateGear(lineId: string, gearId: string, f: GearForm, { kit }: { kit: boolean }) {
  const db = createClient();
  saved(
    await db
      .from("project_gear")
      .update({
        quantity: quantity(f.quantity),
        source: f.source,
        vendor: text(f.vendor, 120),
        needed_from: f.neededFrom || null,
        needed_to: f.neededTo || null,
        responsible_id: f.responsibleId,
        status: f.status,
        notes: text(f.notes, 2000),
      })
      .eq("id", lineId)
      .select("id"),
  );
  if (!kit) return;
  saved(
    await db
      .from("gear")
      .update({
        name: f.name.trim().slice(0, 160),
        brand: text(f.brand, 80),
        department: text(f.department, 60),
        category: text(f.category, 60),
        serial_number: text(f.serialNumber, 120),
        owner: text(f.owner, 120),
      })
      .eq("id", gearId)
      .select("id"),
    1,
    "The line was saved, but the kit details",
  );
}

export async function setGearStatus(lineId: string, status: GearStatus) {
  saved(await createClient().from("project_gear").update({ status }).eq("id", lineId).select("id"));
}

/** Several lines at once ("Mark all packed" on the pick-up run, "Mark all returned" at wrap). */
export async function setGearStatuses(lineIds: string[], status: GearStatus) {
  if (!lineIds.length) return;
  saved(await createClient().from("project_gear").update({ status }).in("id", lineIds).select("id"), lineIds.length, "Some of these changes");
}

export async function setGearQuantity(lineId: string, n: number) {
  saved(await createClient().from("project_gear").update({ quantity: quantity(n) }).eq("id", lineId).select("id"));
}

/** Takes gear off this project (kept, not erased); it stays on the workspace's kit list. */
export async function removeGear(lineId: string) {
  saved(await createClient().from("project_gear").update({ deleted_at: new Date().toISOString() }).eq("id", lineId).select("id"));
}
