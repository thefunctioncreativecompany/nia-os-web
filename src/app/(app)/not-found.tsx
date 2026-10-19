import type { Metadata } from "next";

import { NotFoundView } from "@/components/nia/not-found-view";

export const metadata: Metadata = { title: "Not found · Nia OS" };

// Inside the app, so the navbar stays and there's a way back.
export default function NotFound() {
  return <NotFoundView />;
}
