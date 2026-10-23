"use client";

import { useEffect } from "react";

import { playSound, type Cue } from "@/lib/sounds";

/** Plays a cue when it appears: put it inside something that mounts at the moment, like a toast's
 * icon or a dialog's content. Renders nothing. */
export function SoundCue({ cue }: { cue: Cue }) {
  useEffect(() => playSound(cue), [cue]);
  return null;
}
