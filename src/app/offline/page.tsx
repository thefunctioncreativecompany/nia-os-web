import type { Metadata } from "next";

import { Wordmark } from "@/components/nia/wordmark";
import { OfflineList } from "./offline-list";

export const metadata: Metadata = {
  title: "Offline · Nia OS",
};

// What Nia shows with no internet (FEEDBACK D5): the documents saved on this computer, which
// still open. Kept by the service worker (public/sw.js) and shown at whatever address was asked.
export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-foreground">
      <header className="border-b border-nia-line px-4 py-6 md:px-page">
        <Wordmark />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 md:py-16">
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">You&apos;re offline</h1>
        <OfflineList />
      </main>
    </div>
  );
}
