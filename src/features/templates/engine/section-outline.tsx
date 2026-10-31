'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TemplateSchema } from '../types';
import { hasContent, type SectionValue } from './sections';

// The document's sections as a row that stays at the top while you scroll (Ika, 2026-10-21): a
// tick on each one that's filled in, the one you're in marked, and a tap jumps to it. The
// "3 of 7 filled" count sits at its end. For documents with three or more sections.
export function SectionOutline({ schema, data, filled }: { schema: TemplateSchema; data: SectionValue[]; filled: number }) {
  const [current, setCurrent] = useState(0);
  const total = schema.sections.length;

  // The section nearest the top of the screen is the one you're in.
  useEffect(() => {
    const heads = schema.sections.map((_, i) => document.getElementById(`section-${i}`)).filter((h): h is HTMLElement => !!h);
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).map((e) => Number(e.target.id.replace('section-', '')));
        if (seen.length) setCurrent(Math.min(...seen));
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    heads.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [schema]);

  const jump = (i: number) => {
    const head = document.getElementById(`section-${i}`);
    if (!head) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    head.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    setCurrent(i);
  };

  return (
    <nav aria-label="Sections" className="sticky top-3 z-20 -mx-2 flex items-center gap-3 rounded-xl border border-border bg-card/90 px-2 py-2 shadow-card backdrop-blur-md print:hidden">
      <ol className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {schema.sections.map((section, i) => {
          const done = hasContent(section, data[i]);
          return (
            <li key={section.title} className="flex-none">
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={current === i ? 'step' : undefined}
                aria-label={`${section.title}${done ? ', filled' : ''}`}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full px-3 text-small font-medium whitespace-nowrap outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50',
                  current === i ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border',
                    done ? 'border-status-confirmed-foreground bg-status-confirmed-foreground text-background' : 'border-muted-foreground/40',
                  )}
                >
                  {done && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                {section.title}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="shrink-0 pr-2 text-caption text-muted-foreground" aria-live="polite">
        {filled} of {total} filled
      </span>
    </nav>
  );
}
