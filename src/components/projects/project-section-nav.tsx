"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type ProjectSection = {
  id: string;
  label: string;
  /** Lives under Details on the right, so that tab opens first. */
  inDetails?: boolean;
};

// The project page's section links (Ika, 2026-11-12, variation 2 "Cover hero with section tabs"):
// under the cover, they stay below the top bar as the page scrolls. Each jumps to its section
// (opening Details first when it lives there) and is marked while you're reading it.
export function ProjectSectionNav({ sections, onDetails }: { sections: ProjectSection[]; onDetails: () => void }) {
  const bar = useRef<HTMLElement>(null);
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // Where a section's top lands when the bar is stuck: under the bar, with a little room.
  const offset = () => {
    const el = bar.current;
    if (!el) return 0;
    return (parseFloat(getComputedStyle(el).top) || 0) + el.offsetHeight + 16;
  };

  // Follow the reader: the section whose top is closest above the bar.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const edge = offset() + 8;
      let best = sections[0]?.id ?? "";
      let bestTop = -Infinity;
      for (const s of sections) {
        const top = document.getElementById(s.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= edge && top > bestTop) {
          best = s.id;
          bestTop = top;
        }
      }
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  const go = (s: ProjectSection) => {
    if (s.inDetails) onDetails();
    // After Details has drawn, when it had to open.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset(), behavior: reduce ? "auto" : "smooth" });
        setActive(s.id);
      }),
    );
  };

  return (
    <nav
      ref={bar}
      aria-label="Project sections"
      className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/90 px-4 backdrop-blur-md md:-mx-page md:px-page lg:top-16 print:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(s);
              }}
              className={cn(
                "-mb-px flex border-b-2 px-3 pt-4 pb-3.5 text-sm whitespace-nowrap outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                active === s.id ? "border-nia-blue font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
