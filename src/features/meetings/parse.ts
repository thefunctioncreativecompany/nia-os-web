// Reading meeting notes from any notetaker (docs/MEETINGS_SPEC.md, step 1). The words of an
// export (Otter, Fireflies, Granola, Gemini, Zoom, Teams) or pasted text become a title, a day,
// a summary in the Markdown the project's text editor writes (rich-text.tsx: paragraphs, bold,
// italic, lists, links) and a transcript (who said what, and when). Best guesses: everything is
// shown in the form before it's saved, and the summary stays editable.

export type TranscriptLine = { speaker: string; at: number | null; text: string };

export type ParsedNotes = {
  title: string;
  /** "2026-11-18", or null when the notes don't say. */
  heldOn: string | null;
  summary: string;
  transcript: TranscriptLine[];
  /** The notetaker, as shown ("Otter"), or null. */
  sourceApp: string | null;
  /** The speakers, in the order they first spoke. */
  attendees: string[];
};

/** The notetakers the form offers (step 1). */
export const SOURCE_APPS = ["Otter", "Fireflies", "Granola", "Gemini", "Zoom", "Teams", "Fathom", "tl;dv"] as const;

// Names as whole words; "_" counts as a gap, as in "meeting_otter_ai.txt".
const word = (name: string) => new RegExp(`(?<![a-z])${name}(?![a-z])`, "i");
const SOURCE_HINTS: [RegExp, string][] = [
  [word("otter"), "Otter"],
  [word("fireflies"), "Fireflies"],
  [word("granola"), "Granola"],
  [word("gemini"), "Gemini"],
  [word("fathom"), "Fathom"],
  [word("tl;?dv"), "tl;dv"],
  [/microsoft teams/i, "Teams"],
  [word("zoom"), "Zoom"],
];

const TIME = String.raw`(\d{1,2}:\d{2}(?::\d{2})?)`;
// "[00:01:23] Thandi: Morning all" or "00:01 Thandi: Morning all"
const TIME_NAME_TEXT = new RegExp(String.raw`^\[?${TIME}\]?\s*[-–]?\s*([^:\n]{1,60}?):\s+(.+)$`);
// "Thandi (00:01:23): Morning all", "Thandi [0:03]" (words on the lines after)
const NAME_TIME = new RegExp(String.raw`^([^:\[\]()\n]{1,60}?)\s*[(\[]${TIME}[)\]]\s*:?\s*(.*)$`);
// Otter: "Speaker 1  0:03" (two spaces), words on the lines after
const NAME_GAP_TIME = new RegExp(String.raw`^(\S.{0,59}?)\s{2,}${TIME}\s*$`);
// "Thandi: Morning all", "Me: …", "Them: …" (a short name, no time)
const NAME_TEXT = /^([A-Z][\w.'’-]*(?: [A-Z][\w.'’-]*){0,3}|Me|Them|Speaker \d+):\s+(.+)$/;
const TRANSCRIPT_HEADING = /^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:full |meeting )?transcript(?:\*\*)?:?\s*$/im;

