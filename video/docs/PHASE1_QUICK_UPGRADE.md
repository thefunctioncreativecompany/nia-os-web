# Phase 1: quick upgrade of the current demos

Goal: move the existing films (Explore, Projects/Templates) noticeably closer to the vision in
`FILM_BRIEF.md`, **without** the full rebuild. We upgrade the shared engine
(`video/src/Walkthrough.tsx`), so every feature film gets better at once. "Good, not perfect."

Run each prompt in **Claude Code** (VS Code), one per session, in order. After each one, open
`npm run studio` in `video/` and look before moving on.

---

## Before you start (you, 10 minutes)

1. In VS Code, open the `nia-os-web` folder.
2. In the terminal, go to the video folder and add Remotion's official skills:
   ```
   cd video
   npx skills add remotion-dev/skills
   ```
3. Put 10–20 of your own photos (Lady in Leisure, Function Studios work) in
   `public/film/own-work/`. Phase 1 barely uses them, but Phase 2 needs them.

---

## Prompt A: Save a checkpoint and fix the colors

```
This is a side project in video/, separate from BUILD_PLAN.md. Don't follow the BUILD_PLAN flow
for it.

Read video/docs/FILM_BRIEF.md and video/docs/PHASE1_QUICK_UPGRADE.md first.

1. Commit the current state of video/ (the Explore film, its narration, screenshots and capture
   scripts are uncommitted) as a checkpoint, so we can always go back. Exclude video/out/.
   Show me the commit before you push; don't push without my OK.
2. video/src/theme.ts still has Obsidian #0a0908 and gold #8a7a52, which CLAUDE.md bans. Replace
   them with the dark-mode values from src/app/globals.css (neutral greys, Nia Blue #3794FF), and
   make Walkthrough.tsx read its colors from theme.ts instead of its own hard-coded C object.
3. Check that Explore, ProjectsTemplates and MadeInAfrica still render: render one still from
   the middle of each to video/out/review/.

Explain what you changed in plain English, then stop.
```

---

## Prompt B: The cinematic look (biggest upgrade)

```
Upgrade the look of video/src/Walkthrough.tsx so every feature film feels like a product launch
film, not a screen recording. Keep the same film JSON format so explore.json still works (add new
optional fields only). Everything must be driven by useCurrentFrame(); no CSS transitions or
framer-motion.

0. Study the reference frames in video/docs/reference/wix-harmony/ first. That's the look
   we're moving towards (FILM_BRIEF.md v3): a soft, light canvas with real UI floating on it.
1. Floating window, not full screen. Show each screenshot as a window floating on a soft,
   near-white canvas with a slowly moving pale mesh gradient (about 82% of the frame, rounded
   corners from the theme, 1px light border, large soft shadow). When a shot's camera zooms in,
   the window grows past the frame edges, so push-ins still fill the screen. If the screenshots
   are dark mode, tell me; Prompt F re-captures them in light mode.
2. Tighter framing. The default camera should drift slowly (about 3% over the shot), never sit
   still, and never show a whole busy screen flat for more than ~1 second. Re-tune the camera
   values in explore.json so each shot pushes in toward the thing the line talks about (1.4x–2.2x).
3. Replace the numbered caption pills with a "whisper": at the start of each scene, the caption
   appears alone on the canvas as small, thin Geist text (~48px, Regular, sentence case, dark
   grey, max 4 words), like "drag and drop" in reference 009.3s. It holds ~1s, then the window
   comes forward. No numbers, no pills.
4. Selection boxes. Where a shot clicks something, draw a Nia Blue selection box around it
   (2px frame, small handles, a label tab) just before the click, like the reference frames.
5. Cuts. Between scenes, use a hard cut or a fast 6-frame scale-and-blur push; within a scene
   keep the short cross-fade. No slow fades between scenes.
6. Cursor. Make it larger and smoother (spring-driven), and show it only in shots that click.
7. Opening like the reference: a small whisper of text on the canvas, then the Nia wordmark,
   then a short ring of floating pieces (photos from public/film/own-work/ plus cut-out bits of
   the screenshots) orbiting the film's name, then the first shot.
8. End card: the pieces float up into a soft cluster, then the Nia wordmark on white with
   app.niatechnologies.co, held for at least 2.5 seconds.

Re-render Explore to video/out/review/B-explore.mp4 and a contact sheet (one frame per second,
tiled) to video/out/review/B-explore.jpg. Look at the contact sheet yourself and fix anything
that's hard to read or has empty edges. Then tell me what to look at, and stop.
```

