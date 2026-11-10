// Onboarding steps in order. Each one is a page at /onboarding/<step>. (Import your profile and
// Follow creators were removed on 2026-11-02, git tag parked-2026-11-02; "What you can do on Nia"
// and inviting team members on 2026-11-10, since they promised things that aren't live yet, git
// tag parked-2026-11-10-onboarding.) The workspace step is the last: it marks onboarding complete.
export const ONBOARDING_STEPS = [
  "source",
  "username",
  "photo",
  "profession",
  "workspace",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

// "Step N of 4": the first question and the "You're all set" screen aren't counted.
export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length - 2;

export const stepNumber = (step: OnboardingStepId) => ONBOARDING_STEPS.indexOf(step);

export function nextStepHref(step: OnboardingStepId) {
  const next = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] ?? "done";
  return `/onboarding/${next}`;
}

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
