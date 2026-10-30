'use client';

import { Slider } from '@/components/ui/slider';
import type { BudgetSection } from '../types';
import { formatMoney } from './format';
import { budgetTable, budgetTotals, type BudgetValue, type TableRow } from './sections';
import { TableView } from './table-view';

// The Production Budget (Figma 796:9836): Above the Line, Below the Line and Additional costs,
// each a table of Category, Description, Rate and Units with its Subtotal worked out, then a
// summary with every group, the contingency (a slider, 0 to 25%) and the grand total. Each
// group's share of the budget sits beside its heading once there are amounts.

export function BudgetView({ section, value, onChange, currency = 'USD' }: { section: BudgetSection; value: BudgetValue; onChange: (value: BudgetValue, key: string) => void; currency?: string }) {
  const totals = budgetTotals(section, value);
  const money = (amount: number) => formatMoney(amount, currency);
  const share = (amount: number) => (totals.total > 0 ? `${Math.round((amount / totals.total) * 100)}% of budget` : null);
  const setGroup = (gi: number, rows: TableRow[], key: string) => onChange({ ...value, groups: value.groups.map((g, i) => (i === gi ? rows : g)) }, `g${gi}:${key}`);
  const percent = Math.min(25, Math.round(totals.percent));

  return (
    <div className="flex flex-col gap-8">
      {section.groups.map((group, gi) => (
        <div key={group.label} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm leading-normal font-bold text-foreground">{group.label}</h3>
            {share(totals.groups[gi]) && <span className="text-small text-muted-foreground tabular-nums">{share(totals.groups[gi])}</span>}
          </div>
          <TableView section={budgetTable(section, gi)} rows={value.groups[gi] ?? []} onChange={(rows, key) => setGroup(gi, rows, key)} currency={currency} />
        </div>
      ))}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-nia-panel p-5 print:break-inside-avoid">
        <h3 className="text-sm leading-normal font-bold text-foreground">Budget summary</h3>
        <dl className="flex flex-col gap-2 text-sm leading-normal">
          {section.groups.map((group, gi) => (
            <div key={group.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{group.label}</dt>
              <dd className="font-medium text-foreground tabular-nums">{money(totals.groups[gi])}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:gap-4">
            <dt className="shrink-0 text-muted-foreground">
              <label id="budget-contingency">Contingency ({percent}%)</label>
            </dt>
            <dd className="flex flex-1 items-center gap-4">
              <Slider
                aria-labelledby="budget-contingency"
                min={0}
                max={25}
                step={1}
                value={[percent]}
                onValueChange={([next]) => onChange({ ...value, contingency: String(next) }, 'contingency')}
                className="max-w-60 print:hidden"
              />
              <span className="ml-auto font-medium text-foreground tabular-nums">{money(totals.contingency)}</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="font-bold text-foreground">Total budget</dt>
            <dd>
              <output aria-label="Total budget" className="text-lead font-bold text-foreground tabular-nums">
                {money(totals.total)}
              </output>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
