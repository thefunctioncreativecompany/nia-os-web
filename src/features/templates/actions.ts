"use server";

import { catalog, getSchema, getTemplate } from "./catalog";
import { relatedTemplates } from "./recommend";
import { toGallery, type GalleryTemplate } from "./gallery";
import type { TemplateDetails, TemplateSchema } from "./types";
import { canEdit } from "./engine/sections";

export type TemplatePreview = {
  details: TemplateDetails;
  related: GalleryTemplate[];
  // What the miniature draws: the document's group, title, toolbar and first sections.
  schema: Pick<TemplateSchema, "group" | "name" | "builder" | "actions" | "sections"> | null;
};

// The preview pop-up's copy for one template, read on the server so the gallery page
// doesn't carry every template's About, How to use and FAQ text. The catalogue is
// public product copy, so no sign-in check is needed.
export async function loadTemplatePreview(code: string): Promise<TemplatePreview | null> {
  const template = getTemplate(code);
  if (!template) return null;
  const schema = getSchema(template.schema ?? template.code);
  return {
    details: template.details,
    related: relatedTemplates(template, catalog).map(toGallery),
    schema: schema && { group: schema.group, name: schema.name, builder: schema.builder, actions: schema.actions, sections: schema.sections },
  };
}

// The templates that open in the editor today, for "From Template" in the New Project dialog.
// Public catalogue data, so no sign-in check is needed.
export async function loadWorkingTemplates(): Promise<GalleryTemplate[]> {
  return catalog.filter((t) => t.status === "live" && canEdit(getSchema(t.code))).map((t) => ({ ...toGallery(t), ready: true }));
}

// Every live template, small, for the navbar search (audit #14). Public catalogue data.
export async function loadTemplateIndex(): Promise<{ code: string; name: string; stage: string; icon: string; keywords: string[]; ready: boolean }[]> {
  return catalog
    .filter((t) => t.status === "live")
    .map((t) => ({ code: t.code, name: t.name, stage: t.stage, icon: t.icon, keywords: t.keywords.slice(0, 8), ready: canEdit(getSchema(t.code)) }));
}
