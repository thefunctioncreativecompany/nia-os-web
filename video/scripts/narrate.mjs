// Turns the projects and templates film's voice-over (src/narration.json) into speech with
// ElevenLabs, one file per step in narration/, and writes src/narration-audio.ts so the film
// times each step to its line. Lines that haven't changed since the last run aren't sent again.
//
// Needs ELEVENLABS_API_KEY in the web app's .env.local (never in code or chat).
// Run from video/: npm run narrate
import fs from "node:fs";
import path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const root = path.resolve(import.meta.dirname, "..");
// The key lives in the web app's .env.local (set up with the ElevenLabs CLI); the SDK reads
// ELEVENLABS_API_KEY from the environment.
const envFile = path.resolve(root, "../.env.local");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("No ELEVENLABS_API_KEY. Run `npx -y @elevenlabs/cli@latest onboard init` in the web app folder.");
  process.exit(1);
}
const client = new ElevenLabsClient();

const { voiceId, modelId, lines } = JSON.parse(fs.readFileSync(path.join(root, "src/narration.json"), "utf8"));
const dir = path.join(root, "narration");
fs.mkdirSync(dir, { recursive: true });
const manifestFile = path.join(dir, "manifest.json");
const before = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : [];

const after = [];
for (const [i, text] of lines.entries()) {
  const file = `step-${i + 1}.mp3`;
  const old = before[i];
  if (old && old.text === text && old.voiceId === voiceId && old.modelId === modelId && fs.existsSync(path.join(dir, file))) {
    after.push(old);
    console.log(`Step ${i + 1}: unchanged, ${old.seconds.toFixed(2)} s`);
    continue;
  }
  // With timestamps, the reply says when the last word ends: the line's length, no audio tools needed.
  let reply;
  try {
    reply = await client.textToSpeech.convertWithTimestamps(voiceId, {
      text,
      modelId,
      outputFormat: "mp3_44100_128",
      // The lines around it, so each step sounds like part of one read rather than eight.
      previousText: lines[i - 1],
      nextText: lines[i + 1],
    });
  } catch (error) {
    console.error(`ElevenLabs refused step ${i + 1}: ${error.message}`);
    process.exit(1);
  }
  const { audioBase64, alignment } = reply;
  fs.writeFileSync(path.join(dir, file), Buffer.from(audioBase64, "base64"));
  const seconds = alignment.characterEndTimesSeconds.at(-1);
  after.push({ file, text, voiceId, modelId, seconds });
  console.log(`Step ${i + 1}: ${seconds.toFixed(2)} s`);
}

fs.writeFileSync(manifestFile, JSON.stringify(after, null, 2) + "\n");
const ts = [
  "// Written by scripts/narrate.mjs (npm run narrate): one spoken line per step of the projects and",
  "// templates film, and how long each runs. Until it has run, the film is silent.",
  ...after.map((a, i) => `import step${i + 1} from "../narration/${a.file}";`),
  "",
  "export const VOICE: { src: string; seconds: number }[] = [",
  ...after.map((a, i) => `  { src: step${i + 1}, seconds: ${a.seconds} },`),
  "];",
  "",
];
fs.writeFileSync(path.join(root, "src/narration-audio.ts"), ts.join("\n"));
console.log("Wrote src/narration-audio.ts. Render with: npm run render:demo");
