import type { Metadata } from "next";

import { ExploreLibrary } from "@/components/explore/explore-library";

export const metadata: Metadata = {
  title: "Explore preview · Nia OS",
};

// "Preview Explore" on the coming-soon screen: the library with sample films, before it opens.
export default function Page() {
  return <ExploreLibrary />;
}
