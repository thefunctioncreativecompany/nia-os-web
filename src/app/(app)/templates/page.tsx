import type { Metadata } from "next";

import { manifest } from "@/features/templates/catalog";
import { workingGallery } from "@/features/templates/working";
import { TemplatesPage } from "@/features/templates/components/templates-page";

export const metadata: Metadata = {
  title: "Templates · Nia OS",
};

// The full manifest stays on the server; the page gets only the working templates' cards
// (Ika, 2026-10-28: the rest are hidden until each is built).
export default async function Page() {
  const templates = await workingGallery();
  return <TemplatesPage templates={templates} groups={manifest.groups} familyLabels={manifest.familyLabels} />;
}
