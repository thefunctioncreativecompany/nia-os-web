import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { RichText, parseBlocks, plainText } from "./rich-text";

const html = (md: string) => renderToStaticMarkup(<RichText value={md} />);

describe("formatted text", () => {
  it("reads plain text as before: paragraphs and line breaks", () => {
    expect(html("Call is at 7am.\nBring water.\n\nParking behind the studio.")).toContain("<p>Call is at 7am.<br/>Bring water.</p><p>Parking behind the studio.</p>");
  });

  it("shows bold, italic and links, and only safe links", () => {
    const out = html("**Wrap** by *six*, see [the map](https://maps.example.com) or [this](javascript:alert(1))");
    expect(out).toContain("<strong>Wrap</strong>");
    expect(out).toContain("<em>six</em>");
    expect(out).toContain('href="https://maps.example.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).not.toContain("javascript:");
  });

  it("never turns the text into HTML", () => {
    expect(html("<img src=x onerror=alert(1)>")).toContain("&lt;img");
  });

  it("makes bullet and numbered lists, nested by two spaces", () => {
    const blocks = parseBlocks("- Camera\n  - 85mm\n  - 35mm\n- Sound\n\n1. Rehearse\n2. Shoot");
    expect(blocks).toMatchObject([
      { kind: "ul", items: [{ text: "Camera", children: [{ kind: "ul", items: [{ text: "85mm" }, { text: "35mm" }] }] }, { text: "Sound" }] },
      { kind: "ol", start: 1, items: [{ text: "Rehearse" }, { text: "Shoot" }] },
    ]);
    expect(html("1. Rehearse\n2. Shoot")).toContain('<ol class="flex flex-col gap-1 pl-5 list-decimal">');
  });

  it("keeps escaped marks as written", () => {
    expect(html("5 \\* 3 \\_ok\\_")).toContain("5 * 3 _ok_");
  });

  it("gives the words without the marks", () => {
    expect(plainText("**Call** is *7am*\n\n- Bring the [85mm](https://x.co)\n- Parking")).toBe("Call is 7am · Bring the 85mm · Parking");
    expect(plainText("Plain, as before.")).toBe("Plain, as before.");
  });
});
