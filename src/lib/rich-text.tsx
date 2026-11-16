import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Formatted text (Ika, 2026-11-15: "text formatting features (ie bold, italics, bulleting,
// numbering, … add link)"): long text is stored as Markdown, the small part of it the editor makes
// (rich-text-editor.tsx): paragraphs, **bold**, *italic*, "- " bullets, "1. " numbers (nested by
// two spaces) and [links](https://…). Text written before is plain and reads the same.
// Shown here as React elements, never as HTML from the text, so nothing in it can run; links go
// only to http(s) and mailto addresses.

type Item = { text: string; children: Block[] };
type Block = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; start: number; items: Item[] };

const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const NUMBER = /^(\s*)(\d+)[.)]\s+(.*)$/;
const indentOf = (line: string) => line.match(/^\s*/)![0].replace(/\t/g, "  ").length;

/** The text's blocks: paragraphs (blank lines between) and lists. */
export function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  return parseLines(lines, 0, lines.length, 0);
}

function parseLines(lines: string[], from: number, to: number, base: number): Block[] {
  const blocks: Block[] = [];
  let i = from;
  while (i < to) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const bullet = line.match(BULLET);
    const number = line.match(NUMBER);
    if (bullet || number) {
      const kind = bullet ? "ul" : "ol";
      const list: Block = { kind, start: number ? Number(number[2]) : 1, items: [] };
      const level = indentOf(line);
      while (i < to) {
        const l = lines[i];
        const b = l.match(BULLET);
        const n = l.match(NUMBER);
        if (!l.trim()) {
          // A blank line inside a list ends it unless the list carries on after it.
          const next = lines.slice(i + 1, to).find((x) => x.trim());
          if (next && (next.match(kind === "ul" ? BULLET : NUMBER) || indentOf(next) > level) && indentOf(next) >= level) {
            i++;
            continue;
          }
          break;
        }
        const indent = indentOf(l);
        if (indent < level) break;
        if (indent === level && ((kind === "ul" && b) || (kind === "ol" && n))) {
          list.items.push({ text: (b ? b[2] : n![3]).trim(), children: [] });
          i++;
          continue;
        }
        if (indent > level && list.items.length) {
          // Lines indented under an item: its own nested list or text.
          let end = i;
          while (end < to && (!lines[end].trim() || indentOf(lines[end]) > level)) end++;
          list.items.at(-1)!.children.push(...parseLines(lines, i, end, indent));
          i = end;
          continue;
        }
        break;
      }
      blocks.push(list);
      continue;
    }
    // A paragraph: lines until a blank line or a list.
    const para: string[] = [];
    while (i < to && lines[i].trim() && !BULLET.test(lines[i]) && !NUMBER.test(lines[i])) {
      para.push(lines[i].replace(/\s+$/, "").replace(/\\$/, "").trim());
      i++;
    }
    if (para.length) blocks.push({ kind: "p", lines: para });
    else i++;
  }
  void base;
  return blocks;
}

const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

/** Inline marks: **bold**, *italic* / _italic_, [text](url), and \-escaped characters. */
export function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let buffer = "";
  let n = 0;
  const flush = () => {
    if (buffer) out.push(buffer);
    buffer = "";
  };
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "\\" && i + 1 < text.length && /[\\`*_{}[\]()#+\-.!>~|]/.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }
    if (c === "*" && text[i + 1] === "*") {
      const end = findClose(text, i + 2, "**");
      if (end > i + 2) {
        flush();
        out.push(<strong key={`${key}-${n++}`}>{inline(text.slice(i + 2, end), `${key}-${n}`)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if ((c === "*" || c === "_") && text[i + 1] !== c && text[i + 1] !== " ") {
      const end = findClose(text, i + 1, c);
      if (end > i + 1 && text[end - 1] !== " ") {
        flush();
        out.push(<em key={`${key}-${n++}`}>{inline(text.slice(i + 1, end), `${key}-${n}`)}</em>);
        i = end + 1;
        continue;
      }
    }
    if (c === "[") {
      const close = findClose(text, i + 1, "]");
      if (close > i && text[close + 1] === "(") {
        const paren = text.indexOf(")", close + 2);
        const href = paren > 0 ? text.slice(close + 2, paren).trim() : "";
        // A link to anywhere but a web or email address shows its words only.
        if (paren > 0 && !SAFE_LINK.test(href)) {
          flush();
          out.push(<Fragment key={`${key}-${n++}`}>{inline(text.slice(i + 1, close), `${key}-${n}`)}</Fragment>);
          i = paren + 1;
          continue;
        }
        if (paren > 0) {
          flush();
          out.push(
            <a key={`${key}-${n++}`} href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-foreground underline underline-offset-2 hover:text-nia-blue">
              {inline(text.slice(i + 1, close), `${key}-${n}`)}
            </a>,
          );
          i = paren + 1;
          continue;
        }
      }
    }
    buffer += c;
    i++;
  }
  flush();
  return out;
}

// The closing mark, skipping \-escaped characters.
function findClose(text: string, from: number, mark: string) {
  for (let i = from; i <= text.length - mark.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text.startsWith(mark, i)) return i;
  }
  return -1;
}

function renderBlocks(blocks: Block[], key: string): ReactNode {
  return blocks.map((b, i) => {
    const k = `${key}-${i}`;
    if (b.kind === "p")
      return (
        <p key={k}>
          {b.lines.map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(line, `${k}-${j}`)}
            </Fragment>
          ))}
        </p>
      );
    const List = b.kind;
    return (
      <List key={k} start={b.kind === "ol" && b.start !== 1 ? b.start : undefined} className={cn("flex flex-col gap-1 pl-5", b.kind === "ul" ? "list-disc" : "list-decimal")}>
        {b.items.map((item, j) => (
          <li key={j} className="pl-0.5">
            {inline(item.text, `${k}-${j}`)}
            {item.children.length > 0 && <div className="mt-1 flex flex-col gap-1">{renderBlocks(item.children, `${k}-${j}`)}</div>}
          </li>
        ))}
      </List>
    );
  });
}

/** Formatted text, read-only. Empty text shows nothing. */
export function RichText({ value, className }: { value: string; className?: string }) {
  if (!value.trim()) return null;
  return <div className={cn("flex flex-col gap-2 [overflow-wrap:anywhere]", className)}>{renderBlocks(parseBlocks(value), "rt")}</div>;
}

/** The words without the marks, for previews, counts and search ("Call is 7am · Bring the 85mm"). */
export function plainText(value: string) {
  const words = (s: string) =>
    s
      .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|[^\w*])[*_](?!\s)(.+?)(?<!\s)[*_](?=[^\w*]|$)/g, "$1$2")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  const flat = (blocks: Block[]): string[] =>
    blocks.flatMap((b) => (b.kind === "p" ? [b.lines.map(words).join(" ")] : b.items.flatMap((item) => [words(item.text), ...flat(item.children)])));
  return flat(parseBlocks(value)).join(" · ");
}
