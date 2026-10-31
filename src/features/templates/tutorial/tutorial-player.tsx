"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateTutorial, TUTORIAL_FPS, TUTORIAL_FRAMES, TUTORIAL_SIZE, type TutorialProps } from "./template-tutorial";

// Plays a template's mini tutorial once, silently, then rests on the filled-in document with
// Watch again. Its own download (Remotion's player), loaded only where a tutorial shows.
export function TutorialPlayer({ tutorial, className }: { tutorial: TutorialProps; className?: string }) {
  const player = useRef<PlayerRef>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onEnded = () => setEnded(true);
    p.addEventListener("ended", onEnded);
    return () => p.removeEventListener("ended", onEnded);
  }, []);

  const again = () => {
    setEnded(false);
    player.current?.seekTo(0);
    player.current?.play();
  };

  return (
    <div className={className}>
      <div className="relative">
        <Player
          ref={player}
          component={TemplateTutorial}
          inputProps={tutorial}
          durationInFrames={TUTORIAL_FRAMES}
          fps={TUTORIAL_FPS}
          compositionWidth={TUTORIAL_SIZE.width}
          compositionHeight={TUTORIAL_SIZE.height}
          autoPlay
          // Rest on the last frame (the filled-in document), not back at the start.
          moveToBeginningWhenEnded={false}
          // Silent: no hidden audio players and no audio clock, which browsers hold until a click.
          // Muted, the player keeps its own time, so it starts by itself.
          numberOfSharedAudioTags={0}
          initiallyMuted
          acknowledgeRemotionLicense
          style={{ width: "100%", aspectRatio: `${TUTORIAL_SIZE.width} / ${TUTORIAL_SIZE.height}` }}
          className="overflow-hidden rounded-xl"
        />
        {ended && (
          <Button variant="outline" size="compact" onClick={again} className="absolute right-3 bottom-3 bg-card/90 backdrop-blur-sm">
            <RotateCcw aria-hidden />
            Watch again
          </Button>
        )}
      </div>
      <p className="sr-only">
        A short animation: where the {tutorial.name} fits, what it does for you, and how to fill it in.
      </p>
    </div>
  );
}
