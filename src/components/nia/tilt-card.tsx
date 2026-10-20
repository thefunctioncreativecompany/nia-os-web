"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { isMouse, pointerIn, useFrame } from "@/hooks/use-pointer";

// How far the card leans toward the pointer at its edges, in degrees (Ika's Claude Design
// "Marketplace": Logistics & fleet and Digital products).
const MAX_TILT = 10;

// A link that leans toward the pointer and catches a soft sheen where it points. Put it in a
// parent with `perspective-distant` so the lean reads as depth. `children` gets the sheen layer to
// place over the picture. Mouse only; reduced motion keeps it flat.
export function TiltCard({
  href,
  label,
  className,
  shadow = true,
  children,
}: {
  href: string;
  /** What a screen reader says for the card. */
  label: string;
  className?: string;
  /** Lift the whole card's shadow while it leans; off when only the picture should cast one
   *  (add `group-hover:shadow-card-hover` to it). */
  shadow?: boolean;
  children: (sheen: ReactNode) => ReactNode;
}) {
  const reduce = useReducedMotion();
  const frame = useFrame();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduce || !isMouse(e)) return;
    const { fx, fy } = pointerIn(e);
    frame.next(() => setAt({ x: fx, y: fy }));
  };
  const onLeave = () => {
    frame.cancel();
    setAt(null);
  };

  const sheen = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 transition-opacity duration-glide"
      style={{
        opacity: at ? 1 : 0,
        background: at ? `radial-gradient(circle at ${(at.x * 100).toFixed(1)}% ${(at.y * 100).toFixed(1)}%, color-mix(in oklab, white 35%, transparent), transparent 55%)` : undefined,
      }}
    />
  );

  return (
    <Link
      href={href}
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        transform: at ? `rotateX(${((0.5 - at.y) * MAX_TILT).toFixed(2)}deg) rotateY(${((at.x - 0.5) * MAX_TILT).toFixed(2)}deg) translateZ(20px)` : undefined,
      }}
      className={cn(
        "block text-foreground outline-none transition-[transform,box-shadow] duration-glide ease-glide transform-3d focus-visible:ring-3 focus-visible:ring-ring/50",
        at && shadow && "shadow-card-hover",
        className,
      )}
    >
      {children(sheen)}
    </Link>
  );
}
