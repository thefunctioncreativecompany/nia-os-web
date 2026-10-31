'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { FlatIcon } from '../components/flat-icon';
import type { NextTemplate } from '../catalog';

// "What's next" under the document (Ika, 2026-10-21): the documents this one usually leads to.
// Working ones open the editor, filed into the same project when there is one; ones without an
// editor yet are greyed with "Coming soon".
export function WhatsNext({ items, projectId }: { items: NextTemplate[]; projectId: string | null }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="whats-next" className="flex flex-col gap-3 border-t border-border pt-7 print:hidden">
      <h2 id="whats-next" className="text-base leading-normal font-bold text-foreground">
        What&rsquo;s next
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((t) => {
          const body = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                <FlatIcon name={t.icon} size="sm" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold">{t.name}</span>
                <span className="truncate text-caption text-muted-foreground">{t.ready ? t.stage : 'Coming soon'}</span>
              </span>
              {t.ready && <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-fast group-hover:translate-x-0.5" />}
            </>
          );
          const look = 'group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left text-foreground outline-none';
          return (
            <li key={t.code}>
              {t.ready ? (
                <Link
                  href={`/templates/${t.code}${projectId ? `?project=${projectId}` : ''}`}
                  className={cn(look, 'transition-colors duration-fast hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50')}
                >
                  {body}
                </Link>
              ) : (
                <span aria-disabled="true" className={cn(look, 'cursor-not-allowed opacity-55')}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
