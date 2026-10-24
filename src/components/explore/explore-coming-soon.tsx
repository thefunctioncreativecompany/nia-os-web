"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ComingSoonCard, comingSoonButton } from "@/components/nia/coming-soon-card";
import { isMouse, pointerIn, useFrame, useMediaQuery } from "@/hooks/use-pointer";
import { useWaitlist } from "@/hooks/use-waitlist";
import { getFilm } from "./explore-data";
import { InviteCodeForm } from "@/components/nia/invite-code-form";
import { PosterArt } from "./poster-art";

// The design's ring, in its order.
const RING = [
  "sinners", "hamnet", "the-odyssey", "heart-of-the-hunter", "the-woman-king", "the-polygamist",
  "avatar-the-way-of-water", "the-dink", "blonde", "scream", "the-queens-gambit", "phantom",
  "michael", "500-days-of-summer",
].map(getFilm);

// Degrees per frame: the steady turn, and how much the pointer's side speeds it up or reverses it.
const SPIN = 0.07;
const STEER = 1.2;

// Explore, coming soon: Ika's Claude Design "ExploreSoon" as designed (2026-10-20). Fourteen
// posters on a ring that turns on its own; moving the pointer left or right steers it, up and down
// tilts it. A frosted card rises in over it. Platform font, colours, buttons and sentence case.
// Reduced motion stops the ring and the pulse.
export function ExploreComingSoon() {
  const reduce = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState(0.5);
  const frame = useFrame();
  const { waiting, toggle, email } = useWaitlist("explore", {
    joined: "We'll let you know when Explore opens.",
    left: "You won't get a note when Explore opens.",
  });
  // Phones: the card fills the middle, so the ring stands taller to show above and below it.
  const narrow = useMediaQuery("(max-width: 40rem)");

  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const tick = () => {
      setAngle((a) => (a + SPIN + (pointer.current.x - 0.5) * STEER) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !isMouse(e)) return;
    const { fx, fy } = pointerIn(e);
    pointer.current = { x: fx, y: fy };
    frame.next(() => setTilt(fy));
  };
  const onLeave = () => {
    frame.cancel();
    pointer.current = { x: 0.5, y: 0.5 };
    setTilt(0.5);
  };

  const radiusY = narrow ? 29 + tilt * 6 : 16 + tilt * 16;
  const cards = RING.map((film, i) => {
    const theta = ((angle + (i * 360) / RING.length) * Math.PI) / 180;
    const depth = (Math.sin(theta) + 1) / 2;
    return {
      film,
      style: {
        left: `${(50 + Math.cos(theta) * 41).toFixed(2)}%`,
        top: `${(50 + Math.sin(theta) * radiusY).toFixed(2)}%`,
        transform: `translate(-50%, -50%) scale(${(0.55 + 0.6 * depth).toFixed(3)})`,
        zIndex: Math.round(depth * 100),
        opacity: Number((0.35 + 0.65 * depth).toFixed(2)),
        filter: `blur(${(2 * (1 - depth)).toFixed(1)}px) saturate(${(0.5 + 0.5 * depth).toFixed(2)})`,
      },
    };
  });

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate h-[calc(100svh-5rem)] min-h-140 touch-pan-y overflow-hidden bg-white"
    >
      {cards.map(({ film, style }) => (
        <div
          key={film.id}
          aria-hidden
          style={style}
          className="absolute aspect-[268/373] w-[clamp(7.5rem,13vw,10.625rem)] overflow-hidden rounded-lg bg-muted shadow-card"
        >
          <PosterArt film={film} sizes="170px" />
        </div>
      ))}

      <ComingSoonCard
        status="Early access by invite"
        title="Explore"
        note={email && <>We&rsquo;ll email {email} when Explore opens.</>}
        actions={
          <>
            {waiting ? (
              <Button variant="outline" onClick={() => void toggle()} aria-pressed className={comingSoonButton}>
                <Check aria-hidden /> We&rsquo;ll let you know
              </Button>
            ) : (
              <Button onClick={() => void toggle()} disabled={waiting === null} className={comingSoonButton}>
                Notify me
              </Button>
            )}
            <InviteCodeForm area="explore" unlocked="Explore is unlocked. Welcome in." />
          </>
        }
      >
        Films, series and creators&rsquo; work with full production credits, ready to save to your projects. Open to invited members now, and to everyone in February 2027.
      </ComingSoonCard>
    </div>
  );
}
