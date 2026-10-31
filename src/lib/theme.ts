// Light and dark (Ika, 2026-10-31): neutral greys with Nia Blue as the accent in both. A choice for this device, like Sound: Settings → General sets it, localStorage keeps
// it, and the root layout's script applies it before the page draws, so dark never flashes white.
// Matches the device unless someone chooses Light or Dark (Ika, 2026-10-31).

export type ThemeChoice = "light" | "dark" | "system";
export const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match my device" },
];

const KEY = "nia-theme";
const DARK = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

/** Runs in <head> before anything draws: the same rule as applyTheme, with no imports. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="dark"||(t!=="light"&&matchMedia("${DARK}").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export function themeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function applyTheme(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia(DARK).matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {}
  applyTheme(choice);
  listeners.forEach((listener) => listener());
}

/** For useSyncExternalStore. While "Match my device" is chosen, follows the device as it changes. */
export function subscribeTheme(listener: () => void) {
  const media = matchMedia(DARK);
  const follow = () => {
    if (themeChoice() === "system") applyTheme("system");
  };
  listeners.add(listener);
  media.addEventListener("change", follow);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", follow);
  };
}
