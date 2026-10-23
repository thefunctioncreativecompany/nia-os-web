// Makes Nia's interface sounds with ElevenLabs Sound Effects (Ika, 2026-10-22): soft, quiet cues
// for success, navigation and problems, and the ambient loop for Explore all's canvas. (An
// opening swoosh was tried and removed.)
// They're made once and served from public/sounds, so using Nia never calls ElevenLabs.
// Run from the project root:
//   node --env-file=.env.local scripts/make-sounds.mjs           (only sounds not made yet)
//   node --env-file=.env.local scripts/make-sounds.mjs success   (remake the ones named)
// Needs ELEVENLABS_API_KEY in .env.local (set up with `npx -y @elevenlabs/cli@latest onboard init`).

import { mkdir, writeFile, access } from "node:fs/promises";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Each is described for a calm production tool: nothing bright, nothing that would tire someone
// who hears it all day. src/lib/sounds.ts plays them at low volume.
const SOUNDS = {
  success: {
    text: "Soft warm two-note chime, felt marimba, gentle and quiet, a calm confirmation sound for a clean app interface",
    durationSeconds: 0.9,
  },
  navigate: {
    text: "Very soft subtle tick, a light tap on smooth wood, minimal and quiet interface navigation sound",
    durationSeconds: 0.5,
  },
  problem: {
    text: "Low muted soft double thud, gentle and quiet error notice for an app interface, not harsh, no beep",
    durationSeconds: 0.7,
  },
  "explore-ambient": {
    text: "Quiet warm room tone of an empty screening room, faint soft film projector whir far away, calm and spacious, no voices, no music",
    durationSeconds: 20,
    loop: true,
    promptInfluence: 0.4,
  },
};

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("No ELEVENLABS_API_KEY. Run with --env-file=.env.local, or set it up with the ElevenLabs CLI.");
  process.exit(1);
}
const client = new ElevenLabsClient();
const named = process.argv.slice(2);
const dir = new URL("../public/sounds/", import.meta.url);
await mkdir(dir, { recursive: true });

for (const [name, sound] of Object.entries(SOUNDS)) {
  const file = new URL(`${name}.mp3`, dir);
  const exists = await access(file).then(() => true, () => false);
  if (named.length ? !named.includes(name) : exists) continue;
  const audio = await client.textToSoundEffects.convert({
    text: sound.text,
    durationSeconds: sound.durationSeconds,
    promptInfluence: sound.promptInfluence ?? 0.7,
    loop: sound.loop ?? false,
    modelId: "eleven_text_to_sound_v2",
    outputFormat: "mp3_44100_128",
  });
  await writeFile(file, Buffer.from(await new Response(audio).arrayBuffer()));
  console.log(`Made ${name}.mp3`);
}