/** "1:02:03" or "02:03" → seconds. */
export function seconds(time: string) {
  const parts = time.split(/[:.,]/).slice(0, 3).map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

/** 83 → "1:23", 3723 → "1:02:03". */
export function clock(at: number) {
  const h = Math.floor(at / 3600);
  const m = Math.floor((at % 3600) / 60);
  const s = Math.floor(at % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const clean = (text: string) =>
  text
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ");

/** Everything the form needs from a file's words (or pasted text). */
export function parseNotes(raw: string, fileName = ""): ParsedNotes {
  const text = clean(raw);
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  let summaryText = "";
  let transcript: TranscriptLine[] = [];

  if (ext === "vtt" || /^WEBVTT/.test(text.trimStart())) transcript = parseCues(text);
  else if (ext === "srt" || /^\d+\n\d{2}:\d{2}:\d{2},\d{3}\s*-->/.test(text.trimStart())) transcript = parseCues(text);
  else {
    const heading = text.match(TRANSCRIPT_HEADING);
    if (heading?.index !== undefined) {
      summaryText = text.slice(0, heading.index);
      transcript = parseTranscript(text.slice(heading.index + heading[0].length)).lines;
    } else {
      const read = parseTranscript(text);
      if (read.isTranscript) transcript = read.lines;
      else summaryText = text;
    }
  }

  const { title, summary: written } = toSummary(summaryText);
  // A line that only gives the day (it becomes the meeting's date) leaves the summary.
  const summary = written
    .split("\n")
    .filter((line, i, all) => !(i < 3 && line.trim().length <= 40 && findDay(line) && all.slice(0, i).every((l) => !l.trim() || findDay(l))))
    .join("\n")
    .trim();
  const attendees = [...new Set(transcript.map((l) => l.speaker).filter(Boolean))].slice(0, 30);
  const hint = `${fileName}\n${text.slice(0, 3000)}`;
  return {
    title: title || titleFromFile(fileName) || "Meeting notes",
    heldOn: findDay(`${fileName}\n${text.split("\n").slice(0, 12).join("\n")}`),
    summary,
    transcript,
    sourceApp: SOURCE_HINTS.find(([re]) => re.test(hint))?.[1] ?? null,
    attendees,
  };
}

// Subtitle files (Zoom and Teams .vtt, .srt): numbered cues with a time and the words; the
// speaker as <v Name> or "Name: ". Back-to-back cues from the same speaker are joined.
function parseCues(text: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const rows = block.split("\n").map((r) => r.trim()).filter(Boolean);
    const timeRow = rows.findIndex((r) => r.includes("-->"));
    if (timeRow < 0) continue;
    const at = seconds(rows[timeRow].split("-->")[0].trim());
    let words = rows.slice(timeRow + 1).join(" ");
    let speaker = "";
    const voice = words.match(/<v(?:\.[^ >]+)?\s+([^>]+)>/);
    if (voice) speaker = voice[1].trim();
    words = words.replace(/<[^>]+>/g, "").trim();
    const named = !speaker && words.match(/^([^:]{1,60}):\s+(.+)$/);
    if (named) [speaker, words] = [named[1].trim(), named[2]];
    if (!words) continue;
    const last = lines.at(-1);
    if (last && last.speaker === speaker) last.text = `${last.text} ${words}`;
    else lines.push({ speaker, at, text: words });
  }
  return lines;
}

// Plain-text transcripts: a line starts each turn (with a name, a time or both); lines after it
// carry on that turn. It's a transcript when most lines are turns or their words.
function parseTranscript(text: string): { lines: TranscriptLine[]; isTranscript: boolean } {
  const lines: TranscriptLine[] = [];
  let turnLines = 0;
  let wordLines = 0;
  let timed = 0;
  const rows = text.split("\n").map((r) => r.trim());
  const filled = rows.filter(Boolean).length;
  for (const row of rows) {
    if (!row) continue;
    let m: RegExpMatchArray | null;
    let turn: TranscriptLine | null = null;
    if ((m = row.match(TIME_NAME_TEXT))) turn = { speaker: m[2].trim(), at: seconds(m[1]), text: m[3].trim() };
    else if ((m = row.match(NAME_TIME))) turn = { speaker: m[1].trim(), at: seconds(m[2]), text: m[3].trim() };
    else if ((m = row.match(NAME_GAP_TIME))) turn = { speaker: m[1].trim(), at: seconds(m[2]), text: "" };
    else if ((m = row.match(NAME_TEXT))) turn = { speaker: m[1].trim(), at: null, text: m[2].trim() };
    if (turn) {
      turnLines++;
      if (turn.at !== null) timed++;
      lines.push(turn);
    } else if (lines.length) {
      const last = lines.at(-1)!;
      last.text = last.text ? `${last.text} ${row}` : row;
      wordLines++;
    }
  }
  const kept = lines.filter((l) => l.text);
  // Timed turns are clear on their own; untimed "Name: words" lines must be nearly every line, and
  // more than one person must speak (a summary's "Note: …" and "Budget: …" lines aren't a conversation: people speak more than once).
  const speakers = new Set(kept.map((l) => l.speaker)).size;
  const isTranscript =
    kept.length >= 3 && filled > 0 && (timed >= 3 ? (turnLines + wordLines) / filled >= 0.6 : turnLines / filled >= 0.7 && speakers >= 2 && kept.length >= speakers * 1.5);
  return { lines: kept, isTranscript };
}

// Section names notetakers write as a plain line ("Action items", "Next steps:"): read as headings.
const SECTION =
  /^(summary|overview|outline|details|notes|agenda|attendees|participants|decisions?|key (points|takeaways|decisions)|takeaways|highlights|topics|chapters|keywords|questions|(suggested )?next steps|action items|actions|to-?dos?|follow[- ]?ups?|tasks)$/i;

// The summary in the editor's Markdown: the first heading becomes the title, other headings
// sections ("### "), bullets from Word, PDFs and notetakers ("•", "◦", "–") the editor's "- ",
// and to-do boxes ("[ ]", "☐") plain points (they're sent to milestones from the panel).
function toSummary(text: string): { title: string; summary: string } {
  let title = "";
  const out: string[] = [];
  const rows = text.split("\n");
  rows.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    const marked = line.match(/^\s*#{1,6}\s+(.+?)\s*#*$/)?.[1];
    const words = (marked ?? line).trim().replace(/^(\*\*|__)(.+)\1:?$/, "$2").replace(/:$/, "").trim();
    // A heading: marked with "#", a whole line in bold, or a section's name on its own line.
    const bold = /^(\*\*|__)[^*_]+\1:?$/.test(line.trim()) && line.trim().length <= 90;
    const nextFilled = rows.slice(i + 1).find((r) => r.trim()) ?? "";
    if (marked || (bold && nextFilled) || (SECTION.test(words) && !/^\s*[-*•]/.test(line))) {
      if (!title && !out.some((l) => l.trim()) && marked) title = words;
      else out.push("", `### ${words}`, "");
      return;
    }
    const bullet = line.match(/^(\s*)(?:[•●▪■◦○–·]|[-*](?=\s))\s*(?:\[[ xX]?\]\s*|[☐☑✓]\s*)?(.*)$/);
    if (bullet) {
      const nested = bullet[1].length > 0 || /^[◦○]/.test(line.trim());
      out.push(`${nested ? "  " : ""}- ${bullet[2]}`);
      return;
    }
    const box = line.match(/^\s*(?:\[[ xX]?\]|[☐☑])\s+(.*)$/);
    if (box) {
      out.push(`- ${box[1]}`);
      return;
    }
    out.push(line);
  });
  let summary = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // No heading: a short first line that isn't a list item or a section reads as the title.
  if (!title) {
    const [first, ...rest] = summary.split("\n");
    const plain = first?.replace(/^\*\*(.+)\*\*$/, "$1").trim() ?? "";
    if (plain && plain.length <= 80 && !/^[-*\d#]/.test(plain) && rest.join("").trim()) {
      title = plain;
      summary = rest.join("\n").trim();
    }
  }
  return { title: title.slice(0, 200), summary };
}

function titleFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
  return base.slice(0, 200);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const valid = (y: number, m: number, d: number) => {
  const date = new Date(y, m - 1, d);
  return y >= 2000 && y <= 2100 && date.getMonth() === m - 1 && date.getDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
};

/** The first date in the text, as "2026-11-18": 2026-11-18, Nov 18, 2026, 18 November 2026. */
export function findDay(text: string): string | null {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return valid(+iso[1], +iso[2], +iso[3]);
  const monthFirst = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
  if (monthFirst) return valid(+monthFirst[3], MONTHS.indexOf(monthFirst[1].toLowerCase()) + 1, +monthFirst[2]);
  const dayFirst = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/i);
  if (dayFirst) return valid(+dayFirst[3], MONTHS.indexOf(dayFirst[2].toLowerCase()) + 1, +dayFirst[1]);
  return null;
}
