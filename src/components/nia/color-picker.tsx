"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Hsl = { h: number; l: number };

function hslToHex({ h, l }: Hsl) {
  const lightness = l / 100;
  const a = Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

function hexToHsl(hex: string): Hsl | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: Math.round(((h * 60) + 360) % 360), l: Math.round(l * 100) };
}

// Colour picker for lighting and look notes (design system Section 16.4): drag across
// the spectrum (hue left to right, light to dark top to bottom), use the arrow keys,
// or type a hex value.
export function ColorPicker({
  value,
  onChange,
  label,
  className,
}: {
  // Hex, e.g. "#FF5D6F".
  value: string;
  onChange: (next: string) => void;
  label: string;
  className?: string;
}) {
  const area = useRef<HTMLDivElement>(null);
  const hsl = hexToHsl(value) ?? { h: 0, l: 50 };
  const [draft, setDraft] = useState<string | null>(null);

  const pick = (clientX: number, clientY: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return;
    const x = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (clientY - box.top) / box.height));
    onChange(hslToHex({ h: Math.round(x * 360), l: Math.round((1 - y) * 100) }));
  };

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, Hsl> = {
      ArrowLeft: { h: (hsl.h - step + 360) % 360, l: hsl.l },
      ArrowRight: { h: (hsl.h + step) % 360, l: hsl.l },
      ArrowUp: { h: hsl.h, l: Math.min(100, hsl.l + step) },
      ArrowDown: { h: hsl.h, l: Math.max(0, hsl.l - step) },
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    onChange(hslToHex(moves[e.key]));
  };

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border border-border bg-white p-3", className)}>
      <div
        ref={area}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={hsl.h}
        aria-valuetext={value}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX, e.clientY);
        }}
        onKeyDown={nudge}
        className="relative h-28 cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{
          background:
            "linear-gradient(to bottom, #fff 0%, transparent 50%, #000 100%), linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]"
          style={{ left: `${(hsl.h / 360) * 100}%`, top: `${100 - hsl.l}%`, background: value }}
        />
      </div>
      <label className="flex items-center gap-2 text-micro font-bold tracking-wide text-muted-foreground uppercase">
        Hex
        <span aria-hidden className="size-7 shrink-0 rounded-md border border-border" style={{ background: value }} />
        <input
          value={draft ?? value}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = hexToHsl(e.target.value);
            if (next) onChange(hslToHex(next));
          }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
          className="h-7 min-w-0 flex-1 rounded-md border border-border bg-white px-2.5 font-mono text-small font-normal tracking-normal text-foreground normal-case outline-none focus-visible:border-foreground"
        />
      </label>
    </div>
  );
}
