import { createElement } from "react";
import type { LucideProps } from "lucide-react";

import { templateIcon, type Template } from "@/lib/templates";

// The template's Lucide icon (manifest `icon` field).
export function TemplateIcon({ template, ...props }: LucideProps & { template: Template }) {
  return createElement(templateIcon(template), { "aria-hidden": true, ...props });
}
