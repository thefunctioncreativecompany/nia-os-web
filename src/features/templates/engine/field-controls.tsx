'use client';

import { useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock, Minus, Plus, X } from 'lucide-react';

import { PROFESSION_SECTORS } from '@/lib/onboarding';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/nia/lazy-calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Assignees, type PersonMatch, type PersonRef } from '@/components/nia/assignees';
import { ChoicePills } from '@/components/nia/choice-pills';
import { createClient } from '@/lib/supabase/client';
import { TimeWheel, type TimeValue } from '@/components/nia/time-wheel';
import type { DurationUnit, FieldSpec } from '../types';
import { useDocumentContext } from './document-context';
import { fieldKind, fieldLabel, optionsFromSection, refRows, type FieldValue } from './sections';
import { formatClock, formatDays, formatPages, isEmail, parseDay, toAmount, toDay, type DateTimeRange, type Duration, type TimeRange, type Weather, type YesNo } from './format';

// One control per field kind (T5): pick rather than type wherever the answer has a shape.
// Built from the component library (Input, ChoicePills, Select, Calendar, TimeWheel, Command).
// `compact` is the table-cell version: no pill rows, choices in a menu.

const lineInput =
  'h-auto rounded-md border-transparent px-1.5 py-0.5 text-sm leading-normal font-medium text-foreground shadow-none hover:bg-muted/70 focus-visible:border-transparent md:text-sm placeholder:text-nia-placeholder print:px-0';
const pickerTrigger =
  'inline-flex h-8 min-w-0 items-center gap-2 rounded-md px-1.5 text-sm font-medium text-foreground outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/70';
const smallPills = 'gap-1.5 py-0.5 [&>button]:px-3 [&>button]:py-1 [&>button]:text-small';

type ControlProps = {
  id: string;
  field: FieldSpec;
  value: FieldValue;
  onChange: (next: FieldValue) => void;
  compact?: boolean;
  tall?: boolean;
  /** For a date with `after`: the earliest day it can be (prevents Date in before Date out). */
  minDay?: string;
  /** For money: the document's currency. */
  currency?: string;
};

export function FieldControl({ id, field, value, onChange, compact = false, tall = false, minDay, currency = 'USD' }: ControlProps) {
  const label = fieldLabel(field);
  const spec = typeof field === 'string' ? undefined : field;

  switch (fieldKind(field)) {
    case 'choice':
      if (spec?.optionsFrom) return <ChoiceFromSection id={id} label={label} from={spec.optionsFrom} value={value as string} onChange={onChange} />;
      return compact ? (
        <ChoiceMenu id={id} label={label} options={spec?.options ?? []} value={value as string} onChange={onChange} />
      ) : (
        <ChoicePills
          label={label}
          value={(value as string) || null}
          // Tapping the chosen one again clears it.
          onChange={(next) => onChange(next === value ? '' : next)}
          options={(spec?.options ?? []).map((o) => ({ value: o, label: o }))}
          className={smallPills}
        />
      );
    case 'role':
      return <RolePicker id={id} label={label} value={value as string} onChange={onChange} />;
    case 'people':
      return <Assignees id={id} label={label} value={value as PersonRef[]} onChange={onChange} search={findPeople} single={spec?.single} compact={compact} />;
    case 'number':
      return <NumberControl id={id} label={label} value={value as string} onChange={onChange} />;
    case 'time':
      return <TimePick id={id} label={compact ? label : 'Pick time'} value={value as string} onChange={onChange} bare={compact} />;
    case 'timeRange': {
      const [first = 'Start', second = 'End'] = spec?.options ?? [];
      const range = value as TimeRange;
      return (
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
          <TimePick id={id} label={first} value={range.start} onChange={(start) => onChange({ ...range, start })} />
          <span aria-hidden className="text-small text-muted-foreground">/</span>
          <TimePick id={`${id}-end`} label={second} value={range.end} onChange={(end) => onChange({ ...range, end })} />
        </div>
      );
    }
    case 'weather':
      return <WeatherControl id={id} label={label} options={spec?.options ?? []} value={value as Weather} onChange={onChange} />;
    case 'pages':
      return <PagesControl id={id} label={label} value={value as string} onChange={onChange} />;
    case 'refs':
      return <RefsControl id={id} label={label} source={spec?.source ?? ''} value={value as string[]} onChange={onChange} />;
    case 'money':
      return <MoneyControl id={id} label={label} value={value as string} onChange={onChange} currency={currency} />;
    case 'date':
      return <DateControl id={id} label={label} value={value as string} onChange={onChange} minDay={minDay} />;
    case 'duration':
      return <DurationControl id={id} label={label} units={spec?.units} value={value as Duration} onChange={onChange} />;
    case 'check':
      return <Checkbox id={id} aria-label={label} checked={value === true} onCheckedChange={(on) => onChange(on === true)} className="mx-1.5" />;
    case 'dateTimeRange':
      return <DateTimeRangeControl id={id} label={label} value={value as DateTimeRange} onChange={onChange} />;
    case 'yesNo':
      return <YesNoControl id={id} label={label} placeholder={spec?.placeholder} value={value as YesNo} onChange={onChange} />;
    case 'phone':
      return <Input id={id} aria-label={compact ? label : undefined} type="tel" inputMode="tel" autoComplete="tel" value={value as string} placeholder="—" onChange={(e) => onChange(e.target.value)} className={lineInput} />;
    case 'email':
      return <EmailControl id={id} label={compact ? label : undefined} value={value as string} onChange={onChange} />;
    default:
      return tall ? (
        <Textarea id={id} aria-label={label} value={value as string} placeholder="—" rows={2} onChange={(e) => onChange(e.target.value)} className={cn(lineInput, 'min-h-16 resize-none')} />
      ) : (
        <Input id={id} aria-label={compact ? label : undefined} value={value as string} placeholder="—" onChange={(e) => onChange(e.target.value)} className={lineInput} />
      );
  }
}

