import type { Metadata } from "next";

import { TemplatesGallery } from "@/components/templates/templates-gallery";

export const metadata: Metadata = {
  title: "Templates · Nia OS",
};

export default function Page() {
  return <TemplatesGallery />;
}
