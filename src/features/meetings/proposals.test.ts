import { describe, expect, it } from "vitest";

import { answerSchema, readProposals, toProposals, type Answer } from "./proposals";

const change = (c: Partial<Answer["changes"][number]>): Answer["changes"][number] => ({
  kind: "action",
  title: null,
  due_on: null,
  person_name: null,
  person_role: null,
  person_email: null,
  field: null,
  value: null,
  quote: "",
  ...c,
});

describe("suggested changes", () => {
  it("keeps complete suggestions and drops the rest", () => {
    const out = toProposals(
      {
        changes: [
          change({ kind: "action", title: "Book the generator", due_on: "2026-11-21", quote: "Sam books the generator by Friday" }),
          change({ kind: "milestone", title: "Picture lock", due_on: "next week" }),
          change({ kind: "action", title: "  " }),
          change({ kind: "person", person_name: "Thandi Nkosi", person_role: "Stylist", person_email: "not an email" }),
          change({ kind: "person", person_name: null, person_role: "Gaffer" }),
          change({ kind: "project", field: "shoot_start", value: "2026-11-22" }),
          change({ kind: "project", field: "shoot_end", value: "Saturday" }),
          change({ kind: "project", field: "client", value: "Nike" }),
        ],
      },
      { shoot_start: "2026-11-20", client: "Nike" },
    );
    expect(out.map((p) => p.kind)).toEqual(["action", "milestone", "person", "project"]);
    expect(out[0]).toMatchObject({ title: "Book the generator", dueOn: "2026-11-21", status: "proposed" });
    // A date that isn't a day is left off; the milestone stays.
    expect(out[1]).toMatchObject({ title: "Picture lock", dueOn: null });
    // A bad email is left off; the person stays.
    expect(out[2]).toMatchObject({ name: "Thandi Nkosi", role: "Stylist", email: null });
    // The client is already Nike: no change. The shoot start moves, and says what it was.
    expect(out[3]).toMatchObject({ field: "shoot_start", value: "2026-11-22", was: "2026-11-20" });
    expect(new Set(out.map((p) => p.id)).size).toBe(out.length);
  });

  it("checks Claude's answer and the saved shape", () => {
    expect(answerSchema.safeParse({ changes: [change({ kind: "action", title: "x" })] }).success).toBe(true);
    expect(answerSchema.safeParse({ changes: [{ kind: "delete everything" }] }).success).toBe(false);
    expect(readProposals(null)).toBeNull();
    expect(readProposals([{ id: "a", kind: "action", title: "x" }, { id: 1 }, "x"])).toHaveLength(1);
  });
});
