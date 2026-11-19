"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { primaryVideo } from "@/lib/explore";
import { servedSized } from "@/lib/served-sized";
import { wideCoverFor, type Entry } from "@/features/explore/made-in-africa";
import { ROW_CELL } from "./row-cell";
import { TitleCard, entrySpan } from "./title-card";
import { VideoThumbnail } from "./video-thumbnail";

// A title in an Explore row whose trailer plays when the pointer rests on it (Ika, 2026-11-19).
// Opening: the poster's cell widens to a 16:9 frame at the same height while the covers beside it
// slide aside, the trailer's own still fading in over the poster like a curtain drawn open; then
// YouTube's player fades in and plays, with sound where the browser allows it (it starts muted,
// which every browser allows, then turns the sound on; if the browser refuses, it stays muted).
// Closing: the player fades out, the frame narrows back and the poster returns. Only one is open
// at a time. Near the row's right edge it grows to the left instead, so it stays in view. Desktop
// pointers only; never under reduced motion or a data saver. YouTube's rules (Required Minimum
// Functionality): playback starts only once the player shows, one player at a time, nothing drawn
// over it, at least 200 × 200 (a desktop row card opens to about 620 × 350).

const POSTER = 268 / 373;
/** The `--span` of a 16:9 frame as tall as a poster. */
const WIDE = 16 / 9 / POSTER;
/** How long the pointer rests before the trailer opens: passing across a row opens nothing. */
const INTENT_MS = 450;
/** With a card open, how long the pointer rests on the next one before they hand over. */
const HAND_OFF_MS = 150;
/** How long a card stays open after the pointer leaves it (longer than HAND_OFF_MS). */
const CLOSE_GRACE_MS = 250;
/** Explore's `duration-lift`: the frame opening or closing. */
const OPEN_MS = 600;
/** Tells the other cells which one opened, so only one is open at a time. */
const OPENED = "nia:trailer-opened";

/** A row cell's width factor (cardSpan, ROW_CELL), registered as a number so it can animate.
 * Registered here: the CSS build drops an `@property` for it. */
function registerSpan() {
  try {
    CSS.registerProperty({ name: "--span", syntax: "<number>", inherits: true, initialValue: "1" });
  } catch {
    // Already registered.
  }
}
// On load, so the first opening already eases (registering in the same moment wouldn't).
if (typeof CSS !== "undefined" && "registerProperty" in CSS) registerSpan();

function canPreview() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 48rem)").matches) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
}

