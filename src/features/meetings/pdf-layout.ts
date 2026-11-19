// A PDF's words back into notes (Ika, 2026-11-19: "text formatting of uploaded documents is off").
// pdf.js gives pieces of text and where they sit; read line by line, a paragraph came out as many
// short broken lines and headings looked like any other line. Here the pieces become lines again,
// lines that wrap are joined into their paragraph, bigger text becomes a heading, a bullet keeps
// its words, and what repeats on every page (page numbers, a running header) is left out. The
// result is the Markdown parse.ts reads. Pure, so it's tested without a PDF (pdf-layout.test.ts).

/** A piece of text on a page: its words, where it starts (x, and y up from the bottom), its width and size. */
export type Piece = { str: string; x: number; y: number; w: number; size: number };

type Line = { text: string; x: number; end: number; y: number; size: number };

const BULLET = /^[•●▪■◦○‣∙·–-]\s*/;
const NUMBERED = /^\d{1,2}[.)]\s/;
// A new turn or label ("[00:01] …", "Thandi: …", "Budget: …") starts its own line.
const TURN = /^(\[?\d{1,2}:\d{2}|[^\s:][^:]{0,40}:\s)/;
const PAGE_NUMBER = /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i;

function lines(pieces: Piece[]): Line[] {
  const out: Line[] = [];
  for (const p of pieces) {
    if (!p.str) continue;
    const last = out.at(-1);
    if (last && Math.abs(last.y - p.y) < Math.max(last.size, p.size) * 0.5) {
      // Same line: a space where there's a gap and neither side has one.
      const gap = p.x - last.end;
      const spaced = gap > p.size * 0.15 && !/\s$/.test(last.text) && !/^\s/.test(p.str);
      last.text += (spaced ? " " : "") + p.str;
      last.end = Math.max(last.end, p.x + p.w);
      last.size = Math.max(last.size, p.size);
    } else out.push({ text: p.str, x: p.x, end: p.x + p.w, y: p.y, size: p.size });
  }
  return out.map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() })).filter((l) => l.text);
}

const shape = (text: string) => text.toLowerCase().replace(/\d+/g, "#");

/** The notes as Markdown, from each page's pieces in reading order. */
export function layoutToMarkdown(pages: Piece[][]): string {
  const all = pages.map(lines);
  // Running headers and footers: the same line (numbers aside) on most pages, and page numbers.
  const seen = new Map<string, number>();
  for (const page of all) for (const s of new Set(page.map((l) => shape(l.text)))) seen.set(s, (seen.get(s) ?? 0) + 1);
  const repeated = (l: Line) => all.length >= 2 && (seen.get(shape(l.text)) ?? 0) >= Math.max(2, Math.ceil(all.length * 0.6));
  const kept = all.map((page) => page.filter((l) => !PAGE_NUMBER.test(l.text) && !repeated(l)));

  // The body: the size most of the words are in, its line spacing and how far right lines reach.
  const weight = new Map<number, number>();
  for (const l of kept.flat()) weight.set(Math.round(l.size), (weight.get(Math.round(l.size)) ?? 0) + l.text.length);
  const body = [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10;
  const gaps = kept.flatMap((page) => page.slice(1).map((l, i) => page[i].y - l.y).filter((g) => g > 0 && g < body * 3)).sort((a, b) => a - b);
  const step = gaps[Math.floor(gaps.length * 0.25)] ?? body * 1.2;
  const right = Math.max(...kept.flat().map((l) => l.end), 0);
  const left = Math.min(...kept.flat().map((l) => l.x), Infinity);
  // Lists whose dots are drawn, not written (Chrome, Word): the items sit indented. The first
  // indent is a list item, a deeper one an item inside it.
  const indents = kept.flat().map((l) => l.x - left).filter((d) => d >= body * 1.2);
  const firstIndent = indents.length ? Math.min(...indents) : Infinity;

  const out: string[] = [];
  let open: { kind: "p" | "li"; x: number } | null = null;
  let pendingBullet = false;
  for (const page of kept) {
    let prev: Line | null = null;
    for (const l of page) {
      const gap = prev ? prev.y - l.y : Infinity;
      const after = prev ? prev.end : 0;
      prev = l;
      let text = l.text;
      // A bullet on its own, its words on the next line.
      if (/^[•●▪■◦○‣∙·]$/.test(text)) {
        pendingBullet = true;
        continue;
      }
      const heading = l.size >= body * 1.15 && text.length <= 120 && !BULLET.test(text);
      if (heading) {
        out.push("", `## ${text}`, "");
        open = null;
        pendingBullet = false;
        continue;
      }
      const glyph = pendingBullet || (BULLET.test(text) && !/^-\d/.test(text));
      pendingBullet = false;
      // Carrying on the line above: close below it, the line above reached the right edge, and
      // this one isn't a new item, number or speaker.
      const wrapped = !glyph && open && gap <= step * 1.35 && after >= right - body * 4 && !NUMBERED.test(text) && !TURN.test(text);
      if (wrapped && out.length) {
        const last = out.pop()!;
        out.push(/[a-z]-$/i.test(last) && /^[a-z]/.test(text) ? `${last.slice(0, -1)}${text}` : `${last} ${text}`);
        continue;
      }
      const indent = l.x - left;
      if (glyph || (indent >= firstIndent - 1 && !NUMBERED.test(text))) {
        text = text.replace(BULLET, "");
        const nested = indent > (glyph ? body * 1.5 : firstIndent + body) ? "  " : "";
        if (open?.kind !== "li" && out.at(-1)?.trim()) out.push("");
        out.push(`${nested}- ${text}`);
        open = { kind: "li", x: l.x };
        continue;
      }
      // A wider gap starts a new paragraph; otherwise it's the next line of the same block.
      if (gap > step * 1.35 || open?.kind === "li") out.push("");
      out.push(text);
      open = { kind: NUMBERED.test(text) ? "li" : "p", x: l.x };
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
