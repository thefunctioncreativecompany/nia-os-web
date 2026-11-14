// Makes the voice-over for each template's mini tutorial with ElevenLabs (Ika, 2026-11-14: "add
// voice over using eleven labs, default sound off"). Three clips per template, one per scene, read
// from the template's own words (nothing invented): its name, stage and what it does for the team;
// what it does for you; then its first three How to use steps. They're made once and served from
// public/tutorial-voice, so watching a tutorial never calls ElevenLabs. Each clip's length goes to
// src/features/templates/tutorial/voices.json, and the tutorial stretches each scene to fit.
//
// Run from the project root:
//   node --env-file=.env.local scripts/make-tutorial-voices.mjs --dry        (count characters only)
//   node --env-file=.env.local scripts/make-tutorial-voices.mjs              (every template not made yet)
//   node --env-file=.env.local scripts/make-tutorial-voices.mjs UL-01 D07    (make, or remake, the ones named)
// Needs ELEVENLABS_API_KEY in .env.local. ElevenLabs' free plan doesn't allow commercial use; use a
// paid plan (Starter or above) for voices that ship.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { LAUNCHES } from "../src/features/templates/launches.ts";

// A calm, clear narrator. Change it here and remake with the codes (or delete voices.json entries).
const VOICE_ID = process.env.TUTORIAL_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // ElevenLabs "Sarah"
const MODEL = "eleven_multilingual_v2";
const OUT_DIR = "public/tutorial-voice";
const INDEX = "src/features/templates/tutorial/voices.json";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const named = args.filter((a) => !a.startsWith("--"));

const manifest = JSON.parse(await readFile("src/data/templates.manifest.json", "utf8"));
const index = JSON.parse(await readFile(INDEX, "utf8"));

// The tutorials play for working templates, the ones with launch lines.
const templates = manifest.templates.filter((t) => LAUNCHES[t.code] && t.details?.howTo?.length);
const todo = templates.filter((t) => (named.length ? named.includes(t.code) : !index[t.code]));

const sentence = (s) => (s && /[.!?]$/.test(s.trim()) ? s.trim() : s ? `${s.trim()}.` : "");
const scripts = (t) => {
  const launch = LAUNCHES[t.code];
  return [
    [`${t.name}.`, `${t.stage}.`, sentence(launch.forTeam)].filter(Boolean).join(" "),
    sentence(launch.forYou) || `What the ${t.name} is for, on one page.`,
    ["How to use it.", ...t.details.howTo.slice(0, 3).map(sentence)].join(" "),
  ];
};

const characters = todo.reduce((n, t) => n + scripts(t).join("").length, 0);
console.log(`${todo.length} template${todo.length === 1 ? "" : "s"} to make, about ${characters} characters.`);
if (dry) {
  for (const t of todo.slice(0, 3)) console.log(`\n${t.code} ${t.name}\n  ${scripts(t).join("\n  ")}`);
  process.exit(0);
}
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("No ELEVENLABS_API_KEY. Run with --env-file=.env.local.");
  process.exit(1);
}

const client = new ElevenLabsClient();
await mkdir(OUT_DIR, { recursive: true });
for (const t of todo) {
  const seconds = [];
  for (const [i, text] of scripts(t).entries()) {
    const res = await client.textToSpeech.convertWithTimestamps(VOICE_ID, {
      text,
      modelId: MODEL,
      outputFormat: "mp3_44100_64",
      voiceSettings: { stability: 0.6, similarityBoost: 0.75, speed: 0.95 },
    });
    await writeFile(`${OUT_DIR}/${t.code}-${i}.mp3`, Buffer.from(res.audioBase64, "base64"));
    const ends = res.alignment?.characterEndTimesSeconds ?? [];
    seconds.push(Math.round((ends.at(-1) ?? 0) * 100) / 100);
  }
  index[t.code] = { seconds };
  // Saved after each template, so a stopped run keeps what it made.
  await writeFile(INDEX, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`${t.code} ${t.name}: ${seconds.join("s, ")}s`);
}
