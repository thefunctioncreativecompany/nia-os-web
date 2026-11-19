import { describe, expect, it } from "vitest";

import { clock, findDay, parseNotes, seconds } from "./parse";

describe("meeting notes", () => {
  it("reads a summary with headings and bullets (Granola, Gemini)", () => {
    const notes = parseNotes(
      ["# Recce: Maboneng rooftop", "", "Nov 18, 2026", "", "## Locations", "• Rooftop works for golden hour", "◦ Needs a permit", "", "## Next steps", "- Book the generator"].join("\n"),
      "recce.md",
    );
    expect(notes.title).toBe("Recce: Maboneng rooftop");
    expect(notes.heldOn).toBe("2026-11-18");
    expect(notes.summary).not.toContain("Nov 18, 2026");
    expect(notes.summary.startsWith("### Locations")).toBe(true);
    expect(notes.summary).toContain("- Rooftop works for golden hour");
    expect(notes.summary).toContain("  - Needs a permit");
    expect(notes.transcript).toEqual([]);
  });

  it("reads an Otter transcript (name, two spaces, time; words below)", () => {
    const notes = parseNotes(
      ["Speaker 1  0:03", "Morning everyone, call time is seven.", "", "Thandi  0:15", "I'll bring the 85mm.", "", "Speaker 1  1:02:03", "Great, that's a wrap."].join("\n"),
      "Production meeting_otter_ai.txt",
    );
    expect(notes.sourceApp).toBe("Otter");
    expect(notes.summary).toBe("");
    expect(notes.transcript).toEqual([
      { speaker: "Speaker 1", at: 3, text: "Morning everyone, call time is seven." },
      { speaker: "Thandi", at: 15, text: "I'll bring the 85mm." },
      { speaker: "Speaker 1", at: 3723, text: "Great, that's a wrap." },
    ]);
    expect(notes.attendees).toEqual(["Speaker 1", "Thandi"]);
  });

  it("splits a summary from the transcript under a Transcript heading", () => {
    const notes = parseNotes(["Client call", "", "- Deliver by Friday", "", "## Transcript", "[00:00:05] Ika: Hi Sam", "[00:00:09] Sam: Hi!", "[00:00:12] Ika: Friday works?"].join("\n"));
    expect(notes.title).toBe("Client call");
    expect(notes.summary).toBe("- Deliver by Friday");
    expect(notes.transcript.map((l) => l.speaker)).toEqual(["Ika", "Sam", "Ika"]);
    expect(notes.transcript[1].at).toBe(9);
  });

  it("reads Zoom and Teams subtitle files", () => {
    const vtt = ["WEBVTT", "", "1", "00:00:01.000 --> 00:00:04.000", "<v Lerato Mokoena>Can we move the shoot?</v>", "", "2", "00:00:04.500 --> 00:00:06.000", "<v Lerato Mokoena>To Saturday.</v>", "", "3", "00:00:07.000 --> 00:00:09.000", "Ika: Saturday works."].join("\n");
    const notes = parseNotes(vtt, "meeting.vtt");
    expect(notes.transcript).toEqual([
      { speaker: "Lerato Mokoena", at: 1, text: "Can we move the shoot? To Saturday." },
      { speaker: "Ika", at: 7, text: "Saturday works." },
    ]);
    const srt = parseNotes(["1", "00:00:02,000 --> 00:00:03,000", "Sam: Rolling.", "", "2", "00:00:04,000 --> 00:00:05,000", "Ika: Action."].join("\n"), "x.srt");
    expect(srt.transcript.map((l) => l.text)).toEqual(["Rolling.", "Action."]);
  });

  it("keeps a summary with label lines as a summary", () => {
    const notes = parseNotes(["Wardrobe fitting", "", "Note: bring the steamer", "Budget: R12 000", "Venue: Studio 4"].join("\n"));
    expect(notes.transcript).toEqual([]);
    expect(notes.summary).toContain("Budget: R12 000");
  });

  it("reads days and times", () => {
    expect(findDay("Tuesday, 18 November 2026")).toBe("2026-11-18");
    expect(findDay("2026-02-30")).toBeNull();
    expect(findDay("no date here")).toBeNull();
    expect(seconds("01:02")).toBe(62);
    expect(clock(3723)).toBe("1:02:03");
    expect(clock(83)).toBe("1:23");
  });
});
