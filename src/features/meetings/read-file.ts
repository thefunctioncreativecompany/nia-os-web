// The words of a meeting-notes file, in the browser (docs/MEETINGS_SPEC.md, step 1): text,
// Markdown and subtitles as they are, Word through mammoth (its headings, lists, bold and links
// kept as Markdown), PDFs through pdf.js. The file itself isn't uploaded; parse.ts reads the words.

export const NOTES_ACCEPT = ".txt,.md,.markdown,.docx,.pdf,.vtt,.srt";
export const NOTES_MAX_BYTES = 10 * 1024 * 1024;

const TEXT = new Set(["txt", "md", "markdown", "vtt", "srt"]);

export async function readNotesFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (file.size > NOTES_MAX_BYTES) throw new Error("That file is over 10 MB. Export the notes as text, or paste them instead.");
  if (TEXT.has(ext)) return file.text();
  if (ext === "docx") {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      // Pictures in the notes are left out (only the words come in).
      { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: "" })) },
    );
    return htmlToMarkdown(value);
  }
  if (ext === "pdf") {
    const { pdfText } = await import("@/lib/pdf-preview");
    return pdfText(file);
  }
  throw new Error("Nia reads .txt, .md, .docx, .pdf, .vtt and .srt notes. Export them in one of those, or paste them.");
}

// Word's HTML as the Markdown the notes reader expects: headings "#", lists "- " and "1. "
// (nested two spaces), **bold**, *italic*, [links](…). Read with the browser's own parser,
// never put on the page.
function htmlToMarkdown(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof Element)) return "";
    const inner = Array.from(node.childNodes).map(inline).join("");
    const tag = node.tagName.toLowerCase();
    if (!inner.trim()) return tag === "br" ? "\n" : inner;
    if (tag === "strong" || tag === "b") return `**${inner.trim()}**`;
    if (tag === "em" || tag === "i") return `*${inner.trim()}*`;
    if (tag === "a" && /^(https?:|mailto:)/i.test(node.getAttribute("href") ?? "")) return `[${inner.trim()}](${node.getAttribute("href")})`;
    return inner;
  };
  const lines: string[] = [];
  const block = (el: Element, depth: number) => {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) lines.push("", `${"#".repeat(Number(tag[1]))} ${inline(el).trim()}`, "");
    else if (tag === "ul" || tag === "ol") {
      let n = 1;
      for (const li of Array.from(el.children)) {
        const own = Array.from(li.childNodes).filter((c) => !(c instanceof Element && /^(ul|ol)$/i.test(c.tagName)));
        lines.push(`${"  ".repeat(depth)}${tag === "ol" ? `${n++}.` : "-"} ${own.map(inline).join("").trim()}`);
        for (const sub of Array.from(li.children).filter((c) => /^(ul|ol)$/i.test(c.tagName))) block(sub, depth + 1);
      }
      if (!depth) lines.push("");
    } else if (tag === "p") lines.push(inline(el).trim(), "");
    else if (tag === "table") for (const row of Array.from(el.querySelectorAll("tr"))) lines.push(Array.from(row.children).map((c) => inline(c).trim()).join(" · "));
    else for (const child of Array.from(el.children)) block(child, depth);
  };
  for (const el of Array.from(doc.body.children)) block(el, 0);
  return lines.join("\n");
}
