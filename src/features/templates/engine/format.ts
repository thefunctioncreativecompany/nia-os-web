import type { DurationUnit } from '../types';

/*
 * How typed answers read on screen, in the downloads and in letters (T5). Values are stored in a
 * standard form (dates YYYY-MM-DD, times HH:MM in 24 hours) so later autofill from voice memos
 * and documents has one shape to fill; these turn them into "Aug 12–14, 2026 · 5:00 AM – 11:00 PM".
 */

export type DateTimeRange = { from: string; to: string; start: string; end: string };
export type YesNo = { answer: '' | 'yes' | 'no'; note: string };

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short' });

/** "2026-08-12" as a local date (no time zone shift), or null. */
export function parseDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "Aug 12, 2026", "Aug 12–14, 2026", "Aug 30 – Sep 2, 2026", "Dec 30, 2026 – Jan 2, 2027". */
export function formatDays(fromValue: string, toValue: string) {
  const from = parseDay(fromValue);
  if (!from) return '';
  const to = parseDay(toValue) ?? from;
  const m = (d: Date) => MONTH.format(d);
  if (from.getFullYear() !== to.getFullYear()) return `${m(from)} ${from.getDate()}, ${from.getFullYear()} – ${m(to)} ${to.getDate()}, ${to.getFullYear()}`;
  if (from.getMonth() !== to.getMonth()) return `${m(from)} ${from.getDate()} – ${m(to)} ${to.getDate()}, ${to.getFullYear()}`;
  if (from.getDate() !== to.getDate()) return `${m(from)} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
  return `${m(from)} ${from.getDate()}, ${from.getFullYear()}`;
}

/** "05:00" → "5:00 AM". */
export function formatClock(value: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return '';
  const hour = Number(m[1]);
  return `${hour % 12 || 12}:${m[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function formatDateTimeRange(value: DateTimeRange, { datesOnly = false } = {}) {
  const days = formatDays(value.from, value.to);
  if (datesOnly) return days;
  const times = [formatClock(value.start), formatClock(value.end)].filter(Boolean).join(' – ');
  return [days, times].filter(Boolean).join(' · ');
}

export function formatYesNo(value: YesNo) {
  if (value.answer === 'no') return 'No';
  if (value.answer === 'yes') return value.note.trim() ? `Yes — ${value.note.trim()}` : 'Yes';
  return value.note.trim();
}

export const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

export type Duration = { amount: string; unit: DurationUnit };

/** "3 minutes", "1 hour", "1.5 days". */
export function formatDuration(value: Duration) {
  const amount = value.amount.trim();
  if (!amount) return '';
  const unit = Number(amount) === 1 ? value.unit.slice(0, -1) : value.unit;
  return `${amount} ${unit}`;
}

/** "850" or "850.5" → a number, ignoring anything that isn't part of one. */
export const toAmount = (value: unknown) => {
  const n = parseFloat(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** 15400 → "$15,400.00" in the document's currency (USD unless it says otherwise). */
export function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}