function EmailControl({ id, label, value, onChange }: { id: string; label?: string; value: string; onChange: (next: string) => void }) {
  const [checked, setChecked] = useState(false);
  const invalid = checked && value.trim() !== '' && !isEmail(value);
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Input
        id={id}
        aria-label={label}
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

// Nia profiles by @username, exact email, or (among collaborators) name: see find_people.
async function findPeople(q: string): Promise<PersonMatch[]> {
  const { data, error } = await createClient().rpc('find_people', { q });
  return error ? [] : (data as PersonMatch[]);
}

const NONE = '__none';

/** A pick-list of another section's answers, so the same place is never typed two ways. */
function ChoiceFromSection({ id, label, from, value, onChange }: { id: string; label: string; from: string; value: string; onChange: (next: string) => void }) {
  const doc = useDocumentContext();
  const options = doc ? optionsFromSection(doc.schema, doc.data, from) : [];
  if (value && !options.includes(value)) options.unshift(value);
  if (!options.length) return <span className="px-1.5 text-small text-nia-placeholder">Add {from.toLowerCase()} first</span>;
  return <ChoiceMenu id={id} label={label} options={options} value={value} onChange={onChange} />;
}

/** Tick rows of another table (Cast ← Cast & Talent Calls); shown by their numbers. */
function RefsControl({ id, label, source, value, onChange }: { id: string; label: string; source: string; value: string[]; onChange: (next: string[]) => void }) {
  const doc = useDocumentContext();
  const rows = doc ? refRows(doc.schema, doc.data, source) : [];
  const picked = rows.filter((r) => value.includes(r.id));
  return (
    <Popover>
      <PopoverTrigger id={id} aria-label={picked.length ? `${label}: ${picked.map((r) => r.number).join(', ')}` : `${label}: choose`} className={cn(pickerTrigger, 'w-full justify-between')}>
        <span className={cn('truncate tabular-nums', !picked.length && 'text-nia-placeholder')}>{picked.length ? picked.map((r) => r.number).join(', ') : '—'}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground print:hidden" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        {rows.length === 0 ? (
          <p className="px-2 py-3 text-caption text-muted-foreground">Add people to {source} first.</p>
        ) : (
          <div role="listbox" aria-label={label} aria-multiselectable className="flex max-h-64 flex-col overflow-y-auto">
            {rows.map((r) => {
              const on = value.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => onChange(on ? value.filter((v) => v !== r.id) : [...value, r.id])}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  <span className="w-6 shrink-0 font-bold text-muted-foreground tabular-nums">{r.number}</span>
                  <span className={cn('min-w-0 flex-1 truncate', !r.label && 'text-nia-placeholder')}>{r.label || 'No name yet'}</span>
                  {on && <Check aria-hidden className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Script pages in eighths: whole pages − 2 + and the eighths, e.g. 2 3/8. Stored as eighths. */
function PagesControl({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (next: string) => void }) {
  const total = Math.max(0, Math.round(toAmount(value)));
  const whole = Math.floor(total / 8);
  const part = total % 8;
  const set = (w: number, p: number) => onChange(w * 8 + p > 0 ? String(w * 8 + p) : '');
  const button = 'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 print:hidden';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${label}: ${formatPages(total) || 'none'}`} role="group">
      <button type="button" aria-label="One page fewer" onClick={() => set(Math.max(0, whole - 1), part)} className={cn(button, whole <= 0 && 'invisible')}>
        <Minus aria-hidden className="size-3.5" />
      </button>
      <span id={id} className={cn('w-5 text-center text-sm font-medium tabular-nums', !whole && 'text-nia-placeholder')}>{whole || '0'}</span>
      <button type="button" aria-label="One page more" onClick={() => set(whole + 1, part)} className={button}>
        <Plus aria-hidden className="size-3.5" />
      </button>
      <Select value={String(part)} onValueChange={(next) => set(whole, Number(next))}>
        <SelectTrigger aria-label={`${label}: eighths`} className="h-8 w-auto min-w-0 border-transparent px-1.5 text-sm font-medium shadow-none hover:bg-muted/70 print:[&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 8 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>
              {i ? `${i}/8` : '0/8'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Tap the conditions; the high temperature on − + with °F / °C. */
function WeatherControl({ id, label, options, value, onChange }: { id: string; label: string; options: string[]; value: Weather; onChange: (next: Weather) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <ChoicePills
        label={label}
        value={value.condition || null}
        onChange={(condition) => onChange({ ...value, condition: condition === value.condition ? '' : condition })}
        options={options.map((o) => ({ value: o, label: o }))}
        className={smallPills}
      />
      <div className="flex items-center gap-1">
        <span className="pl-1.5 text-small text-muted-foreground">High</span>
        <NumberControl id={id} label={`${label}: high temperature`} value={value.high} onChange={(high) => onChange({ ...value, high })} min={-50} start={value.unit === 'C' ? 20 : 70} />
        <ChoicePills
          label={`${label}: unit`}
          value={value.unit}
          onChange={(unit) => onChange({ ...value, unit })}
          options={[
            { value: 'F' as const, label: '°F' },
            { value: 'C' as const, label: '°C' },
          ]}
          className={smallPills}
        />
      </div>
    </div>
  );
}

function ChoiceMenu({ id, label, options, value, onChange }: { id: string; label: string; options: string[]; value: string; onChange: (next: string) => void }) {
  return (
    <Select value={value || NONE} onValueChange={(next) => onChange(next === NONE ? '' : next)}>
      <SelectTrigger id={id} aria-label={label} className={cn("h-8 w-full min-w-0 border-transparent px-1.5 text-sm font-medium shadow-none hover:bg-muted/70 print:[&>svg]:hidden", !value && "text-nia-placeholder")}>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE} className="text-muted-foreground">
          —
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Production roles from onboarding, searchable and grouped by sector. */
function RolePicker({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} aria-label={value ? `${label}: ${value}` : `${label}: choose`} className={cn(pickerTrigger, 'w-full justify-between')}>
        <span className={cn('truncate', !value && 'text-nia-placeholder')}>{value || '—'}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground print:hidden" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search roles" />
          <CommandList>
            <CommandEmpty>No role by that name.</CommandEmpty>
            {value && (
              <CommandGroup>
                <CommandItem onSelect={() => { onChange(''); setOpen(false); }} className="text-muted-foreground">
                  Clear
                </CommandItem>
              </CommandGroup>
            )}
            {PROFESSION_SECTORS.map(({ sector, roles }) => (
              <CommandGroup key={sector} heading={sector}>
                {roles.map((role) => (
                  <CommandItem key={role} value={role} onSelect={() => { onChange(role); setOpen(false); }}>
                    {role}
                    {role === value && <Check aria-hidden className="ml-auto size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** − 3 + : tap rather than type; typing still works. Whole numbers from `min`; an empty one
 *  steps from `start` (a temperature starts at 70°F, not 0). */
function NumberControl({ id, label, value, onChange, min = 0, start }: { id: string; label: string; value: string; onChange: (next: string) => void; min?: number; start?: number }) {
  const empty = value.trim() === '';
  const n = empty ? (start ?? min) : Number(value) || 0;
  const step = (by: number) => onChange(String(Math.max(min, empty && start !== undefined ? n : n + by)));
  const button = 'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 print:hidden';
  return (
    <div className="flex items-center gap-0.5">
      {/* Hidden (keeping its place) until there is something to take away, so a blank reads "— +". */}
      <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={empty || n <= min} onClick={() => step(-1)} className={cn(button, (empty || n <= min) && 'invisible')}>
        <Minus aria-hidden className="size-3.5" />
      </button>
      <Input
        id={id}
        aria-label={label}
        inputMode="numeric"
        value={value}
        placeholder="—"
        onChange={(e) => onChange(e.target.value.replace(min < 0 ? /[^0-9-]/g : /[^0-9]/g, ''))}
        className={cn(lineInput, 'w-10 px-0.5 text-center tabular-nums')}
      />
      <button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => step(1)} className={button}>
        <Plus aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

/** An amount in the document's currency: the symbol in front, two decimals once you leave it. */
function MoneyControl({ id, label, value, onChange, currency }: { id: string; label: string; value: string; onChange: (next: string) => void; currency: string }) {
  const symbol = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
  return (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <span aria-hidden className={cn('text-sm', value ? 'text-muted-foreground' : 'text-nia-placeholder')}>{symbol}</span>
      <Input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={value}
        placeholder="0.00"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={() => value && onChange(toAmount(value).toFixed(2))}
        className={cn(lineInput, 'w-full min-w-0 text-right tabular-nums')}
      />
    </div>
  );
}

function DateControl({ id, label, value, onChange, minDay }: { id: string; label: string; value: string; onChange: (next: string) => void; minDay?: string }) {
  const [open, setOpen] = useState(false);
  const day = parseDay(value) ?? undefined;
  const min = minDay ? parseDay(minDay) : null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} aria-label={value ? `${label}: ${formatDays(value, value)}` : `${label}: pick a date`} className={pickerTrigger}>
        <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground print:hidden" />
        <span className={cn('truncate', !value && 'text-nia-placeholder')}>{value ? formatDays(value, value) : 'Pick date'}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={day}
          defaultMonth={day ?? min ?? undefined}
          // A day before the one it must follow can't be picked (e.g. Date in before Date out).
          disabled={min ? { before: min } : undefined}
          onSelect={(next) => {
            onChange(next ? toDay(next) : '');
            setOpen(false);
          }}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="mt-1 w-full rounded-md py-1.5 text-small text-muted-foreground hover:bg-muted/70 hover:text-foreground">
            Clear date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** An amount and a unit: 3 minutes, 2 hours, 4 days (Ika, 2026-10-19). */
function DurationControl({ id, label, units = ['minutes', 'hours', 'days'], value, onChange }: { id: string; label: string; units?: DurationUnit[]; value: Duration; onChange: (next: Duration) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Input
        id={id}
        aria-label={`${label}: amount`}
        inputMode="decimal"
        value={value.amount}
        placeholder="—"
        onChange={(e) => onChange({ ...value, amount: e.target.value.replace(/[^0-9.]/g, '') })}
        className={cn(lineInput, 'w-14 text-right tabular-nums')}
      />
      <Select value={value.unit} onValueChange={(unit) => onChange({ ...value, unit: unit as DurationUnit })}>
        <SelectTrigger aria-label={`${label}: unit`} className="h-8 w-auto min-w-0 border-transparent px-1.5 text-sm font-medium shadow-none hover:bg-muted/70 print:[&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

/** `bare`: no clock icon, for narrow table cells. */
function TimePick({ id, label, value, onChange, bare = false }: { id: string; label: string; value: string; onChange: (next: string) => void; bare?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger id={id} aria-label={value ? `${label}: ${formatClock(value)}` : label} className={pickerTrigger}>
        {!bare && <Clock aria-hidden className="size-4 text-muted-foreground print:hidden" />}
        <span className={cn('truncate tabular-nums', !value && 'text-nia-placeholder')}>{value ? formatClock(value) : label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <TimeWheel value={toWheel(value)} onChange={(next) => onChange(fromWheel(next))} />
        {value && (
          <button type="button" onClick={() => onChange('')} className="mt-1 w-full rounded-md py-1.5 text-small text-muted-foreground hover:bg-muted/70 hover:text-foreground">
            Clear time
          </button>
        )}
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
          <CalendarDays aria-hidden className="size-4 text-muted-foreground print:hidden" />
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
        className={cn('shrink-0', smallPills)}
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