---

## Prompt C: Pace and sound

```
Make the Walkthrough films feel paced and scored.

1. Pace: tighten LEAD and TAIL so lines follow each other with a short breath, not a pause.
   Aim for the Explore film to land around 45–50s instead of ~59s without cutting a line.
2. Music bed: add an optional `music` field to the film JSON. If public/film/audio/music.mp3
   exists use it, otherwise use public/sounds/explore-ambient.mp3 as a temp bed. Fade it in over
   the title, duck it about 8 dB under each voice line with 10-frame ramps, and resolve it on
   the end card.
3. Sound design: a soft whoosh on scene cuts, a click on cursor clicks, and a soft hit on the
   wordmark. Use public/sounds/ where it fits. If something's missing, tell me first and I'll
   decide whether to generate it with ElevenLabs (keys from .env only).
4. Render Explore, measure loudness with ffmpeg (loudnorm, print the stats), and set the levels
   so the film lands at about -14 LUFS integrated, true peak at or below -1 dBTP.

Render to video/out/review/C-explore.mp4, report the length and loudness, and stop.
```

---

## Prompt D: Better words (optional, but cheap)

```
Rewrite the Explore film's lines (video/src/films/explore.json) so they sound like a launch film,
not a tutorial: shorter, warmer, no "This is…" or "click", at most ~12 words a line, and
production language from CLAUDE.md. Keep the same scenes and shots. Give me the old and new
lines side by side, plus a new 2–4 word caption per scene, and wait for my OK.

After I approve, re-narrate with the existing script (scripts/narrate-film.mjs, same voice and
model, keys from .env only), re-render to video/out/review/D-explore.mp4, and stop.
```

---

## Prompt E: Bring the Projects/Templates film onto the new engine

```
video/src/ProjectsTemplates.tsx is an older standalone film; Explore uses the upgraded
Walkthrough engine. Move the Projects/Templates film onto Walkthrough so both films share the
new look:

1. Create video/src/films/projects.json (scenes, lines, captions and shots) from the current
   ProjectsTemplates film and its narration, using the screenshots and targets that
   scripts/capture/films/projects*.mjs already produce (see src/films/projects-screens.ts).
2. Reuse the existing narration audio where the lines are unchanged.
3. Register it in Root.tsx as "Projects", keep the old ProjectsTemplates composition until I've
   compared them, and render both to video/out/review/E-projects-new.mp4 and
   E-projects-old.mp4.

Tell me which one you'd keep and why, and stop.
```

---

## Prompt F: Light-mode, sharper screenshots (run before Prompt B if the screens are dark)

```
The screenshots in video/screens/ are dark mode at 1920x1080, but the new look is light mode
(FILM_BRIEF.md v3), and they go soft when the camera pushes past ~1.3x. Update the capture
scripts (scripts/capture/) to capture in light appearance at deviceScaleFactor 2 (3840x2160),
keeping the cursor targets in the same 1920x1080 coordinates. Tell me exactly what I need
running locally for the capture (dev server, a signed-in test account) before running it.
Then re-capture the Explore film's screens and re-render.
```

---

## After Phase 1

When both films look clearly better, move on to the full Wix Harmony-style film:
`CODEX_PROMPTS.md` v3, Step 1 onwards, with `FILM_BRIEF.md` v3.

Note: the Explore film shows third-party posters and Netflix trailers. That's fine for a
private share with Coodie and Chike, but the public launch film uses only your own imagery.