/** A command to YouTube's player (its iframe API, spoken through postMessage). */
function command(frame: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

export function TrailerCell({ entry, href, sizes }: { entry: Entry; href: string; sizes: string }) {
  const video = primaryVideo(entry.title.videos);
  const id = video?.provider === "youtube" ? video.video_id : null;
  const slug = entry.title.slug;
  const base = Number((entrySpan(entry) as Record<string, number> | undefined)?.["--span"] ?? 1);
  const still = wideCoverFor(slug);

  const cell = useRef<HTMLLIElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(false);
  // The player: mounted once the frame has opened, shown once it has loaded, faded out on close.
  const [player, setPlayer] = useState<"off" | "loading" | "shown" | "leaving">("off");
  // The opened frame's size and side, fixed for the whole opening so YouTube's player never resizes.
  const [box, setBox] = useState<{ width: number; right: boolean } | null>(null);

  // Native listeners: React's own leave event didn't arrive once the player was in the card.
  useEffect(() => {
    const li = cell.current;
    const row = li?.parentElement;
    if (!li || !row || !id) return;
    let intent = 0;
    let closing = 0;
    let stage = 0;
    let follow = 0;
    let isOpen = false;
    let right = false;
    /** Two frames on, so what was just drawn hidden can then ease in. */
    const later = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

    // While the frame opens or closes near the row's right edge, scroll the row along with it so
    // the frame's right edge stays put. Snapping is paused meanwhile, or the row would jump.
    const track = () => {
      cancelAnimationFrame(follow);
      row.style.scrollSnapType = "none";
      const startWidth = li.offsetWidth;
      const startScroll = row.scrollLeft;
      const t0 = performance.now();
      const step = () => {
        if (right) row.scrollLeft = startScroll + (li.offsetWidth - startWidth);
        if (performance.now() - t0 < OPEN_MS + 80) follow = requestAnimationFrame(step);
        else if (!row.querySelector("[data-open]")) row.style.scrollSnapType = "";
      };
      follow = requestAnimationFrame(step);
    };

    // `handOff`: the pointer moved to another card in this row, which opens as this one closes, at
    // the same pace: what this one gives up the other takes, so the card under the pointer stays
    // under it and the rest of the row stays still.
    const show = (handOff: boolean) => {
      if (isOpen) return;
      isOpen = true;
      window.dispatchEvent(new CustomEvent(OPENED, { detail: { slug, row } }));
      const height = li.querySelector<HTMLElement>("[data-frame]")?.offsetHeight ?? 0;
      const width = Math.round((height * 16) / 9);
      right = !handOff && li.getBoundingClientRect().left + width > row.getBoundingClientRect().right - 8;
      li.dataset.open = "";
      setBox({ width, right });
      later(() => {
        if (!isOpen) return;
        setOpen(true);
        if (right) track();
      });
      window.clearTimeout(stage);
      stage = window.setTimeout(() => setPlayer("loading"), base >= WIDE ? 200 : OPEN_MS);
      document.addEventListener("pointermove", outside);
    };

    const hide = (handOff = false) => {
      window.clearTimeout(intent);
      window.clearTimeout(closing);
      closing = 0;
      if (!isOpen) return;
      isOpen = false;
      delete li.dataset.open;
      document.removeEventListener("pointermove", outside);
      window.clearTimeout(stage);
      setPlayer((p) => (p === "off" ? "off" : "leaving"));
      stage = window.setTimeout(() => setPlayer("off"), 160);
      if (handOff) {
        later(() => setOpen(false));
        return;
      }
      // Leaving: the player fades first, then the frame closes.
      window.setTimeout(() => {
        setOpen(false);
        track();
      }, 160);
    };

    // Leaving starts a short grace, so crossing the gap to the next card hands over instead.
    const leave = () => {
      window.clearTimeout(intent);
      if (isOpen && !closing) closing = window.setTimeout(() => hide(), CLOSE_GRACE_MS);
    };
    // A backstop for a missed leave (the cells move under a still pointer as they open and close).
    const outside = (e: PointerEvent) => {
      if (!li.contains(e.target as Node)) leave();
    };
    const enter = (e: PointerEvent) => {
      window.clearTimeout(closing);
      closing = 0;
      if (isOpen || e.pointerType !== "mouse" || !canPreview()) return;
      const handOff = [...row.querySelectorAll("[data-open]")].some((other) => other !== li);
      window.clearTimeout(intent);
      intent = window.setTimeout(() => show(handOff), handOff ? HAND_OFF_MS : INTENT_MS);
    };
    const opened = (e: Event) => {
      const other = (e as CustomEvent<{ slug: string; row: Element }>).detail;
      if (other.slug !== slug) hide(other.row === row);
    };
    const ended = () => hide();

    li.addEventListener("pointerenter", enter);
    li.addEventListener("pointerleave", leave);
    li.addEventListener("trailer-ended", ended);
    window.addEventListener(OPENED, opened);
    return () => {
      li.removeEventListener("pointerenter", enter);
      li.removeEventListener("pointerleave", leave);
      li.removeEventListener("trailer-ended", ended);
      window.removeEventListener(OPENED, opened);
      document.removeEventListener("pointermove", outside);
      window.clearTimeout(intent);
      window.clearTimeout(closing);
      window.clearTimeout(stage);
      cancelAnimationFrame(follow);
    };
  }, [id, slug, base]);

  // YouTube's player reports its state once it's listened to: turn the sound on as it starts
  // (back to muted if the browser pauses it for that), and close when the trailer ends.
  useEffect(() => {
    if (player === "off") return;
    let unmutedAt = 0;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      let state: number | undefined;
      try {
        const data = JSON.parse(e.data) as { event?: string; info?: number | { playerState?: number } | null };
        state = typeof data.info === "number" ? (data.event === "onStateChange" ? data.info : undefined) : data.info?.playerState;
      } catch {
        return;
      }
      if (state === 1 && !unmutedAt) {
        unmutedAt = performance.now();
        command(frame.current, "unMute");
        command(frame.current, "setVolume", [100]);
      } else if (state === 2 && unmutedAt && performance.now() - unmutedAt < 1500) {
        command(frame.current, "mute");
        command(frame.current, "playVideo");
      } else if (state === 0) {
        cell.current?.dispatchEvent(new Event("trailer-ended"));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [player]);

  const media =
    id && box ? (
      <span
        aria-hidden
        className={cn("absolute inset-y-0 block overflow-hidden bg-muted transition-opacity ease-out", open ? "opacity-100 duration-slow" : "opacity-0 delay-200 duration-slow")}
        style={{ width: box.width, ...(box.right ? { right: 0 } : { left: 0 }) }}
      >
        {/* The trailer's own still: what the frame opens onto, and what the player starts from. */}
        {still ? (
          <Image src={still.image} unoptimized={servedSized(still.image)} alt="" fill sizes={`${box.width}px`} className="object-cover" />
        ) : (
          video && <VideoThumbnail key={id} video={video} sizes={`${box.width}px`} />
        )}
        {player !== "off" && (
          <iframe
            ref={frame}
            title={`${entry.title.title}, trailer`}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            onLoad={() => {
              frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: slug, channel: "widget" }), "*");
              setPlayer((p) => (p === "loading" ? "shown" : p));
            }}
            // Clicks reach the card underneath (the title's page); YouTube's controls never show.
            className={cn("pointer-events-none absolute inset-0 size-full border-0 transition-opacity ease-out", player === "shown" ? "opacity-100 duration-slow" : "opacity-0 duration-fast")}
          />
        )}
      </span>
    ) : null;

  return (
    <li ref={cell} className={cn(ROW_CELL, "duration-lift ease-glide [transition-property:--span]")} style={{ "--span": open ? Math.max(base, WIDE) : base } as CSSProperties}>
      <TitleCard entry={entry} href={href} sizes={sizes} media={media} />
    </li>
  );
}
