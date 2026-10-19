import type { Metadata } from "next";

import { NotFoundView } from "@/components/nia/not-found-view";

export const metadata: Metadata = { title: "Not found · Nia OS" };

// Everywhere else (an unknown address, a turned-off share link).
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col bg-white">
      <NotFoundView signedIn={false} />
    </main>
  );
}
