import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeedPrototype } from "./feed-prototype";

export const metadata: Metadata = {
  title: "Feed prototype · Nia OS",
};

// A prototype of Explore's feed for Ika to review before it is built (2026-10-31). Hidden on the
// production site, like the component library.
export default function Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="min-h-svh bg-background">
      <FeedPrototype />
    </div>
  );
}
