"use server";

import { getPress, type PressCoverage } from "@/components/explore/press-coverage";

// One title's press kit, fetched when a press-kit pop-up opens (performance audit 2026-11-11): the
// pages no longer carry every title's press kit (about 70 KB compressed) to show one. Explore's
// curated data, nothing private.
export async function loadPress(id: string): Promise<PressCoverage | null> {
  return getPress(id);
}
