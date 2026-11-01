// Onboarding steps in order. Each one is a page at /onboarding/<step>.
// Import your profile and Follow creators are hidden for now (Ika, 2026-10-17; done 2026-10-31
// after the beta walkthrough showed nine screens before Home): their pages stay for after beta
// and send anyone who reaches them on to the next step.
export const ONBOARDING_STEPS = [
  "source",
  "username",
  "photo",
  "profession",
  "workspace",
  "features",
  "done",
] as const;
export const HIDDEN_ONBOARDING_STEPS = ["import", "follow"] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number] | (typeof HIDDEN_ONBOARDING_STEPS)[number];

// "Step N of 6" starts after the first question, which isn't counted.
export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length - 1;

// Where a hidden step would have been: the step it now hands on to.
const AFTER_HIDDEN: Record<(typeof HIDDEN_ONBOARDING_STEPS)[number], (typeof ONBOARDING_STEPS)[number]> = {
  import: "username",
  follow: "features",
};
const inFlow = (step: OnboardingStepId) => step as (typeof ONBOARDING_STEPS)[number];

export function stepNumber(step: OnboardingStepId) {
  return step in AFTER_HIDDEN ? 0 : ONBOARDING_STEPS.indexOf(inFlow(step));
}

export function nextStepHref(step: OnboardingStepId) {
  if (step in AFTER_HIDDEN) return `/onboarding/${AFTER_HIDDEN[step as keyof typeof AFTER_HIDDEN]}`;
  const next = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(inFlow(step)) + 1] ?? "done";
  return `/onboarding/${next}`;
}

/** For a hidden step's page: where to send someone who reaches it. */
export const hiddenStepRedirect = (step: (typeof HIDDEN_ONBOARDING_STEPS)[number]) => `/onboarding/${AFTER_HIDDEN[step]}`;

export const HEARD_ABOUT_OPTIONS = [
  "Website",
  "Google",
  "Twitter",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Reddit",
  "Discord",
  "Friend",
  "Other",
] as const;

// Roles by sector (Fix 6). Names match the template roles (templates.manifest.json `icps`) so
// "Suggested for you" works from onboarding; a few common roles the templates don't name yet
// (Producer, Production Assistant, Camera Operator…) are here too and get starter suggestions.
export const PROFESSION_SECTORS: { sector: string; roles: string[] }[] = [
  {
    sector: "Production & Direction",
    roles: [
      "Producer",
      "Executive Producer",
      "Line Producer",
      "Production Manager",
      "Production Coordinator",
      "Production Assistant",
      "Director",
      "Creative Director",
      "1st Assistant Director",
      "Script Supervisor",
      "Location Manager",
      "Casting Director",
      "Screenwriter",
    ],
  },
  { sector: "Camera & On-Set", roles: ["Director of Photography", "Camera Operator", "Camera Assistant", "Gaffer", "DIT"] },
  {
    sector: "Post-Production",
    roles: ["Editor (Film / Video)", "Colorist", "VFX Supervisor", "Sound Designer / Mixer", "Music Supervisor", "Motion Designer"],
  },
  { sector: "Design, Styling & Craft", roles: ["Production Designer", "Costume Designer", "Stylist", "Makeup Artist (MUA)"] },
  { sector: "Photography", roles: ["Photographer", "Event / Press Photographer"] },
  { sector: "Creator & Content", roles: ["Content Creator / Influencer", "UGC Creator", "Social Media Manager"] },
  { sector: "Talent & Performance", roles: ["Talent Agent", "Talent Management Agency", "Actor / Performer"] },
  {
    sector: "Enterprise, Brand & PR",
    roles: ["Brand Manager / Marketing Director", "PR / Communications Agency", "Publicist / Unit Publicist", "Entertainment Lawyer"],
  },
];

// The most common roles, shown first as tiles (junior roles included).
export const COMMON_PROFESSIONS = [
  "Producer",
  "Director",
  "Director of Photography",
  "Editor (Film / Video)",
  "Content Creator / Influencer",
  "Production Assistant",
] as const;

export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

// Username ideas from the user's name (or email), most natural first.
export function suggestUsernames(name: string, email: string) {
  const words = (name.trim() || email.split("@")[0])
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s._-]/g, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  const first = words[0] ?? "nia";
  const last = words.length > 1 ? words[words.length - 1] : "";
  const joined = `${first}${last}`;
  const candidates = [
    joined,
    last && `${first}.${last}`,
    `${joined}.films`,
    last && `${first[0]}${last}.films`,
    `${joined}.studio`,
    `${joined}.creates`,
    `${joined}${new Set(words).size + 1}`,
  ];
  return [...new Set(candidates.map((c) => c.slice(0, 30)))].filter((c) =>
    USERNAME_PATTERN.test(c),
  );
}
