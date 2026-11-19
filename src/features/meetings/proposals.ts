import { z } from "zod";

// Suggested changes from a meeting's notes (docs/MEETINGS_SPEC.md, step 2): what Claude proposes,
// shared by the server (propose.ts) and the panel. Each one says where it lands, what it changes
// and the words in the notes it came from; nothing changes until an editor applies it.

/** Project details a meeting can change (the same columns Edit details and Details change). */
export const PROJECT_FIELDS = {
  client: "Client",
  agency: "Agency",
  logline: "Logline",
  shoot_start: "First shoot day",
  shoot_end: "Last shoot day",
  due_date: "Due",
} as const;
export type ProjectField = keyof typeof PROJECT_FIELDS;
export const DATE_FIELDS = new Set<ProjectField>(["shoot_start", "shoot_end", "due_date"]);

export type ProposalStatus = "proposed" | "applied" | "dismissed";

// One literal per kind, so TypeScript narrows on `kind`.
type Item = { title: string; dueOn: string | null };
export type Proposal = { id: string; quote: string; status: ProposalStatus } & (
  | ({ kind: "action" } & Item)
  | ({ kind: "milestone" } & Item)
  | { kind: "person"; name: string; role: string; email: string | null }
  | { kind: "project"; field: ProjectField; value: string; was: string }
);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = z
  .string()
  .regex(DAY)
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)))
  .nullable();

// What Claude answers (structured output: every field present, null when it doesn't apply).
export const CHANGE_KINDS = ["action", "milestone", "person", "project"] as const;
export const answerSchema = z.object({
  changes: z
    .array(
      z.object({
        kind: z.enum(CHANGE_KINDS),
        title: z.string().nullable(),
        due_on: z.string().nullable(),
        person_name: z.string().nullable(),
        person_role: z.string().nullable(),
        person_email: z.string().nullable(),
        field: z.enum(Object.keys(PROJECT_FIELDS) as [ProjectField, ...ProjectField[]]).nullable(),
        value: z.string().nullable(),
        quote: z.string(),
      }),
    )
    .max(40),
});
export type Answer = z.infer<typeof answerSchema>;

const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ anyOf: [{ type, ...extra }, { type: "null" }] });

/** The same shape as JSON Schema, for the API's structured output (all fields required). */
export const ANSWER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["changes"],
  properties: {
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "title", "due_on", "person_name", "person_role", "person_email", "field", "value", "quote"],
        properties: {
          kind: { type: "string", enum: [...CHANGE_KINDS], description: "action: something someone must do. milestone: a goal or a date that matters. person: someone joining the cast or crew. project: a new value for one project detail." },
          title: { ...nullable("string"), description: "action / milestone: short, starts with a verb for actions (\"Book the generator\"). Otherwise null." },
          due_on: { ...nullable("string"), description: "action / milestone: the date as YYYY-MM-DD when the notes give or clearly imply one, else null." },
          person_name: { ...nullable("string"), description: "person: their full name as written. Otherwise null." },
          person_role: { ...nullable("string"), description: "person: their role on this production (\"Director of photography\", \"Lead actor\"). Otherwise null." },
          person_email: { ...nullable("string"), description: "person: their email if the notes give it, else null." },
          field: { ...nullable("string", { enum: Object.keys(PROJECT_FIELDS) }), description: "project: which detail changes. Otherwise null." },
          value: { ...nullable("string"), description: "project: the new value; dates as YYYY-MM-DD. Otherwise null." },
          quote: { type: "string", description: "The exact words from the notes this comes from, at most 200 characters." },
        },
      },
    },
  },
} as const;

const clean = (s: string | null, max: number) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Claude's answer as proposals: anything incomplete or malformed is left out. */
export function toProposals(answer: Answer, current: Partial<Record<ProjectField, string | null>>): Proposal[] {
  const out: Proposal[] = [];
  let n = 0;
  const id = () => `p${Date.now().toString(36)}${(n++).toString(36)}`;
  for (const c of answer.changes) {
    const quote = clean(c.quote, 240);
    if (c.kind === "action" || c.kind === "milestone") {
      const title = clean(c.title, 300);
      if (!title) continue;
      out.push({ id: id(), kind: c.kind, title, dueOn: day.safeParse(c.due_on).success ? c.due_on : null, quote, status: "proposed" });
    } else if (c.kind === "person") {
      const name = clean(c.person_name, 120);
      if (!name) continue;
      const email = clean(c.person_email, 254);
      out.push({ id: id(), kind: "person", name, role: clean(c.person_role, 80) || "TBC", email: z.email().safeParse(email).success ? email : null, quote, status: "proposed" });
    } else if (c.field) {
      const value = clean(c.value, c.field === "logline" ? 300 : 200);
      if (!value || (DATE_FIELDS.has(c.field) && !day.safeParse(value).success)) continue;
      const was = current[c.field] ?? "";
      if (value === was) continue;
      out.push({ id: id(), kind: "project", field: c.field, value, was, quote, status: "proposed" });
    }
  }
  return out;
}

/** Proposals as saved on the meeting (null: not read yet). Unknown shapes are dropped. */
export function readProposals(value: unknown): Proposal[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((p): p is Proposal => !!p && typeof p === "object" && typeof (p as Proposal).id === "string" && CHANGE_KINDS.includes((p as Proposal).kind));
}
