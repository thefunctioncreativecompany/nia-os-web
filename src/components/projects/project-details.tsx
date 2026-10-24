"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";
import { parseDay, toDay } from "@/lib/dates";
import { CREW_ROLES, deliverableText, shootDatesText, type CrewMember, type Deliverable } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/features/templates/engine/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Assignees, type PersonMatch, type PersonRef } from "@/components/nia/assignees";
import { Calendar } from "@/components/nia/lazy-calendar";

// The parts of a project's Details that need more than a line of text (Ika, 2026-10-23): shoot
// dates, deliverables, the budget, a number, and Crew & talent. Each saves on its own.

const quiet = "text-sm font-medium text-muted-foreground";
const fieldLook = "h-8 rounded-md border-transparent px-1.5 text-sm font-medium text-muted-foreground shadow-none hover:bg-muted/70 focus-visible:border-transparent md:text-sm";

export function ShootDatesField({
  start,
  end,
  readOnly,
  onSave,
}: {
  start: string | null;
  end: string | null;
  readOnly: boolean;
  onSave: (start: string | null, end: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const shown = shootDatesText(start, end) || "—";
  if (readOnly) return <span className={cn("block pt-1.5", quiet)}>{shown}</span>;
  const from = start ? parseDay(start) : undefined;
  const to = end ? parseDay(end) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Shoot dates: ${start ? shown : "not set"}. Change`}
        className={cn("group flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted", quiet)}
      >
        {shown}
        <CalendarDays aria-hidden className="size-4 shrink-0 opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-data-[state=open]:opacity-100" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="range"
          selected={{ from, to }}
          defaultMonth={from}
          onSelect={(range) => {
            // The first tap picks a single day; a second tap makes it a range.
            const a = range?.from ? toDay(range.from) : null;
            const b = range?.to ? toDay(range.to) : a;
            void onSave(a, b).catch(() => {});
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border px-1 pt-2">
          <span className="text-caption text-muted-foreground">Pick the first day, then the last.</span>
          {start && (
            <Button variant="ghost" size="sm" onClick={() => (setOpen(false), void onSave(null, null).catch(() => {}))}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const NO_FRAME = "none";

export function DeliverablesField({ value, readOnly, onSave }: { value: Deliverable[]; readOnly: boolean; onSave: (next: Deliverable[]) => Promise<void> }) {
  const [rows, setRows] = useState(value);
  const [seen, setSeen] = useState(value);
  // A change from elsewhere replaces what's shown.
  if (value !== seen) {
    setSeen(value);
    setRows(value);
  }
  if (readOnly) {
    return value.length ? (
      <ul className={cn("flex flex-col gap-1 pt-1.5", quiet)}>
        {value.map((d, i) => (
          <li key={i}>{deliverableText(d)}</li>
        ))}
      </ul>
    ) : (
      <span className={cn("block pt-1.5", quiet)}>—</span>
    );
  }
  const commit = (next: Deliverable[]) => {
    const clean = next.filter((d) => d.what.trim()).map((d) => ({ ...d, what: d.what.trim().slice(0, 80), count: Math.min(999, Math.max(1, Math.round(d.count) || 1)) }));
    if (JSON.stringify(clean) !== JSON.stringify(value)) void onSave(clean).catch(() => {});
  };
  const set = (i: number, patch: Partial<Deliverable>, save = false) => {
    const next = rows.map((d, j) => (j === i ? { ...d, ...patch } : d));
    setRows(next);
    if (save) commit(next);
  };
  return (
    <div className="flex flex-col gap-1">
      {rows.map((d, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            aria-label={`Deliverable ${i + 1}: how many`}
            inputMode="numeric"
            value={String(d.count)}
            onChange={(e) => set(i, { count: Number(e.target.value.replace(/\D/g, "")) || 0 })}
            onBlur={() => commit(rows)}
            className={cn(fieldLook, "w-11 text-right tabular-nums")}
          />
          <span aria-hidden className={quiet}>×</span>
          <Input
            aria-label={`Deliverable ${i + 1}: what`}
            value={d.what}
            maxLength={80}
            placeholder="e.g. 15s cutdown"
            onChange={(e) => set(i, { what: e.target.value })}
            onBlur={() => commit(rows)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className={cn(fieldLook, "min-w-0 flex-1")}
          />
          <Select value={d.frame ?? NO_FRAME} onValueChange={(f) => set(i, { frame: f === NO_FRAME ? null : f }, true)}>
            <SelectTrigger aria-label={`Deliverable ${i + 1}: frame`} className={cn(fieldLook, "w-auto")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FRAME}>Any frame</SelectItem>
              {ASPECT_RATIOS.map((a) => (
                <SelectItem key={a.label} value={a.label}>
                  {a.label} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon-xs" aria-label={`Remove deliverable ${i + 1}`} onClick={() => commit(rows.filter((_, j) => j !== i))}>
            <X aria-hidden />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="compact" className="w-fit text-muted-foreground" onClick={() => setRows([...rows, { what: "", count: 1, frame: null }])}>
        <Plus aria-hidden /> Add a deliverable
      </Button>
    </div>
  );
}

export function NumberField({ label, value, readOnly, onSave }: { label: string; value: number | null; readOnly: boolean; onSave: (next: number | null) => Promise<void> }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(value === null ? "" : String(value));
  }
  if (readOnly) return <span className={cn("block pt-1.5", quiet)}>{value ?? "—"}</span>;
  return (
    <Input
      aria-label={label}
      inputMode="numeric"
      value={text}
      placeholder="—"
      onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 3))}
      onBlur={() => {
        const next = text ? Number(text) : null;
        if (next !== value) void onSave(next).catch(() => {});
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cn(fieldLook, "w-16 tabular-nums")}
    />
  );
}

// The Invoice's currencies, so a project and its documents agree.
const CURRENCIES = ["USD", "EUR", "GBP", "ZAR", "CAD", "AUD"] as const;

/** The budget: only the owner and editors load or see it (its own table, project_budgets). */
export function BudgetField({ projectId, onSaved }: { projectId: string; onSaved: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState<{ amount: number; currency: string } | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let live = true;
    void createClient()
      .from("project_budgets")
      .select("amount, currency")
      .eq("project_id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        if (data) {
          setSaved({ amount: Number(data.amount), currency: data.currency });
          setAmount(String(Number(data.amount)));
          setCurrency(data.currency);
        }
        setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [projectId]);

  const save = async (nextAmount: string, nextCurrency: string) => {
    const value = Math.round(Number(nextAmount.replace(/[^0-9.]/g, "")) * 100) / 100;
    if (!nextAmount.trim()) return;
    if (!Number.isFinite(value)) return void toast.error("Type the budget as a number, like 25000.");
    if (saved && saved.amount === value && saved.currency === nextCurrency) return;
    const { error } = await createClient().from("project_budgets").upsert({ project_id: projectId, amount: value, currency: nextCurrency });
    if (error) return void toast.error(`Couldn't save the budget: ${error.message}`);
    setSaved({ amount: value, currency: nextCurrency });
    onSaved();
  };

  if (!loaded) return <span className={cn("block pt-1.5", quiet)}>…</span>;
  if (!editing && saved) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={cn("rounded-md px-1.5 py-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50", quiet)}>
        {formatMoney(saved.amount, saved.currency)}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Select
        value={currency}
        onValueChange={(c) => {
          setCurrency(c);
          void save(amount, c);
        }}
      >
        <SelectTrigger aria-label="Budget currency" className={cn(fieldLook, "w-auto")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        aria-label="Budget amount"
        inputMode="decimal"
        autoFocus={editing}
        value={amount}
        placeholder="—"
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
        onBlur={() => {
          setEditing(false);
          void save(amount, currency);
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={cn(fieldLook, "w-32 tabular-nums")}
      />
      <span className="text-caption text-muted-foreground">Only you and editors see this.</span>
    </div>
  );
}

// Crew & talent: people grouped by role, each role a row of names (pick someone on Nia or type
// a name). Roles are added from the list or typed.
export function CrewSection({
  crew,
  readOnly,
  onSave,
  search,
}: {
  crew: CrewMember[];
  readOnly: boolean;
  onSave: (next: CrewMember[]) => Promise<void>;
  search: (q: string) => Promise<PersonMatch[]>;
}) {
  const [extraRoles, setExtraRoles] = useState<string[]>([]);
  const [adding, setAdding] = useState("");
  const roles = [...new Set([...crew.map((c) => c.role), ...extraRoles])];
  const people = (role: string): PersonRef[] => crew.filter((c) => c.role === role).map((c) => ({ name: c.name, userId: c.userId }));

  const setRole = (role: string, next: PersonRef[]) => {
    const others = crew.filter((c) => c.role !== role);
    const mine = next.map((p) => ({ role, name: p.name.trim().slice(0, 120), ...(p.userId ? { userId: p.userId } : {}) })).filter((c) => c.name);
    if (!mine.length) setExtraRoles((list) => list.filter((r) => r !== role));
    void onSave([...others, ...mine]).catch(() => {});
  };
  const addRole = (role: string) => {
    const r = role.trim().slice(0, 40);
    if (r && !roles.includes(r)) setExtraRoles((list) => [...list, r]);
    setAdding("");
  };

  return (
    <section aria-labelledby="crew" className="flex flex-col gap-4">
      <h2 id="crew" className="text-xl leading-[1.4] font-bold text-foreground">
        Crew &amp; talent
      </h2>
      {roles.length === 0 && <p className="text-sm text-muted-foreground">{readOnly ? "No one added yet." : "Add the people on this production, by role."}</p>}
      <dl className="flex flex-col gap-3">
        {roles.map((role) => (
          <div key={role} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
            <dt className="w-24 shrink-0 pt-1.5 text-sm leading-[1.4] font-bold text-foreground">{role}</dt>
            <dd className="min-w-0 flex-1">
              {readOnly ? (
                <span className={cn("flex flex-wrap gap-x-6 gap-y-1 pt-1.5", quiet)}>{people(role).map((p) => <span key={p.name}>{p.name}</span>)}</span>
              ) : (
                <Assignees label={role} value={people(role)} onChange={(next) => setRole(role, next)} search={search} />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value="" onValueChange={addRole}>
            <SelectTrigger aria-label="Add a role" className="h-9 w-auto rounded-full text-small">
              <SelectValue placeholder="Add a role" />
            </SelectTrigger>
            <SelectContent>
              {CREW_ROLES.filter((r) => !roles.includes(r)).map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="Another role"
            value={adding}
            maxLength={40}
            placeholder="Or type a role"
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole(adding))}
            className="h-9 w-40 rounded-full text-small"
          />
        </div>
      )}
    </section>
  );
}
