"use client";

import { useEffect, useState } from "react";
import { CloudOff, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/nia/empty-state";
import { listOfflineCopies, savedTime, type OfflineCopy } from "@/lib/offline-copies";

export function OfflineList() {
  const [copies, setCopies] = useState<OfflineCopy[] | null>(null);
  useEffect(() => {
    void listOfflineCopies().then(setCopies);
    // Back online: the page that was asked for.
    const back = () => location.reload();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);

  return (
    <>
      {copies && copies.length === 0 && <EmptyState icon={CloudOff} message="Documents you open are kept here for when you're offline." />}
      {copies && copies.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-subtitle font-semibold text-foreground">On this computer</h2>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {copies.map((c) => (
              <li key={c.href}>
                {/* A full page load on purpose: offline, only the saved page can answer it. */}
                <a href={c.href} className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                  <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{c.title}</span>
                    <span className="block truncate text-small text-muted-foreground">
                      {[c.project, `Saved ${savedTime(c.savedAt)}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Button variant="outline" className="self-start" onClick={() => location.reload()}>
        Try again
      </Button>
    </>
  );
}
