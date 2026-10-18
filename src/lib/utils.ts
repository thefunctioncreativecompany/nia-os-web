import { createCn } from "cn/config"

// Class merging (later classes win over conflicting earlier ones). It needs to know the
// theme's named text sizes (globals.css), or it mistakes `text-small` for a text color
// and drops one of the two.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "subtitle", "lead", "small", "caption", "micro", "meta", "tiny", "wordmark"] },
      ],
    },
  },
})

// "Jane Doe" -> "JD", shown when a user has no avatar picture.
export function getInitials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
