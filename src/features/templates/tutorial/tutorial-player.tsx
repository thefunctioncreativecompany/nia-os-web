"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateTutorial, TUTORIAL_FPS, TUTORIAL_SIZE, tutorialTiming, type TutorialProps } from "./template-tutorial";

// Plays a template's mini tutorial once, then rests on the filled-in document with Watch again.
// Its own download (Remotion's player), loaded only where a tutorial shows. Sound starts off; when
// the template has a voice-over, a speaker button turns it on (Ika, 2026-11-14). The voice plays
// beside the player (one clip per scene, kept in step with its frames), so the video still starts
// by itself, muted, as browsers allow.
export function TutorialPlayer({ tutorial, className }: { tutorial: TutorialProps; className?: string }) {
  const player = useRef<PlayerRef>(null);
  const [ended, setEnded] = useState(false);
  const [sound, setSound] = useState(false);
  const timing = tutorialTiming(tutorial);
  const voice = tutorial.voice ?? null;
  const clips = useRef<HTMLAudioElement[]>([]);

  // One audio element per scene clip, made once per template.
  useEffect(() => {
    if (!voice) return;
    clips.current = voice.src.map((src) => {
      const a = new Audio(src);
      a.preload = "auto";
      return a;
    });
    return () => {
      clips.current.forEach((a) => a.pause());
      clips.current = [];
    };
  }, [voice]);

  // Keep the voice in step with the frames: the scene's clip plays from where the scene is.
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const starts = [0, timing.context, timing.context + timing.purpose];
    const sync = (frame: number) => {
      if (!sound || !voice) return;
      const scene = frame >= starts[2] ? 2 : frame >= starts[1] ? 1 : 0;
      const at = (frame - starts[scene]) / TUTORIAL_FPS;
      clips.current.forEach((a, i) => {
        if (i !== scene || at >= voice.seconds[i] || !p.isPlaying()) return void (a.paused || a.pause());
        if (Math.abs(a.currentTime - at) > 0.35) a.currentTime = at;
        if (a.paused) void a.play().catch(() => {});
      });
    };
    const onFrame = (e: { detail: { frame: number } }) => sync(e.detail.frame);
    const onStop = () => clips.current.forEach((a) => a.pause());
    const onEnded = () => {
      onStop();
      setEnded(true);
    };
    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("pause", onStop);
    p.addEventListener("ended", onEnded);
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("pause", onStop);
      p.removeEventListener("ended", onEnded);
    };
  }, [sound, voice, timing.context, timing.purpose]);

  const again = () => {
    setEnded(false);
    player.current?.seekTo(0);
    player.current?.play();
  };

  // Turning sound on is a tap, so every clip may play from now on (Safari asks for that).
  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    if (!on) return clips.current.forEach((a) => a.pause());
    clips.current.forEach((a) => {
      a.muted = false;
      void a.play().then(() => a.pause()).catch(() => {});
    });
    if (ended) again();
  };

  return (
    <div className={className}>
      <div className="relative">
        <Player
          ref={player}
          component={TemplateTutorial}
          inputProps={tutorial}
          durationInFrames={timing.total}
          fps={TUTORIAL_FPS}
          compositionWidth={TUTORIAL_SIZE.width}
          compositionHeight={TUTORIAL_SIZE.height}
          autoPlay
          // Rest on the last frame (the filled-in document), not back at the start.
          moveToBeginningWhenEnded={false}
          // The composition itself is silent: no hidden audio players and no audio clock, which
          // browsers hold until a click. Muted, the player keeps its own time, so it starts by itself.
          numberOfSharedAudioTags={0}
          initiallyMuted
          acknowledgeRemotionLicense
          style={{ width: "100%", aspectRatio: `${TUTORIAL_SIZE.width} / ${TUTORIAL_SIZE.height}` }}
          className="overflow-hidden rounded-xl"
        />
        {voice && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Turn the voice-over off" : "Turn the voice-over on"}
            className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm"
          >
            {sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
        )}
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
