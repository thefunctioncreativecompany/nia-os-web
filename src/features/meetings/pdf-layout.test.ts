import { describe, expect, it } from "vitest";

import { layoutToMarkdown, type Piece } from "./pdf-layout";
import { parseNotes } from "./parse";
import { actionItems, dueIn } from "./points";

// A page written line by line: [text, x, size], 14 points apart (more for a blank line).
function page(rows: ([string, number?, number?] | null)[], footer?: string): Piece[] {
  let y = 800;
  const out: Piece[] = [];
  for (const row of rows) {
    if (!row) {
      y -= 14;
      continue;
    }
    const [str, x = 50, size = 10] = row;
    out.push({ str, x, y, w: str.length * size * 0.5, size });
    y -= size >= 14 ? 22 : 14;
  }
  if (footer) out.push({ str: footer, x: 280, y: 30, w: 30, size: 8 });
  return out;
}

// A full-width line reaches ~x 500 (50 + 90 characters × 5).
const long = (start: string) => (start + " " + "words ".repeat(20)).slice(0, 90);

describe("PDF notes laid out again", () => {
  it("joins wrapped lines, keeps headings and bullets, drops page numbers", () => {
    const md = layoutToMarkdown([
      page(
        [
          ["Wardrobe fitting", 50, 18],
          ["Nov 20, 2026"],
          null,
          ["Summary", 50, 13],
          [long("The team agreed")],
          ["on the final look."],
          null,
          ["Next steps", 50, 13],
          ["•", 50],
          ["Thandi books the tailor by Friday", 62],
          ["• Steam everything the night before"],
        ],
        "1",
      ),
      page([["• Confirm the 85mm with the rental house"]], "2"),
    ]);
    expect(md).toContain("## Wardrobe fitting");
    expect(md).toContain(`${long("The team agreed")} on the final look.`);
    expect(md).toContain("## Next steps");
    expect(md).toContain("- Thandi books the tailor by Friday");
    expect(md).toContain("- Steam everything the night before");
    expect(md).toContain("- Confirm the 85mm with the rental house");
    expect(md).not.toMatch(/^\d$/m);

    const notes = parseNotes(md, "fitting.pdf");
    expect(notes.title).toBe("Wardrobe fitting");
    expect(notes.heldOn).toBe("2026-11-20");
    expect(notes.summary).toContain("### Next steps");
    expect(actionItems(notes.summary, new Date(2026, 10, 18)).map((a) => a.title)).toEqual([
      "Thandi books the tailor by Friday",
      "Steam everything the night before",
      "Confirm the 85mm with the rental house",
    ]);
  });

  it("keeps short lines (labels, speakers) on their own lines", () => {
    const md = layoutToMarkdown([page([["Location: Maboneng rooftop"], ["Call time: 6am"], ["Thandi: we need a permit"]])]);
    expect(md.split("\n")).toEqual(["Location: Maboneng rooftop", "Call time: 6am", "Thandi: we need a permit"]);
  });
});

describe("action items", () => {
  const today = new Date(2026, 10, 18); // Wednesday 18 Nov 2026

  it("finds the points under action headings, with their days", () => {
    const summary = ["### Decisions", "- Shoot moves to Saturday", "", "### Action items", "- **Lerato** books the rooftop by Nov 22", "- Send the call sheet tomorrow", "", "### Notes", "- Bring snacks"].join("\n");
    expect(actionItems(summary, today)).toEqual([
      { title: "Lerato books the rooftop by Nov 22", dueOn: "2026-11-22" },
      { title: "Send the call sheet tomorrow", dueOn: "2026-11-19" },
    ]);
  });

  it("reads the day a point mentions", () => {
    expect(dueIn("by Friday", today)).toBe("2026-11-20");
    expect(dueIn("on Wednesday", today)).toBe("2026-11-25");
    expect(dueIn("3 Jan", today)).toBe("2027-01-03");
    expect(dueIn("Dec 1, 2026", today)).toBe("2026-12-01");
    expect(dueIn("Book the generator", today)).toBeNull();
  });

  it("reads plain-text section names and to-do boxes as sections and points (Otter, Gemini)", () => {
    const notes = parseNotes(["Production meeting", "", "Suggested next steps", "[ ] Thandi will send the budget", "☐ Sam to scout the warehouse"].join("\n"), "notes.txt");
    expect(notes.summary).toBe(["### Suggested next steps", "", "- Thandi will send the budget", "- Sam to scout the warehouse"].join("\n"));
    expect(actionItems(notes.summary, today)).toHaveLength(2);
  });
});
