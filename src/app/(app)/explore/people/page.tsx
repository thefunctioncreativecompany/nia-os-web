import type { Metadata } from "next";

import { PeopleBubbles } from "@/components/explore/people-bubbles";
import { featuredPeople } from "@/features/explore/people-index";

export const metadata: Metadata = {
  title: "Cast & crew · Explore · Nia OS",
};

// View all for By cast & crew (Ika, 2026-11-10): everyone credited on three or more things on
// Explore, as bubbles sized by how many. Known ahead of time, so it's drawn once at build.
export default function Page() {
  return <PeopleBubbles people={featuredPeople(3)} />;
}
