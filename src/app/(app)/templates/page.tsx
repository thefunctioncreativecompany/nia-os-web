import type { Metadata } from "next";

import { catalog, manifest } from "@/features/templates/catalog";
import { toGallery } from "@/features/templates/gallery";
import { TemplatesPage } from "@/features/templates/components/templates-page";

export const metadata: Metadata = {
  title: "Templates · Nia OS",
};

// The full manifest stays on the server; the page gets only what its cards need.
export default function Page() {
  return <TemplatesPage templates={catalog.map(toGallery)} groups={manifest.groups} familyLabels={manifest.familyLabels} />;
}
