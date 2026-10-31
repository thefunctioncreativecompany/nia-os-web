"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { TutorialProps } from "./template-tutorial";

const TutorialPlayer = dynamic(() => import("./tutorial-player").then((m) => m.TutorialPlayer), { ssr: false });

// The first time someone opens a template on this device (Ika, 2026-10-31), its mini tutorial
// plays above the document; Got it puts it away for good. Remembered in localStorage, like Sound.
const KEY = "nia-tutorials-seen";
const seen = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const noSubscribe = () => () => {};

export function FirstUseTutorial({ code, tutorial }: { code: string; tutorial: TutorialProps }) {
  const reduce = useReducedMotion();
  // Unknown while the page is drawn on the server: nothing shows until the browser has looked.
  const already = useSyncExternalStore(noSubscribe, () => seen().includes(code), () => true);
  const [closed, setClosed] = useState(false);
  if (already || closed || reduce) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), code])]));
    } catch {}
    setClosed(true);
  };

  return (
    <section aria-labelledby="first-use" className="flex flex-col gap-3 rounded-2xl border border-nia-blue/40 bg-card p-4 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 id="first-use" className="text-lead font-semibold text-foreground">
          How the {tutorial.name} works
        </h2>
        <Button variant="outline" size="compact" onClick={close}>
          Got it
        </Button>
      </div>
      <TutorialPlayer tutorial={tutorial} className="max-w-3xl" />
    </section>
  );
}
