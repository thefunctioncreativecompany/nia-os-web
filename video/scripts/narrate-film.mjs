// Speaks one demo film's lines (src/films/<id>.json) with ElevenLabs: one file per scene in
// narration/<id>/, and src/films/<id>-voice.ts so the film times each scene to its line. Lines
// that haven't changed since the last run aren't sent again.
//
// Needs ELEVENLABS_API_KEY in the web app's .env.local (never in code or chat).
// Run from video/: node scripts/narrate-film.mjs explore
import fs from "node:fs";
import path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/narrate-film.mjs <film id>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const envFile = path.resolve(root, "../.env.local");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("No ELEVENLABS_API_KEY in the web app's .env.local.");
  process.exit(1);
}
const client = new ElevenLabsClient();

// The voice and model of the first product film, so the films sound like one series.
const { voiceId, modelId } = JSON.parse(fs.readFileSync(path.join(root, "src/narration.json"), "utf8"));
const film = JSON.parse(fs.readFileSync(path.join(root, `src/films/${id}.json`), "utf8"));
const lines = film.scenes.map((s) => s.line);
const dir = path.join(root, "narration", id);
fs.mkdirSync(dir, { recursive: true });
const manifestFile = path.join(dir, "manifest.json");
const before = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : [];

const after = [];
for (const [i, text] of lines.entries()) {
  const file = `scene-${i + 1}.mp3`;
  const old = before[i];
  if (old && old.text === text && old.voiceId === voiceId && old.modelId === modelId && fs.existsSync(path.join(dir, file))) {
    after.push(old);
    console.log(`Scene ${i + 1}: unchanged, ${old.seconds.toFixed(2)} s`);
    continue;
  }
  let reply;
  try {
    reply = await client.textToSpeech.convertWithTimestamps(voiceId, {
      text,
      modelId,
      outputFormat: "mp3_44100_128",
      previousText: lines[i - 1],
      nextText: lines[i + 1],
    });
  } catch (error) {
    console.error(`ElevenLabs refused scene ${i + 1}: ${error.message}`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, file), Buffer.from(reply.audioBase64, "base64"));
  const seconds = reply.alignment.characterEndTimesSeconds.at(-1);
  after.push({ file, text, voiceId, modelId, seconds });
  console.log(`Scene ${i + 1}: ${seconds.toFixed(2)} s`);
}
fs.writeFileSync(manifestFile, JSON.stringify(after, null, 2) + "\n");

const ts = [
  `// Written by scripts/narrate-film.mjs: the ${id} film's spoken line per scene, and how long each runs.`,
  ...after.map((a, i) => `import scene${i + 1} from "../../narration/${id}/${a.file}";`),
  "",
  "export const VOICE: { src: string; seconds: number }[] = [",
  ...after.map((a, i) => `  { src: scene${i + 1}, seconds: ${+a.seconds.toFixed(2)} },`),
  "];",
  "",
].join("\n");
fs.writeFileSync(path.join(root, `src/films/${id}-voice.ts`), ts);
console.log(`Wrote src/films/${id}-voice.ts`);
