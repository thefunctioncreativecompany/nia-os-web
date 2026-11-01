/** "AB" from "Ama Bello" or "@amabello". */
export function initials(name: string) {
  const words = name.replace(/^@/, "").split(/[\s._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words.at(-1)![0] : (words[0]?.[1] ?? ""))).toUpperCase();
}
