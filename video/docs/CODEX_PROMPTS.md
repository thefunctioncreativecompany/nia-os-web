# Film prompts (v3, Wix Harmony style), for Claude Code

Send these to Claude Code in VS Code **one per session, in order**. Each ends with the agent
stopping so you can review. The brief is `video/docs/FILM_BRIEF.md` (v3); the reference frames
are in `video/docs/reference/wix-harmony/`.

Each step lists **What you do** (outside the code) and **Prompt** (paste into Claude Code).

---

## Step 1: Study the reference and check features

**Prompt:**
```
This is a side project in video/, separate from BUILD_PLAN.md.

Read video/docs/FILM_BRIEF.md (v3) and CLAUDE.md in full. Look at every image in
video/docs/reference/wix-harmony/ (key frames named by timestamp, plus contact sheets at one
frame per second).

1. Write video/docs/REFERENCE_NOTES.md: measure what you see, with numbers. Canvas colours (sample
   hex values), panel radius and shadow, chip sizes, selection box style, type sizes as % of frame
   height, how much empty space surrounds each moment, and how each transition works. End with 12
   rules we copy and 5 things we must not copy.
2. Check every feature in the beat sheet (section 2) against docs/FEEDBACK.md and the app code.
   Mark each one live / partly / not built, and suggest a live swap for anything that isn't live.
3. Find what Copilot looks like in the live app (does it have an avatar or icon?) and how the AI
   draft marker renders in light mode.
4. List the real component files for each UI replica in FILM_BRIEF.md section 8.

Don't write film code. Explain in plain English and stop.
```

---

## Step 2: Storyboard in Claude Design

**What you do:** in a Claude chat, ask for a Claude Design storyboard of *Introducing Nia* from
FILM_BRIEF.md and REFERENCE_NOTES.md: 14 key frames at 16:9, one per beat. Mark your favourites,
change what you don't like, then export the frames as PNGs into
`video/docs/styleframes/introducing-nia/`. Decide the canvas tint and the Copilot presence here.

---

## Step 3: Gather and prepare the content

**What you do:** put the photos for each production in `public/film/productions/<name>/`
(editorial, music-video, documentary, campaign). 8–15 images each, your own work.

**Prompt:**
```
Read FILM_BRIEF.md and the style frames in video/docs/styleframes/introducing-nia/.

1. For each production in public/film/productions/, write video/src/film/productions/<name>.ts:
   project name, phase, crew of 5–7 (fictional names, real production roles), call time,
   location, the Copilot prompts in natural producer language, and which photos go where
   (cover, full-bleed, ring pieces).
2. Make transparent cut-outs of the photos marked as cut-outs, using rembg locally (install it
   in a Python virtual environment under video/.venv, which should be gitignored; ask before
   installing). Save as PNGs next to the originals with a -cutout suffix. Show me a contact
   sheet of the cut-outs.
3. List any 3D/chrome objects or extra images the storyboard needs that I don't have, with a
   ready-to-paste Midjourney/Flux prompt for each, matching the style frames.
Stop.
```

---

## Step 4: Film kit (canvas, primitives)

**Prompt:**
```
Build the film kit from FILM_BRIEF.md sections 4, 5 and 8 and REFERENCE_NOTES.md. No scenes yet.

- Install @remotion/transitions, @remotion/motion-blur and @remotion/noise pinned exactly to the
  installed remotion version. Ask before adding anything else.
- tokens.ts (light-mode tokens from src/app/globals.css), beats.ts (BPM 120, offset 0 for now).
  Also fix video/src/theme.ts if it still has Obsidian or gold.
- canvas/: MeshGradient (slow-moving pale tints as approved in the style frames), Shimmer
  (iridescent AI-working fill that resolves into content), SoftType (giant out-of-focus type).
- primitives/: Camera, FloatRing, FloatCluster, PushThrough, BlurWhip, Typewriter (realistic
  rhythm), SelectionBox, Chip, Panel, Cursor, Whisper, Wordmark.
- A "FilmKitLab" composition showing each one, laid out like the matching reference frame.

Everything driven by useCurrentFrame(). Render video/out/review/04-kit.jpg, put it next to the
matching reference frames, fix what's off, then stop.
```

---

## Step 5: UI replicas in light mode

**Prompt:**
```
Build the UI replicas in video/src/film/ui/ (FILM_BRIEF.md section 8), in light mode.

For each, open the real component and match layout, spacing, radii, type and tokens exactly, as
pure frame-driven React (no next/*, framer-motion or Supabase). Each takes plain props plus
`build` (0 to 1) so scenes can assemble it piece by piece, supports a `selected` state with the
SelectionBox, and stays sharp at a 2.5x push-in. CopilotProposal shows the AI draft marker
exactly as the live app does, plus a `drafting` state that uses Shimmer.

Fill them with content from video/src/film/productions/. Make a "UiLab" composition showing
each replica assembled, building, drafting and selected, floating on the MeshGradient. Compare
with the style frames and the reference frames. Render video/out/review/05-ui.jpg and stop.
```

---

## Step 6: Animatic of the whole film

