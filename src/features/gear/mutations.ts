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

/** Adds gear to the project in one go. The kit item, in the order checked: the one picked, the one
 * made from the same catalogue item, the one kit item with exactly the typed name; else a new kit
 * item. Something already on the project gets its quantity raised instead of a second line.
 * Returns how many lines were added and the names whose quantity went up. */
export async function addGear(projectId: string, picks: GearPick[]) {
  const db = createClient();
  const { data: project, error: projectError } = await db.from("projects").select("workspace_id").eq("id", projectId).single();
  if (projectError) throw projectError;
  const { data: onProject } = await db.from("project_gear").select("id, gear_id, quantity").eq("project_id", projectId).is("deleted_at", null);
  const lines = new Map((onProject ?? []).map((r) => [r.gear_id as string, { id: r.id as string, quantity: r.quantity as number }]));
  let position = lines.size;
  let added = 0;
  const raised: string[] = [];
  for (const p of picks) {
    const name = (p.catalog?.name ?? p.name).trim().slice(0, 160);
    if (!name) continue;
    let gearId = p.gearId ?? null;
    let owned = 0;
    if (!gearId && p.catalog) {
      const { data } = await db.from("gear").select("id, quantity_owned").eq("workspace_id", project.workspace_id).eq("catalog_id", p.catalog.id).is("deleted_at", null).maybeSingle();
      gearId = data?.id ?? null;
      owned = data?.quantity_owned ?? 0;
    }
    if (!gearId && !p.catalog) {
      const { data } = await db.from("gear").select("id, quantity_owned").eq("workspace_id", project.workspace_id).ilike("name", name.replace(/[%_\\]/g, "\\$&")).is("deleted_at", null).limit(2);
      if (data?.length === 1) {
        gearId = data[0].id as string;
        owned = (data[0].quantity_owned as number | null) ?? 0;
      }
    }
    if (gearId && !owned && p.gearId) {
      const { data } = await db.from("gear").select("quantity_owned").eq("id", gearId).maybeSingle();
      owned = data?.quantity_owned ?? 0;
    }
    if (!gearId) {
      // Linked to the catalogue, a kit item takes its department and category from there.
      const fields = p.catalog
        ? { catalog_id: p.catalog.id, name, brand: p.catalog.brand }
        : { name, department: guessDepartment(name) };
      const { data, error } = await db.from("gear").insert({ workspace_id: project.workspace_id, ...fields }).select("id").single();
      if (error) throw error;
      gearId = data.id as string;
    }
    const line = lines.get(gearId);
    if (line) {
      const next = quantity(line.quantity + p.quantity);
      const { error } = await db.from("project_gear").update({ quantity: next }).eq("id", line.id);
      if (error) throw error;
      lines.set(gearId, { ...line, quantity: next });
      raised.push(name);
      continue;
    }
    const { data, error } = await db
      .from("project_gear")
      .insert({ project_id: projectId, gear_id: gearId, quantity: quantity(p.quantity), source: owned > 0 ? "owned" : "rental", status: "needed", position: position++ })
      .select("id")
      .single();
    if (error) throw error;
    lines.set(gearId, { id: data.id as string, quantity: quantity(p.quantity) });
    added++;
  }
  return { added, raised };
}

/** Saves a line and its kit item (name, brand, serial and owner belong to the kit; the rest to
 * this project). */
export async function updateGear(lineId: string, gearId: string, f: GearForm) {
  const db = createClient();
  const [kit, line] = await Promise.all([
    db
      .from("gear")
      .update({
        name: f.name.trim().slice(0, 160),
        brand: text(f.brand, 80),
        department: text(f.department, 60),
        category: text(f.category, 60),
        serial_number: text(f.serialNumber, 120),
        owner: text(f.owner, 120),
      })
      .eq("id", gearId),
    db
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
      .eq("id", lineId),
  ]);
  if (kit.error) throw kit.error;
  if (line.error) throw line.error;
}

export async function setGearStatus(lineId: string, status: GearStatus) {
  const { error } = await createClient().from("project_gear").update({ status }).eq("id", lineId);
  if (error) throw error;
}

/** Several lines at once ("Mark all packed" on the pick-up run, "Mark all returned" at wrap). */
export async function setGearStatuses(lineIds: string[], status: GearStatus) {
  if (!lineIds.length) return;
  const { error } = await createClient().from("project_gear").update({ status }).in("id", lineIds);
  if (error) throw error;
}

export async function setGearQuantity(lineId: string, n: number) {
  const { error } = await createClient().from("project_gear").update({ quantity: quantity(n) }).eq("id", lineId);
  if (error) throw error;
}

/** Takes gear off this project (kept, not erased); it stays on the workspace's kit list. */
export async function removeGear(lineId: string) {
  const { error } = await createClient().from("project_gear").update({ deleted_at: new Date().toISOString() }).eq("id", lineId);
  if (error) throw error;
}
