"use server";

import { catalog, getSchema, getTemplate } from "./catalog";
import { relatedTemplates } from "./recommend";
import { toGallery, type GalleryTemplate } from "./gallery";
import type { TemplateDetails, TemplateSchema } from "./types";

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
