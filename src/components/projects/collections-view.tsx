"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nia/empty-state";
import { NotYet } from "@/components/nia/not-yet";
import { AddToProject } from "@/components/explore/save-controls";
import { FilmGallery } from "@/components/explore/film-gallery";
import { exploreItem } from "@/features/explore/items";
import { exploreHome } from "@/features/explore/made-in-africa";
import { exploreAccess, loadCollections, unsaveTitle, type Collection } from "@/features/explore/saves";

// Projects › Collections (Ika, 2026-10-21): the titles you've saved from Explore, collection by
// collection, each ready to add to a project's references. Collections are private to you.
export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [access, setAccess] = useState<boolean | null>(null);

  const load = async () => {
    const result = await loadCollections(createClient());
    if (result.ready) setCollections(result.data);
    else setProblem(result.error);
  };
  useEffect(() => {
    let live = true;
    const db = createClient();
    void exploreAccess(db).then((yes) => live && setAccess(yes));
    void loadCollections(db).then((result) => {
      if (!live) return;
      if (result.ready) setCollections(result.data);
      else setProblem(result.error);
    });
    return () => {
      live = false;
    };
  }, []);

  const remove = async (c: Collection, itemId: string, name: string) => {
    const result = await unsaveTitle(createClient(), itemId);
    if (!result.ready) return void toast.error(result.error);
    toast.success(`Removed ${name} from ${c.name}.`);
    void load();
  };

  const filled = (collections ?? []).filter((c) => c.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-bold text-foreground">Collections</h1>
        <p className="max-w-160 text-lead text-muted-foreground">Titles you&rsquo;ve saved from Explore, ready to add to a project&rsquo;s references.</p>
      </div>

      {access === false && filled.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          message="Collections come with Explore, open to invited members for now. Enter your invite code on Explore to start saving."
          action={
            <Button asChild variant="outline">
              <Link href="/explore">Enter an invite code</Link>
            </Button>
          }
        />
      ) : problem ? (
        <NotYet>{problem} Saved titles will appear here once they are.</NotYet>
      ) : !collections ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true" aria-label="Loading collections">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[268/373] rounded-lg" />
          ))}
        </div>
      ) : filled.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          message="Save titles from Explore and they'll gather here, ready for your projects."
          action={
            <Button asChild variant="outline">
              <Link href={exploreHome()}>Browse Explore</Link>
            </Button>
          }
        />
      ) : (
        filled.map((c) => (
          <section key={c.id} aria-labelledby={`collection-${c.id}`} className="flex flex-col gap-4">
            <h2 id={`collection-${c.id}`} className="text-subtitle font-semibold text-foreground">
              {c.name} <span className="text-micro font-normal text-muted-foreground">{c.items.length}</span>
            </h2>
            {/* At their true shapes, like Explore's galleries (Ika, 2026-10-22). */}
            <FilmGallery
              label={c.name}
              entries={c.items.flatMap((item) => {
                const entry = exploreItem(item.slug);
                if (!entry) return [];
                return [
                  {
                    item: entry,
                    href: entry.href(),
                    actions: (
                      <>
                        <AddToProject slug={entry.slug} title={entry.title} size="compact" />
                        <Button variant="ghost" size="compact" aria-label={`Remove ${entry.title} from ${c.name}`} onClick={() => void remove(c, item.id, entry.title)}>
                          <X aria-hidden /> Remove
                        </Button>
                      </>
                    ),
                  },
                ];
              })}
            />
          </section>
        ))
      )}
    </div>
  );
}
