"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Play, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { recognizeAspect } from "@/lib/aspect-ratios";
import { instagramEmbedFor } from "@/lib/instagram";
import type { InstagramReference } from "@/lib/instagram-references";
import { creditName, profileUrl } from "@/features/explore/creators";
import { removeReference } from "@/features/explore/saves";
import { useStopVideosWhenHidden } from "@/hooks/use-stop-videos";
import { Button } from "@/components/ui/button";

// An Instagram post in a project's references (Ika, 2026-10-22), laid out like a creator's film on
// Explore (creator-view.tsx): the post where the cover sits (Instagram's own player, loaded only on
// Play), its title and the team's note on the left; Details and the caption's credits on the
// right. Private to the project.
export function InstagramReferenceView({
  projectId,
  projectTitle,
  reference: ref,
  canEdit,
}: {
  projectId: string;
  projectTitle: string;
  reference: InstagramReference;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const hero = useRef<HTMLDivElement>(null);
  useStopVideosWhenHidden(hero, () => setPlaying(false));
  const back = `/projects/${projectId}#references`;
  const aspect = ref.aspect ?? 4 / 5;
  // Instagram's player shows posts at 4:5 at the tallest.
  const shape = ref.frame ? aspect : Math.max(aspect, 4 / 5);
  const posted = ref.postedOn ? new Date(`${ref.postedOn}T12:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : null;
  const shapeName = ref.aspect ? recognizeAspect(ref.aspect) : null;

  const row = (label: string, value: React.ReactNode, key = label) => (
    <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-36 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-muted-foreground">{value}</dd>
    </div>
  );

  const remove = async () => {
    setRemoving(true);
    const result = await removeReference(createClient(), ref.id);
    if (!result.ready) {
      setRemoving(false);
      return void toast.error(result.error);
    }
    toast.success(`Removed ${ref.title} from references.`);
    router.push(back);
  };

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <Link href={back} className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        ← Back to {projectTitle || "the project"}
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <div
            ref={hero}
            className={cn("relative w-full max-w-[calc(min(80svh,46rem)*var(--shape))] overflow-hidden rounded-3xl", ref.coverUrl ? "bg-foreground" : "grain-5")}
            style={{ aspectRatio: shape, "--shape": shape } as React.CSSProperties}
          >
            {playing ? (
              // As on Explore: the player's 54 px header and, for a film on black bars, the top bar
              // sit above the frame, so only the film shows.
              <iframe
                src={instagramEmbedFor(ref.link)}
                title={`${ref.title}, on Instagram`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                scrolling="no"
                className="absolute inset-x-0 -top-13.5 h-[calc(100%+--spacing(13.5)+--spacing(60))] w-full bg-foreground"
                style={ref.frame ? letterbox(aspect, ref.frame) : undefined}
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${ref.title}, from Instagram`}
                className="group absolute inset-0 flex items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                {ref.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- private covers use short-lived links, which the image optimiser would keep
                  <img src={ref.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                <span className="relative flex size-16 items-center justify-center rounded-full bg-white/90 text-foreground shadow-card-hover transition-transform duration-fast ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:scale-100!">
                  <Play aria-hidden className="ml-1 size-6 fill-current" />
                </span>
              </button>
            )}
          </div>
          <p className="-mt-3 text-caption text-muted-foreground">
            Plays from Instagram
            {ref.account && (
              <>
                , posted by{" "}
                <a href={profileUrl(ref.account)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  @{ref.account}
                </a>
              </>
            )}
            . Only people on this project can see this reference.
          </p>

          <div className="flex flex-col gap-3">
            <p className="text-small font-semibold text-muted-foreground">{[ref.productionType, ref.postedOn?.slice(0, 4), "Instagram"].filter(Boolean).join(" · ")}</p>
            <h1 className="text-h3 font-bold text-foreground md:text-h2">{ref.title}</h1>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="md" disabled={removing} onClick={() => void remove()}>
                  <X aria-hidden data-icon="inline-start" /> {removing ? "Removing…" : "Remove from references"}
                </Button>
              </div>
            )}
            {ref.note && (
              <div className="flex flex-col gap-1 pt-2">
                <h2 className="text-sm font-bold text-foreground">Note</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">{ref.note}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="details" className="flex flex-col gap-4">
            <h2 id="details" className="text-xl leading-[1.4] font-bold text-foreground">
              Details
            </h2>
            <dl className="flex flex-col gap-3">
              {ref.productionType && row("Type", ref.productionType)}
              {shapeName && row("Frame", shapeName.standard ? `${shapeName.label} · ${shapeName.standard.name}` : shapeName.label)}
              {ref.account &&
                row(
                  "Posted by",
                  <a href={profileUrl(ref.account)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
                    @{ref.account}
                    <span className="sr-only"> on Instagram (opens in a new tab)</span>
                  </a>,
                )}
              {posted && row("Posted", posted)}
            </dl>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Button variant="outline" size="md" asChild>
                <a href={ref.link.link} target="_blank" rel="noopener noreferrer">
                  View on Instagram
                  <ArrowUpRight aria-hidden data-icon="inline-end" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </div>
          </section>

          {ref.credits.length > 0 && (
            <section aria-labelledby="credits" className="flex flex-col gap-4">
              <h2 id="credits" className="text-xl leading-[1.4] font-bold text-foreground">
                Credits <span className="text-micro font-normal text-muted-foreground">{ref.credits.length}</span>
              </h2>
              <dl className="flex flex-col gap-3">
                {ref.credits.map((x, i) =>
                  row(
                    x.role,
                    x.handle ? (
                      <a href={profileUrl(x.handle)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
                        {creditName(x)}
                        <span className="sr-only"> on Instagram (opens in a new tab)</span>
                      </a>
                    ) : (
                      x.name
                    ),
                    // Roles can repeat (two producers).
                    `credit-${i}`,
                  ),
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** For a film on black bars inside a taller post: the player moves up by the top bar as well as
 * Instagram's 54 px bar (as creator-view.tsx's `letterbox`). */
function letterbox(aspect: number, frame: number): React.CSSProperties {
  const post = aspect / frame;
  return {
    top: `calc(var(--spacing) * -13.5 - ${((post - 1) / 2) * 100}%)`,
    height: `calc(${post * 100}% + var(--spacing) * 73.5)`,
  };
}
