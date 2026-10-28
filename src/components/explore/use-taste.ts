"use client";

import { useState } from "react";

import type { Taste } from "@/features/explore/match";
import { loadTaste } from "@/features/explore/taste";

/** This person's Explore taste (match.ts), loaded the first time "For you" is chosen. */
export function useTaste() {
  const [taste, setTaste] = useState<Taste | null>(null);
  const load = () => {
    if (taste === null) void loadTaste().then(setTaste, () => setTaste(new Map()));
  };
  return { taste, load };
}
