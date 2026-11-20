"use server";

import { listActivity } from "@/lib/projects-data";

// Home's Activity panel (Ika, 2026-11-19): the newest 300 changes, loaded when the panel opens.
// The database rules decide which projects' changes this person sees.
export async function loadAllActivity() {
  const { items } = await listActivity({ limit: 300 });
  return items;
}
