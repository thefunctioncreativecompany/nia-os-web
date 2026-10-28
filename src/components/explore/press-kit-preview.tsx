"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getFilm, type CategoryItem } from "./explore-data";
import { filmHref, getFilmDetails, lengthOf } from "./film-details";
import { NotYet } from "@/components/nia/not-yet";
import { PressKitBody, pressSummary } from "./press-kit-body";
import { getPress } from "./press-coverage";

// The film preview (Ika, 2026-10-20), opened from Explore's press kits, poster grid and director's
// notes (not Latest projects), laid out like the template preview pop-up: the film's
// official video, a short summary and the facts, with links out to IMDb, Rotten Tomatoes and
// Wikipedia. The video loads only when Play is pressed, from YouTube's privacy-enhanced player.
// Previous / next (← →) move through the list it was opened from; Escape or outside closes it.
// Full screen on phones. The Top 10 press kits also gather the press tour on video, what critics
// said (praise and criticism alike) and context articles (press-coverage.ts, Ika 2026-10-28);
// choosing a press-tour video plays it in the main player.
export function PressKitPreview({
  item,
  list,
  onNavigate,
  onClose,
  actionLabel = () => "Open press kit",
}: {
  item: CategoryItem;
  list: CategoryItem[];
  onNavigate: (item: CategoryItem) => void;
  onClose: () => void;
  /** The main button's words for this film ("Open press kit", "Open film page", "Open Call Sheet"). */
  actionLabel?: (item: CategoryItem) => string;
}) {
  const film = getFilm(item.filmId);
  const details = getFilmDetails(item.filmId);
  // Films open their own page; documents from the director's notes wait for the editor.
  const href = details && !item.documentType ? filmHref(item.filmId) : null;
  const press = getPress(item.filmId);
  const scroller = useRef<HTMLDivElement>(null);
  const index = list.findIndex((x) => x.filmId === item.filmId);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  // Back to the top for each film.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [item.filmId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" && next) onNavigate(next);
    if (e.key === "ArrowLeft" && prev) onNavigate(prev);
  };

  const meta = details ? [details.kind, details.year, lengthOf(details)].filter(Boolean).join(" · ") : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        className="flex max-w-none flex-col gap-0 overflow-hidden p-0 max-sm:h-svh max-sm:w-screen max-sm:rounded-none sm:h-[min(92svh,62.5rem)] sm:w-[min(62rem,calc(100vw-3rem))] sm:max-w-none"
      >
        <div className="flex items-center gap-1 border-b border-border px-3.5 py-3">
          <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label={prev ? `Previous: ${getFilm(prev.filmId).title}` : "Previous"}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => next && onNavigate(next)} aria-label={next ? `Next: ${getFilm(next.filmId).title}` : "Next"}>
            <ChevronRight />
          </Button>
          <div className="flex-1" />
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-225 px-4 pt-8.5 pb-14 sm:px-9.5">
            <p className="text-micro font-semibold text-muted-foreground">
              {item.rank ? `Number ${item.rank} · ` : ""}
              {meta ?? "Press kit"}
            </p>
            <DialogTitle className="mt-2.5 mb-4 text-display leading-tight font-semibold tracking-tight text-foreground">{film.title}</DialogTitle>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {details?.createdBy ? "Created by " : "Directed by "}
                <span className="font-semibold text-foreground">{details?.createdBy ?? film.director}</span>
              </p>
              {href ? (
                // What the full press kit holds, so it's clear there's more than the pop-up shows.
                <div className="flex flex-col items-end gap-1.5">
                  <Button asChild className="px-6.5">
                    <Link href={href}>{actionLabel(item)}</Link>
                  </Button>
                  {press && <p className="text-caption text-muted-foreground">{pressSummary(press)} in the press kit</p>}
                </div>
              ) : (
                // Director's notes documents open with the document editor.
                <div className="flex flex-col items-end gap-1.5">
                  <Button disabled className="px-6.5">
                    {actionLabel(item)}
                  </Button>
                  <NotYet>Opens with Explore in February 2027</NotYet>
                </div>
              )}
            </div>

            <PressKitBody key={item.filmId} filmId={item.filmId} inDialog />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
