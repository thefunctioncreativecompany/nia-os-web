import "server-only";

import { getSchema, getTemplate } from "@/features/templates/catalog";
import { workingGallery } from "@/features/templates/working";
import type { TutorialProps } from "./template-tutorial";
import { voiceFor } from "./voice";

/** A template's mini tutorial content: its own name, stage, value lines, How to use steps and
 * sections. Null for a template that isn't in the catalogue. */
export async function tutorialFor(code: string): Promise<TutorialProps | null> {
  const template = getTemplate(code);
  if (!template) return null;
  const schema = getSchema(template.schema ?? template.code);
  const gallery = (await workingGallery()).find((t) => t.code === code);
  return {
    code: template.code,
    name: template.name,
    icon: template.icon,
    stage: template.stage,
    forYou: gallery?.forYou ?? null,
    forTeam: gallery?.forTeam ?? null,
    steps: template.details.howTo,
    sections: (schema?.sections ?? []).map((s) => s.title),
    voice: voiceFor(template.code),
  };
}
