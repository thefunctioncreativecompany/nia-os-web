// Dates picked with the calendar are stored as "2026-07-15" (day only, no time zone).
// Older free-text values like "July 2026" are shown as typed.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(value: string): Date | undefined {
  if (!ISO_DAY.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDay(value: string) {
  const date = parseDay(value);
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : value;
}
