'use client';

import { useState } from 'react';
import { CalendarDays, Clock, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChoicePills } from '@/components/nia/choice-pills';
import { TimeWheel, type TimeValue } from '@/components/nia/time-wheel';
import type { FieldSpec } from '../types';
import { fieldKind, fieldLabel, type FieldValue } from './sections';
import { formatClock, formatDays, isEmail, parseDay, toDay, type DateTimeRange, type YesNo } from './format';

// One control per field kind (T5): pick rather than type wherever the answer has a shape.
// Built from the component library (Input, ChoicePills, Calendar, TimeWheel in a Popover).

const lineInput =
  'h-auto rounded-md border-transparent px-1.5 py-0.5 text-sm leading-normal font-medium text-foreground shadow-none hover:bg-muted/70 focus-visible:border-transparent md:text-sm placeholder:text-nia-placeholder print:px-0';
const pickerTrigger =
  'inline-flex h-8 items-center gap-2 rounded-md px-1.5 text-sm font-medium text-foreground outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/70';

export function FieldControl({ id, field, value, onChange }: { id: string; field: FieldSpec; value: FieldValue; onChange: (next: FieldValue) => void }) {
  const label = fieldLabel(field);
  const options = typeof field === 'string' ? undefined : field.options;
  const placeholder = typeof field === 'string' ? undefined : field.placeholder;

  switch (fieldKind(field)) {
    case 'choice':
      return (
        <ChoicePills
          label={label}
          value={(value as string) || null}
          // Tapping the chosen one again clears it.
          onChange={(next) => onChange(next === value ? '' : next)}
          options={(options ?? []).map((o) => ({ value: o, label: o }))}
          className="gap-1.5 py-0.5 [&>button]:px-3 [&>button]:py-1 [&>button]:text-small"
        />
      );
    case 'dateTimeRange':
      return <DateTimeRangeControl id={id} label={label} value={value as DateTimeRange} onChange={onChange} />;
    case 'yesNo':
      return <YesNoControl id={id} label={label} placeholder={placeholder} value={value as YesNo} onChange={onChange} />;
    case 'phone':
      return <Input id={id} type="tel" inputMode="tel" autoComplete="tel" value={value as string} placeholder="—" onChange={(e) => onChange(e.target.value)} className={lineInput} />;
    case 'email':
      return <EmailControl id={id} value={value as string} onChange={onChange} />;
    default:
      return <Input id={id} value={value as string} placeholder="—" onChange={(e) => onChange(e.target.value)} className={lineInput} />;
  }
}

function EmailControl({ id, value, onChange }: { id: string; value: string; onChange: (next: string) => void }) {
  const [checked, setChecked] = useState(false);
  const invalid = checked && value.trim() !== '' && !isEmail(value);
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value}
        placeholder="—"
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onBlur={() => setChecked(true)}
        onChange={(e) => onChange(e.target.value)}
        className={lineInput}
      />
      {invalid && (
        <p id={`${id}-error`} className="px-1.5 text-caption text-destructive">
          Check the email address, e.g. name@company.com
        </p>
      )}
    </div>
  );
}

// "05:00" ↔ the time wheel's 12-hour value.
const toWheel = (value: string): TimeValue => {
  const [h, m] = value ? value.split(':').map(Number) : [9, 0];
  return { hour: h % 12 || 12, minute: m, period: h < 12 ? 'AM' : 'PM' };
};
const fromWheel = ({ hour, minute, period }: TimeValue) =>
  `${String((hour % 12) + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

function TimePick({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (next: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger id={id} aria-label={value ? `${label}: ${formatClock(value)}` : label} className={pickerTrigger}>
        <Clock aria-hidden className="size-4 text-muted-foreground" />
        <span className={cn('tabular-nums', !value && 'text-nia-placeholder')}>{value ? formatClock(value) : label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <TimeWheel value={toWheel(value)} onChange={(next) => onChange(fromWheel(next))} />
      </PopoverContent>
    </Popover>
  );
}

function DateTimeRangeControl({ id, label, value, onChange }: { id: string; label: string; value: DateTimeRange; onChange: (next: DateTimeRange) => void }) {
  const from = parseDay(value.from) ?? undefined;
  const to = parseDay(value.to) ?? undefined;
  const set = (patch: Partial<DateTimeRange>) => onChange({ ...value, ...patch });
  const empty = !value.from && !value.start && !value.end;
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1">
      <Popover>
        <PopoverTrigger id={id} aria-label={value.from ? `${label}: ${formatDays(value.from, value.to)}` : `${label}: pick dates`} className={pickerTrigger}>
          <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
          <span className={cn(!value.from && 'text-nia-placeholder')}>{value.from ? formatDays(value.from, value.to) : 'Pick dates'}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="range"
            selected={{ from, to }}
            defaultMonth={from}
            onSelect={(range) => set({ from: range?.from ? toDay(range.from) : '', to: range?.to ? toDay(range.to) : '' })}
          />
        </PopoverContent>
      </Popover>
      <TimePick id={`${id}-start`} label="Start time" value={value.start} onChange={(start) => set({ start })} />
      <span aria-hidden className="text-small text-muted-foreground">to</span>
      <TimePick id={`${id}-end`} label="End time" value={value.end} onChange={(end) => set({ end })} />
      {!empty && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => onChange({ from: '', to: '', start: '', end: '' })}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 print:hidden"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function YesNoControl({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder?: string; value: YesNo; onChange: (next: YesNo) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
      <ChoicePills
        label={label}
        value={value.answer || null}
        onChange={(answer) => onChange({ ...value, answer: answer === value.answer ? '' : answer })}
        options={[
          { value: 'yes' as const, label: 'Yes' },
          { value: 'no' as const, label: 'No' },
        ]}
        className="shrink-0 gap-1.5 py-0.5 [&>button]:px-3 [&>button]:py-1 [&>button]:text-small"
      />
      {value.answer === 'yes' && (
        <Input
          id={id}
          aria-label={`${label}: details`}
          value={value.note}
          placeholder={placeholder ?? 'Details'}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          className={lineInput}
        />
      )}
    </div>
  );
}
