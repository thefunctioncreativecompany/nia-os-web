// Onboarding steps in order. Each one is a page at /onboarding/<step>.
export const ONBOARDING_STEPS = [
  "source",
  "import",
  "username",
  "photo",
  "profession",
  "workspace",
  "follow",
  "features",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

// "Step N of 8" starts at the import step; the first question isn't counted.
export const ONBOARDING_TOTAL_STEPS = 8;

export function stepNumber(step: OnboardingStepId) {
  return ONBOARDING_STEPS.indexOf(step);
}

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

export const PROFESSIONS = [
  "Director",
  "Producer",
  "Cinematographer",
  "Editor",
  "Production Designer",
  "Sound Designer",
  "VFX Supervisor",
  "Screenwriter",
  "Production Assistant",
  "Colorist",
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
