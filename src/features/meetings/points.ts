import { findDay } from "@/features/meetings/parse";
import { parseBlocks, plainText, type Block } from "@/lib/rich-text";

// The action items in a meeting's notes (Ika, 2026-11-19), without the AI: the points under a
// heading like "Action items", "Next steps" or "To do", each with the day it mentions. The panel
// lists them above the notes, ready to send to the project's Key milestones in one go.

const ACTION_HEADING = /\b(action items?|actions|next steps|to-?dos?|follow[- ]?ups?|tasks|owners?)\b/i;

export type ActionItem = { title: string; dueOn: string | null };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The day a point mentions ("by Nov 22", "22 November", "on Friday", "tomorrow"), counted from `today`; null when it doesn't. */
export function dueIn(text: string, today: Date): string | null {
  const full = findDay(text);
  if (full) return full;
  const lower = text.toLowerCase();
  if (/\btoday\b|\beod\b|end of (the )?day/.test(lower)) return iso(today);
  if (/\btomorrow\b/.test(lower)) return iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const monthDay =
    lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/) ??
    lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  if (monthDay) {
    const [m, d] = /^\d/.test(monthDay[1]) ? [monthDay[2], +monthDay[1]] : [monthDay[1], +monthDay[2]];
    const month = MONTHS.indexOf(m);
    // The next time that day comes round.
    let date = new Date(today.getFullYear(), month, d);
    if (date.getMonth() !== month) return null;
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) date = new Date(today.getFullYear() + 1, month, d);
    return iso(date);
  }
  const weekday = lower.match(/\b(?:by|on|before|this|next|due)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekday) {
    const ahead = (DAYS.indexOf(weekday[1]) - today.getDay() + 7) % 7 || 7;
    return iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + ahead));
  }
  return null;
}

/** The points under action headings, in order, without their formatting. */
export function actionItems(summary: string, today = new Date()): ActionItem[] {
  const out: ActionItem[] = [];
  let inActions = false;
  const take = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.kind === "h") inActions = ACTION_HEADING.test(b.text);
      else if (inActions && (b.kind === "ul" || b.kind === "ol"))
        for (const item of b.items) {
          const title = plainText(item.text).trim();
          if (title) out.push({ title: title.slice(0, 300), dueOn: dueIn(title, today) });
        }
    }
  };
  take(parseBlocks(summary));
  return out;
}
