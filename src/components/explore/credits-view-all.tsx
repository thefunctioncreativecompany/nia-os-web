"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PersonPicture } from "@/components/nia/cast-crew-row";
import { openUpgrade } from "@/components/nia/upgrade-dialog";
import { creditsByDepartment, type Credit } from "@/features/explore/credit-format";
import { loadAllCredits } from "@/features/explore/credits-actions";

// "View all" on a Cast & Crew row: the full list by department, for paid plans; Free gets the
// upgrade prompt. The list is fetched when asked for, so pages carry only the top 10.
export function CreditsViewAll({ slug, title, total }: { slug: string; title: string; total: number }) {
  const [credits, setCredits] = useState<Credit[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const show = async () => {
    if (credits) return setOpen(true);
    setLoading(true);
    try {
      const all = await loadAllCredits(slug);
      if (all.locked) return openUpgrade("credits");
      setCredits(all.credits);
      setOpen(true);
    } catch {
      toast.error("Couldn't load the full cast and crew. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        disabled={loading}
        className="rounded-sm text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {loading ? "Loading…" : `View all ${total} →`}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <div className="flex flex-col gap-1 p-6 pb-2">
            <DialogTitle className="text-h3 font-bold">Cast &amp; Crew</DialogTitle>
            <DialogDescription>
              {title}: {total} people, by department.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-6 p-6 pt-4">
            {creditsByDepartment(credits ?? []).map((g) => (
              <section key={g.department} aria-label={g.department} className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {g.department} <span className="text-micro font-normal text-muted-foreground">{g.people.length}</span>
                </h3>
                <ul className="flex flex-col">
                  {g.people.map((p) => (
                    <li key={p.key}>
                      <Link href={p.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg p-1.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
                        <PersonPicture name={p.name} photo={p.photo} className="size-10 [&>span]:text-small" />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                          <span className="truncate text-small text-muted-foreground">{p.role}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
