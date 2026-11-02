"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// "← Back to …" links that go back the way people came (Ika, 2026-11-02: coming back from a
// film should land where they left off, all over the app). When the page before this one is the
// link's page, the link steps back through the browser's history, so that page returns exactly
// as it was left (scroll, rows, filters, Explore's order); otherwise it opens the page as usual.
//
// The trail is the last two addresses visited in this tab, kept in sessionStorage: on this
// device only, never sent anywhere, gone when the tab closes.

const KEY = "nia-trail";

function trail(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Records each page visited (mounted once in the app shell). */
export function NavTrail() {
  const path = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    const here = query ? `${path}?${query}` : path;
    const t = trail();
    if (t.at(-1) === here) return;
    // Arriving back at the page before (a Back) drops the page we left; anything else adds.
    const next = t.at(-2) === here ? t.slice(0, -1) : [...t, here].slice(-12);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [path, query]);
  return null;
}

const pathOf = (href: string) => href.split(/[?#]/)[0];

export function BackLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const before = trail().at(-2);
        if (before && pathOf(before) === pathOf(href)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
