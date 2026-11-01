// A project's cast and crew directory (Milestone 4, step 1; Figma frame 18 "Cast & Crew / Directory
// Overview", 967:30543). Shapes and grouping only: people come from the people and cast_crew tables
// (data.ts) and are changed in mutations.ts.

import type { ProductionStatus } from "@/components/nia/status-badge";

export type Kind = "cast" | "crew";

export type DirectoryEntry = {
  /** The project role's id (cast_crew), or a stand-in for the samples. */
  id: string;
  /** The person's id in the workspace directory (people). */
  personId?: string;
  name: string;
  /** A Nia account's photo, or one they chose. */
  photo: string | null;
  kind: Kind;
  /** Crew only: "Camera & lighting". */
  department: string;
  /** "Director of Photography", or for cast their billing ("Lead"). */
  role: string;
  /** Cast only: who they play. */
  character: string | null;
  /** "All", or the episodes or days they're on ("Ep 1-5", "Ep 10"). */
  episodes: string[];
  status: ProductionStatus | null;
  email: string | null;
  phone: string | null;
  agent: string | null;
  union: string | null;
  bio: string | null;
  /** Mon to Sun this week: on set or not. */
  availability: boolean[] | null;
  notes: string | null;
};

/** Departments in the order a call sheet lists them. */
export const DEPARTMENTS = [
  "Direction",
  "Production",
  "Camera & lighting",
  "Art & set",
  "Wardrobe, hair & make-up",
  "Sound",
  "Post-production",
  "Other",
] as const;

const CAST_ROLES = /^(talent|model|actor|actress|cast|lead|supporting|featured|starring|performer|artist)$/i;
const DEPARTMENT_OF: [RegExp, (typeof DEPARTMENTS)[number]][] = [
  [/director$|assistant director|1st ad|2nd ad|script/i, "Direction"],
  [/producer|production manager|coordinator|client|casting|location/i, "Production"],
  [/photograph|camera|gaffer|grip|focus|dit|lighting|electric/i, "Camera & lighting"],
  [/design|art director|set|props|construction/i, "Art & set"],
  [/stylist|hair|make-up|makeup|wardrobe|costume|groom/i, "Wardrobe, hair & make-up"],
  [/sound|boom|mixer|composer|music/i, "Sound"],
  [/editor|colourist|colorist|vfx|post/i, "Post-production"],
];

export const departmentFor = (role: string) => DEPARTMENT_OF.find(([re]) => re.test(role))?.[1] ?? "Other";
export const isCastRole = (role: string) => CAST_ROLES.test(role.trim());

/** Crew grouped by department, in DEPARTMENTS order, empty ones left out. */
export function byDepartment(entries: DirectoryEntry[]) {
  return DEPARTMENTS.map((d) => ({ department: d, people: entries.filter((e) => e.kind === "crew" && e.department === d) })).filter((g) => g.people.length);
}

/** The sample production from Figma frame 18, for the development preview only (never a real project). */
export const SAMPLE: DirectoryEntry[] = (
  [
    ["Elena Vasquez", "cast", "", "Cast lead", "Dr. Elena Vasquez", ["10 / 10"], "confirmed", "elena.v@talentagency.com", "+1 (555) 019-2831", "CAA Management (Jack Larson)", "SAG-AFTRA eligible", "Elena Vasquez is an award-winning theatre and television actress. She joined the cast as lead scientific consultant Dr. Elena Vasquez.", [true, true, true, true, true, false, false], "Early make-up call on August 12 for the prosthetics scene. Wardrobe fitting approved on July 28."],
    ["Marcus Chen", "cast", "", "Lead", "Agent Marcus Chen", ["10 / 10"], "confirmed", "m.chen@talentagency.com", "+1 (555) 014-7702", null, "SAG-AFTRA", null, null, null],
    ["Sophia Ross", "cast", "", "Supporting", "The Informant", ["6 / 10"], "confirmed", "sophia@rossmgmt.com", null, null, null, null, null, null],
    ["David Miller", "cast", "", "Supporting", "Agent Sterling", ["8 / 10"], "pending", "dmiller@actors.net", null, null, null, null, null, null],
    ["Aaliyah Jackson", "cast", "", "Featured", "Mayor Cynthia Vance", ["4 / 10"], "confirmed", "aaliyah.j@talent.co", null, null, null, null, null, null],
    ["Tyler Jenkins", "cast", "", "Featured", "Leo (Undercover)", ["2 / 10"], "wrapped", "tyler@jenkinsmgmt.com", null, null, null, null, null, null],
    ["Emma Carter", "crew", "Direction", "Director", null, ["Ep 1-5", "Ep 10"], "confirmed", "e.carter@meridianpix.com", "+1 (555) 010-4411", null, "DGA", null, null, null],
    ["James Liu", "crew", "Direction", "1st AD", null, ["All episodes"], "confirmed", "james.liu@indiedga.com", null, null, null, null, null, null],
    ["Amara Oke", "crew", "Direction", "2nd AD", null, ["All episodes"], "confirmed", "amara.o@dga-register.org", null, null, null, null, null, null],
    ["Robert Deakins", "crew", "Camera & lighting", "Director of Photography", null, ["All episodes"], "confirmed", "r.deakins@asc-camera.com", null, null, null, null, null, null],
    ["Siddharth Mehta", "crew", "Camera & lighting", "Camera Operator", null, ["Ep 1-6"], "confirmed", "sid.camera@soc-ops.org", null, null, null, null, null, null],
    ["Chloe Dupont", "crew", "Camera & lighting", "Steadicam Operator", null, ["Ep 3", "Ep 7", "Ep 10"], "pending", "chloe.dupont@steady-glide.com", null, null, null, null, null, null],
    ["Marcus Webb", "crew", "Production", "Line Producer", null, ["All episodes"], "confirmed", "mwebb@meridianpix.com", null, null, null, null, null, null],
    ["Diana Okafor", "crew", "Production", "Production Manager", null, ["All episodes"], "confirmed", "d.okafor@meridianpix.com", null, null, null, null, null, null],
    ["Niels Sorenson", "crew", "Art & set", "Production Designer", null, ["All episodes"], "confirmed", "niels.design@artdirectors.org", null, null, null, null, null, null],
    ["Yuki Tanaka", "crew", "Art & set", "Art Director", null, ["All episodes"], "confirmed", "yuki.t@artdirectors.org", null, null, null, null, null, null],
  ] as const
).map(([name, kind, department, role, character, episodes, status, email, phone, agent, union, bio, availability, notes], i) => ({
  id: `sample-${i}`,
  name,
  photo: null,
  kind,
  department: department || "Other",
  role,
  character,
  episodes: [...episodes],
  status,
  email,
  phone,
  agent,
  union,
  bio,
  availability: availability ? [...availability] : null,
  notes,
}));
