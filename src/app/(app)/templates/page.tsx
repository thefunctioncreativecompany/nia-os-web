import type { Metadata } from "next";

import { catalog, getSchema, manifest } from "@/features/templates/catalog";
import { canEdit } from "@/features/templates/engine/sections";
import { toGallery } from "@/features/templates/gallery";
import { TemplatesPage } from "@/features/templates/components/templates-page";

export const metadata: Metadata = {
  title: "Templates · Nia OS",
};

// The full manifest stays on the server; the page gets only what its cards need.
export default function Page() {
  // `ready`: opens in the editor today; the rest show greyed out as "Coming soon".
  const templates = catalog.map((t) => ({ ...toGallery(t), ready: t.status === "live" && canEdit(getSchema(t.code)) }));
  return <TemplatesPage templates={templates} groups={manifest.groups} familyLabels={manifest.familyLabels} />;
}
