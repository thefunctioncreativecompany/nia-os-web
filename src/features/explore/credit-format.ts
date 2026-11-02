// One standard for Cast & Crew on Explore (Ika, 2026-11-01), whatever the source: Wikidata's
// roles for films and series, and the free-form roles in creators' captions ("DOP", "Hair and
// make-up", "Director, editor and colourist"). Every role gets a standard name and department,
// and every person a rank, so each row leads with the same top credits: director or creator, the
// lead cast, writer, producers, director of photography, editor, music, design, styling. The top
// 10 are open to everyone; the full list ("View all") comes with paid plans.

export const TOP_CREDITS = 10;

/** Departments in the order the full list shows them. */
export const CREDIT_DEPARTMENTS = [
  "Cast",
  "Direction",
  "Writing",
  "Production",
  "Camera & lighting",
  "Editing & post",
  "Music & sound",
  "Art & design",
  "Wardrobe, hair & make-up",
  "Other",
] as const;
export type CreditDepartment = (typeof CREDIT_DEPARTMENTS)[number];

type Standard = { label: string; department: CreditDepartment; rank: number };

// Raw role → standard role. First match wins; ranks: lower leads the row. Lead cast (first three
// billed) rank 2, the next three 6.5, the rest of the cast 11.
const RULES: [RegExp, Standard][] = [
  [/^(co-)?director$|^film director$/, { label: "Director", department: "Direction", rank: 1 }],
  [/^(creator|showrunner)$/, { label: "Creator", department: "Direction", rank: 1 }],
  [/^(cast|actor|actress|talent|starring|featuring|main cast|supporting cast|lead character|model|athlete|artist|swing|performer)$/, { label: "Cast", department: "Cast", rank: 2 }],
  [/^(narrator|voice-over|voice)$/, { label: "Narrator", department: "Cast", rank: 2 }],
  [/^interviewer$/, { label: "Interviewer", department: "Cast", rank: 2 }],
  [/^(writer|screenplay|screenwriter|poem)$/, { label: "Writer", department: "Writing", rank: 3 }],
  [/^(producers?|line producer|local producer|co-producer)$/, { label: "Producer", department: "Production", rank: 4 }],
  [/^(creative director|concept lead)$/, { label: "Creative Director", department: "Direction", rank: 4 }],
  [/^(dop|dp|director of photography|cinematographer|video dop)$/, { label: "Director of Photography", department: "Camera & lighting", rank: 5 }],
  [/^photographer$/, { label: "Photographer", department: "Camera & lighting", rank: 5 }],
  [/^(editors?|edit|offline editor|online editor|offline and online edit)$/, { label: "Editor", department: "Editing & post", rank: 6 }],
  [/^(music|composer|score|composition)$/, { label: "Music", department: "Music & sound", rank: 7 }],
  [/^(production designer|set design)$/, { label: "Production Designer", department: "Art & design", rank: 8 }],
  [/^(art director|art direction)$/, { label: "Art Director", department: "Art & design", rank: 8 }],
  [/^(costume designer|wardrobe)$/, { label: "Costume Designer", department: "Wardrobe, hair & make-up", rank: 9 }],
  [/^(stylist|styling)$/, { label: "Stylist", department: "Wardrobe, hair & make-up", rank: 9 }],
  [/^(hair and make-up|hmu|hair|make-up|makeup|make-up artist|hair stylist|grooming|barber|beauty|manicurist)$/, { label: "Hair & Make-up", department: "Wardrobe, hair & make-up", rank: 10 }],
  [/^(colourist|colorist|colour grade|grade|colour)$/, { label: "Colourist", department: "Editing & post", rank: 10 }],
  [/^(sound design|sound mix|sound mixer|audio mix|sound|sound supervision|sfx|foley)$/, { label: "Sound", department: "Music & sound", rank: 10 }],
  [/^(vfx|vfx supervisor|animation|ai shots)$/, { label: "VFX", department: "Editing & post", rank: 10 }],
  [/^(choreographer|movement director|movement)$/, { label: "Choreographer", department: "Direction", rank: 10 }],
  [/^casting$/, { label: "Casting", department: "Production", rank: 10 }],
  [/^(executive producer|ep)$/, { label: "Executive Producer", department: "Production", rank: 12 }],
  [/^(camera|camera operator|2nd camera operators?|gaffer|key grip|grip|focus puller|1st ac|2nd ac|dit|electric|sparks?|lighting|jib operator|drone|phantom operator)$/, { label: "", department: "Camera & lighting", rank: 13 }],
  [/^(1st ad|2nd ad|assistant director)$/, { label: "", department: "Direction", rank: 13 }],
  [/^(production (coordinator|manager|assistant|supervisor)|head of production|pa|runner|unit manager|locations?)$/, { label: "", department: "Production", rank: 13 }],
  [/^(set dresser|set build|construction|props|specialty props|graphic designer|art assistant)$/, { label: "", department: "Art & design", rank: 13 }],
  [/^(boom operator|sound recordist)$/, { label: "", department: "Music & sound", rank: 13 }],
];

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Director, DOP and editor" → Director, Director of Photography, Editor. */
export function standardRoles(raw: string): Standard[] {
  return raw
    .split(/,\s*|\s+and\s+|\s*&\s*(?=[a-z])/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      const hit = RULES.find(([re]) => re.test(lower))?.[1];
      // Unlisted roles keep their own words, capitalised, in Other.
      return hit ? { ...hit, label: hit.label || capitalise(part) } : { label: capitalise(part), department: "Other" as const, rank: 14 };
    });
}