**Prompt:**
```
Build the shared ShowcaseFilm structure and video/src/film/films/introducing-nia.tsx from the
beat sheet in FILM_BRIEF.md section 2. Register "IntroducingNia" (1920x1080, 30fps) in Root.tsx.

Animatic quality: real layout and content, rough motion, every beat timed on the beat grid, a
temporary click track, and a debug layer (prop `debug`) showing the beat name and timecode.

Render video/out/review/06-animatic.mp4 and 06-boards.jpg: one frame per beat next to its style
frame and the closest reference frame. List every Quality bar item that fails. Stop.
```

---

## Step 7: Polish the opening (whisper, logo, pillars, the ask)

**Prompt:**
```
Polish 0:00–0:16 of IntroducingNia to final quality, matching the reference frames
000.0s–015.0s: the whisper text, the wordmark, "Copilot drafts." with floating AI drafts and
Shimmer, "You decide." with the FloatRing of ~20 production pieces orbiting in 3D (selection
boxes, chips, cut-outs, depth blur on far pieces), then Copilot appearing, the prompt typing
with real rhythm, and "Planning your production" over SoftType of the project name. Render
video/out/review/07-opening.mp4 with a contact sheet next to the reference frames. Stop.
```

---

## Step 8: Polish the productions

**Prompt:**
```
Polish the four productions and the burst (0:16–1:07). For each: prompt → Shimmer → result
lands → a visible human edit (cursor, SelectionBox, a value changed by hand). Big and close, one
idea per moment, about two visual changes per second, PushThrough or BlurWhip between them.
- Editorial: project page assembles; the Copilot call sheet draft; Apply; call time edited by hand;
  crew chips drop in.
- Burst: + New → Call sheet → Shot list → Script, one per half second, over full-bleed photos.
- Music video: template picked, shot list builds, script page.
- Documentary: Explore search, tiles scatter in, timeline slide, Add to project.
- Campaign: location card on a full-bleed photo, crew across days, a clash caught → Move → Apply.
Use only features marked live in REFERENCE_NOTES.md. Render video/out/review/08-productions.mp4
with a contact sheet. Stop.
```

---

## Step 9: Polish the ending (montage, float out, logo)

**Prompt:**
```
Polish 1:07–1:25: the montage (one live tool per half second), the FloatCluster float-out (every
piece from the film lifts into a slow 3D cluster with depth blur, matching reference
084.5s-cluster-float-out), then the wordmark on white with the URL and "Now in beta", held at
least 2.5 seconds. Render the full film to video/out/review/09-full-silent.mp4 and stop.
```

---

## Step 10: Music and sound

**What you do:** pick a licensed track (about 115–125 BPM, upbeat, modern) and save it as
`public/film/audio/introducing-nia.mp3`.

**Prompt:**
```
Add sound to IntroducingNia per FILM_BRIEF.md section 6. Keys only from .env / .env.local.
1. Find the track's real BPM and downbeat, update beats.ts, re-snap every cut, and tell me which
   moved.
2. Sound design: typing, UI ticks, send whooshes, a Shimmer sound when AI drafts, the saved
   tick on Apply, a lift into the float-out. Use public/sounds/ first; list anything missing
   before generating it with ElevenLabs.
3. Mix, measure with ffmpeg loudnorm, and land at -14 LUFS, true peak at or below -1 dBTP.
Render video/out/review/10-sound.mp4 and stop.
```

---

## Step 11: Finishing pass and masters

**Prompt:**
```
Finishing pass on IntroducingNia as a senior motion designer at Wix Motion Studio would do it.
Render a contact sheet every 0.5s, put it next to the reference contact sheets, critique the 15
weakest moments (frame number plus fix), apply the fixes, then render:
  npx remotion render IntroducingNia out/introducing-nia.mp4 --codec=h264 --crf=16
  npx remotion render IntroducingNia out/introducing-nia-master.mov --codec=prores --prores-profile=hq
Re-check the Quality bar and show me before/after contact sheets. Stop.
```

---

## Step 12: Cutdowns

**Prompt:**
```
Make Vertical (1080x1920, ~30s), Square (1080x1080, ~30s) and Teaser (16:9, ~15s) versions of
IntroducingNia from the same scenes. Recompose for each shape (keep the top 220px and bottom
380px of vertical clear), cut on the music's bar lines, register them, add npm scripts, render
all to out/, and show me a contact sheet of each. Stop.
```

---

## Step 13: Feature films (repeat per feature)

**Prompt:**
```
Make the [Explore / Projects and templates / Schedule] feature film using the structure in
FILM_BRIEF.md section 3 (25–45s) on the shared ShowcaseFilm, reusing every primitive and UI
replica. Propose its beat sheet first (whisper word, the ask, 2–3 productions, montage tools),
with only live features, and wait for my OK. Then build it, render an animatic, and stop.
```

---

## Fix-it prompt (any time)

```
In [film], at [timestamp]: [what's wrong]. Compare against the closest frame in
video/docs/reference/wix-harmony/. Fix only that, re-render the affected part to
video/out/review/fix-[name].mp4 with a contact sheet, check the Quality bar, and stop.
```
