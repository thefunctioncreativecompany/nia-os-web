'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';
import { pdfPages } from '@/lib/pdf-preview';
import { Skeleton } from '@/components/ui/skeleton';
import type { TemplateSchema } from '../types';
import { toPdf } from './export';
import type { SectionValue } from './sections';

// How long after the last change the preview redraws.
const SETTLE_MS = 600;
// Page pictures this wide: sharp in the panel on a retina screen.
const PAGE_PX = 1000;

// The document as it will download (Ika, 2026-10-21: the editor shows the real thing, as Explore
// does): the same PDF Download makes, drawn page by page, redrawn a moment after each change. The
// last pages stay on screen while the next ones draw, so nothing flashes. Its height leaves room
// for Save and Download below it in the pinned panel on short laptop screens.
export function LivePreview({ schema, data, branded }: { schema: TemplateSchema; data: SectionValue[]; branded: boolean }) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [updating, setUpdating] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const mine = ++run.current;
    const timer = window.setTimeout(async () => {
      setUpdating(true);
      try {
        const blobs = await pdfPages(await toPdf(schema, data, branded), PAGE_PX);
        if (mine !== run.current) return;
        const urls = blobs.map((b) => URL.createObjectURL(b));
        setPages((old) => {
          old?.forEach((u) => URL.revokeObjectURL(u));
          return urls;
        });
        setFailed(false);
      } catch {
        if (mine === run.current) setFailed(true);
      } finally {
        if (mine === run.current) setUpdating(false);
      }
    }, pages ? SETTLE_MS : 0);
    return () => window.clearTimeout(timer);
    // `pages` only decides the first wait; it mustn't start another redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, data, branded]);

  // Let go of the page pictures when the editor closes.
  useEffect(() => () => setPages((old) => (old?.forEach((u) => URL.revokeObjectURL(u)), null)), []);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="max-h-[max(16rem,calc(100svh-26rem))] overflow-y-auto rounded-xl border border-border bg-secondary/60 p-3">
        {failed && !pages ? (
          <p className="p-4 text-small text-muted-foreground">The preview couldn&rsquo;t be drawn. Downloads still work.</p>
        ) : !pages ? (
          <Skeleton className="aspect-[8.5/11] w-full rounded-md bg-white" aria-label="Drawing the preview" />
        ) : (
          <ol className="flex flex-col gap-3">
            {pages.map((src, i) => (
              <li key={src}>
                {/* A picture made in the browser from the PDF, so next/image has nothing to optimise. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${schema.name}, page ${i + 1} of ${pages.length}`}
                  className={cn('block w-full rounded-md bg-white shadow-card transition-opacity duration-base ease-out', updating && !reduce && 'opacity-85')}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
      <p aria-live="polite" className="text-caption text-muted-foreground">
        This is the PDF you&rsquo;ll download{pages ? ` · ${updating ? 'updating…' : `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`}` : ''}.
      </p>
    </div>
  );
}
