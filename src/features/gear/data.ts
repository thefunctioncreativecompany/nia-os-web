import "server-only";

import { guessDepartment } from "./catalog";
import type { GearEntry, GearSource, GearStatus } from "./list";

type Client = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

type Row = {
  id: string;
  quantity: number;
  source: GearSource;
  vendor: string | null;
  needed_from: string | null;
  needed_to: string | null;
  status: GearStatus;
  notes: string | null;
  position: number;
  responsible: { id: string; name: string } | null;
  gear: {
    id: string;
    catalog_id: string | null;
    name: string;
    brand: string | null;
    department: string | null;
    category: string | null;
    owner: string | null;
    vendor: string | null;
    serial_number: string | null;
    photo_url: string | null;
    catalog: { department: string; category: string; image_url: string | null } | null;
  } | null;
};

const COLUMNS =
  "id, quantity, source, vendor, needed_from, needed_to, status, notes, position, responsible:people(id, name), gear:gear(id, catalog_id, name, brand, department, category, owner, vendor, serial_number, photo_url, catalog:gear_catalog(department, category, image_url))";

/** A project's gear (gear and project_gear tables, 20261128000000_gear.sql): each line with its
 * department and category from the kit item, else its catalogue item, else worked out from the
 * name; the team's own photo, else the catalogue's licensed one. */
export async function listProjectGear(supabase: Client, projectId: string): Promise<GearEntry[]> {
  const { data } = await supabase.from("project_gear").select(COLUMNS).eq("project_id", projectId).is("deleted_at", null).order("position").returns<Row[]>();
  return (data ?? []).flatMap((r) => {
    const g = r.gear;
    if (!g) return [];
    return [
      {
        id: r.id,
        gearId: g.id,
        catalogId: g.catalog_id,
        name: g.name,
        brand: g.brand,
        department: g.department || g.catalog?.department || guessDepartment(g.name),
        category: g.category || g.catalog?.category || null,
        photo: g.photo_url ?? g.catalog?.image_url ?? null,
        quantity: r.quantity,
        source: r.source,
        vendor: r.vendor ?? g.vendor,
        neededFrom: r.needed_from,
        neededTo: r.needed_to,
        responsible: r.responsible,
        status: r.status,
        notes: r.notes,
        serialNumber: g.serial_number,
        owner: g.owner,
      },
    ];
  });
}

/** How many lines a project's gear list has, for the tab's count. */
export async function countProjectGear(supabase: Client, projectId: string) {
  const { count } = await supabase.from("project_gear").select("id", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null);
  return count ?? 0;
}