export type RawCredit = {
  key: string;
  name: string;
  href: string;
  photo?: string | null;
  /** As credited: "Cast", "DOP", "Director and editor". */
  roles: string[];
  /** Who they play, for cast. */
  character?: string;
};

export type Credit = {
  key: string;
  name: string;
  /** What shows under the name: who they play, or their roles in standard words. */
  role: string;
  href: string;
  photo: string | null;
  /** Their first department, for the full list. */
  department: CreditDepartment;
  /** Their standard roles ("Director", "Editor"). */
  roles: string[];
  rank: number;
};

/** People in credit order (cast in billing order) → the standard list, top credits first. */
export function formatCredits(people: RawCredit[]): Credit[] {
  let billing = 0;
  const out = people.map((p, at) => {
    const std = p.roles.flatMap(standardRoles);
    const unique = std.filter((s, i) => std.findIndex((x) => x.label === s.label) === i);
    const castIndex = unique.some((s) => s.department === "Cast") ? billing++ : -1;
    const ranks = unique.map((s) => (s.department === "Cast" ? (castIndex < 3 ? 2 : castIndex < 6 ? 6.5 : 11) : s.rank));
    const best = unique[ranks.indexOf(Math.min(...ranks))] ?? { label: "", department: "Other" as const, rank: 14 };
    const crew = unique.filter((s) => s.department !== "Cast").map((s) => s.label);
    const castLabel = unique.find((s) => s.department === "Cast")?.label;
    const role = castLabel ? [p.character ?? castLabel, ...crew].join(" · ") : crew.slice(0, 3).join(", ");
    return { key: p.key, name: p.name, role, href: p.href, photo: p.photo ?? null, department: best.department, roles: unique.map((s) => s.label), rank: Math.min(...ranks, 14), at };
  });
  return out.toSorted((a, b) => a.rank - b.rank || a.at - b.at).map(({ at: _at, ...c }) => c);
}

/** The full list by department, in CREDIT_DEPARTMENTS order, empty ones left out. */
export function creditsByDepartment(credits: Credit[]) {
  return CREDIT_DEPARTMENTS.map((department) => ({ department, people: credits.filter((c) => c.department === department) })).filter((g) => g.people.length);
}
