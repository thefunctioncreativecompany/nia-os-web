import { createClient } from "@/lib/supabase/client";

// The production jobs people do in Nia, counted for the MVP pilot (Ika, 2026-10-23) in
// `product_events` (supabase/migrations/20261105000000_feedback.sql). Fire-and-forget: never
// block the UI, and say nothing if the table isn't there yet.
export type ProductEvent = "project_created" | "document_created" | "document_downloaded" | "crew_invited" | "file_uploaded" | "reference_added";

// The one question asked the first time someone does one of these jobs (`PulsePrompt`).
export const PULSES: Partial<Record<ProductEvent, string>> = {
  project_created: "Was setting up your project clear?",
  document_downloaded: "Did Nia save you time on this document?",
  crew_invited: "Was sharing the project with your crew easy?",
};

export const PULSE_EVENT = "nia:pulse";
const askedKey = (job: string) => `nia:pulse:${job}`;

export function recordEvent(name: ProductEvent, details: { projectId?: string | null; props?: Record<string, string | number | boolean> } = {}) {
  void (async () => {
    const supabase = createClient();
    const { error } = await supabase.from("product_events").insert({ name, project_id: details.projectId ?? null, props: details.props ?? {} });
    if (error) return console.warn("product event not saved", error.message);
    if (PULSES[name]) void askOnce(name);
  })();
}

// Asked once per job on any device: remembered on this device, and checked against answers sent.
async function askOnce(job: ProductEvent) {
  try {
    if (localStorage.getItem(askedKey(job))) return;
  } catch {}
  const { count } = await createClient().from("feedback").select("id", { count: "exact", head: true }).eq("kind", "pulse").eq("job", job);
  if (count) return markAsked(job);
  window.dispatchEvent(new CustomEvent(PULSE_EVENT, { detail: { job } }));
}

export function markAsked(job: string) {
  try {
    localStorage.setItem(askedKey(job), "1");
  } catch {}
}
