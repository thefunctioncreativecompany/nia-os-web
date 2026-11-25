"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, Flag, GripVertical, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/projects";
import { sentenceCase } from "@/lib/sentence-case";
import { DEPARTMENTS } from "@/features/crew/directory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipMenu, ChipRow } from "@/components/nia/filter-bar";
import { CARD_DRAG_TYPE } from "@/components/nia/drag-reorder";
import { MilestoneAddLine } from "./milestone-add-line";
import { DuePicker, Face, GROUP_LABEL, PRIORITIES, dueLabel, groupOf, openOrder, type CrewPerson, type Group, type Item, type Priority } from "./milestones-shared";

// The full view of a project's Key milestones (PR2, Ika 2026-11-24: "assignee next to the date …
// department, priority and stage in a full-screen view; drag to reorder"), from View all on the
// Overview. Grouped by when it's due (Overdue, This week, Later, No date), filtered by who, stage and
// department; a row opens its details beside the list (on phones, in place of it), saved as they
// change. Drag a row by its handle within its group, or Move up / down in its details.

const ROW = "grid items-center gap-x-3 grid-cols-[1.25rem_minmax(0,1fr)_auto] md:grid-cols-[1rem_1.25rem_minmax(0,1fr)_9rem_8.5rem_7.5rem_5rem_5.5rem]";
const PRIORITY_DOT: Record<Priority, string> = { high: "bg-foreground", medium: "bg-ring", low: "border border-ring" };
const NONE = "none";

export function MilestonesFull({
  open,
  onOpenChange,
  projectTitle,
  projectId,
  items,
  crew,
  detailed,
  canEdit,
  today,
  onAdded,
  onChange,
  onRemove,
  onReorder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle?: string;
  projectId: string;
  items: Item[];
  crew: CrewPerson[] | null;
  detailed: boolean;
  canEdit: boolean;
  today: string;
  onAdded: (item: Item) => void;
  onChange: (item: Item, patch: Partial<Item>) => void;
  onRemove: (item: Item) => void;
  /** New places for the items of one group, in order. */
  onReorder: (ids: string[]) => void;
}) {
  const [who, setWho] = useState("all");
  const [stage, setStage] = useState("all");
  const [department, setDepartment] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const person = (id?: string | null) => (id ? (crew?.find((p) => p.id === id) ?? null) : null);
  const kept = (i: Item) =>
    (who === "all" || (who === NONE ? !i.assignee_id : i.assignee_id === who)) && (stage === "all" || i.stage === stage) && (department === "all" || i.department === department);
  const openItems = items.filter((i) => !i.done_at && kept(i)).toSorted(openOrder(today));
  const doneItems = items.filter((i) => i.done_at && kept(i)).toSorted((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  const groups = (["overdue", "week", "later", "none"] as Group[]).map((g) => ({ g, list: openItems.filter((i) => groupOf(i, today) === g) })).filter((x) => x.list.length);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const reorder = (fromId: string, toId: string) => {
    const from = items.find((i) => i.id === fromId);
    const to = items.find((i) => i.id === toId);
    if (!from || !to || from.done_at || groupOf(from, today) !== groupOf(to, today)) return;
    const list = openItems.filter((i) => groupOf(i, today) === groupOf(to, today)).map((i) => i.id);
    const a = list.indexOf(fromId);
    const b = list.indexOf(toId);
    if (a < 0 || b < 0 || a === b) return;
    list.splice(b, 0, list.splice(a, 1)[0]);
    onReorder(list);
  };
  const neighbour = (item: Item, by: -1 | 1) => {
    const list = openItems.filter((i) => groupOf(i, today) === groupOf(item, today));
    return list[list.findIndex((i) => i.id === item.id) + by] ?? null;
  };

  const row = (item: Item, draggable: boolean) => {
    const done = !!item.done_at;
    const overdue = !done && !!item.due_on && item.due_on < today;
    const p = person(item.assignee_id);
    return (
      <li
        key={item.id}
        className={cn(ROW, "group/row relative min-h-13 border-b border-secondary py-2 pr-2 last:border-b-0", selectedId === item.id && "bg-muted", dragging === item.id && "opacity-40", over === item.id && dragging !== item.id && "border-t-2 border-t-nia-blue")}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.setData(CARD_DRAG_TYPE, item.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(item.id);
        }}
        onDragEnd={() => {
          setDragging(null);
          setOver(null);
        }}
        onDragOver={(e) => {
          if (!dragging || ![...e.dataTransfer.types].includes(CARD_DRAG_TYPE)) return;
          e.preventDefault();
          setOver(item.id);
        }}
        onDrop={(e) => {
          const id = e.dataTransfer.getData(CARD_DRAG_TYPE);
          setOver(null);
          if (id) reorder(id, item.id);
        }}
      >
        <span aria-hidden className={cn("hidden cursor-grab text-nia-placeholder md:block", !draggable && "invisible")}>
          <GripVertical className="size-4" />
        </span>
        <Checkbox
          aria-label={done ? `${item.title}: done. Mark not done` : `Mark ${item.title} done`}
          checked={done}
          disabled={!canEdit}
          onCheckedChange={(on) => onChange(item, { done_at: on === true ? new Date().toISOString() : null })}
        />
        <button type="button" onClick={() => setSelectedId(item.id)} className="flex min-w-0 flex-col items-start rounded-md px-1 py-0.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className={cn("flex max-w-full items-center gap-1.5 text-sm", done ? "text-muted-foreground line-through" : item.kind === "milestone" ? "font-semibold text-foreground" : "font-medium text-foreground")}>
            {item.kind === "milestone" && (
              <span title="Milestone" className="shrink-0 text-nia-blue">
                <Flag aria-hidden className="size-3.5" />
                <span className="sr-only">Milestone:</span>
              </span>
            )}
            <span className="truncate">{item.title}</span>
          </span>
          {item.notes && <span className="max-w-full truncate text-caption text-muted-foreground">{item.notes}</span>}
        </button>
        <span className="hidden min-w-0 items-center gap-2 md:flex">
          {p ? (
            <>
              <Face person={p} />
              <span className="truncate text-small font-medium text-foreground">{p.name}</span>
            </>
          ) : (
            <span className="text-small text-nia-placeholder">Unassigned</span>
          )}
        </span>
        <span className="hidden truncate text-small text-muted-foreground md:block">{item.department ?? ""}</span>
        <span className="hidden truncate text-small text-muted-foreground md:block">{item.stage ? sentenceCase(item.stage) : ""}</span>
        <span className="hidden items-center gap-1.5 text-small font-medium text-foreground md:flex">
          {item.priority && (
            <>
              <span aria-hidden className={cn("size-2 rounded-full", PRIORITY_DOT[item.priority])} />
              {PRIORITIES.find((x) => x.value === item.priority)?.label}
            </>
          )}
        </span>
        <span className={cn("text-right text-small tabular-nums", overdue ? "font-semibold text-nia-danger" : "text-muted-foreground")}>{item.due_on ? dueLabel(item.due_on, today) : "—"}</span>
      </li>
    );
  };

  const filtering = detailed && (crew?.length || items.some((i) => i.stage || i.department));
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedId(null);
        onOpenChange(o);
      }}
    >
      <DialogContent showCloseButton={false} className="flex h-[min(94svh,64rem)] max-w-[min(96vw,96rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,96rem)] lg:flex-row">
        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", selected && "hidden lg:flex")}>
          <div className="flex items-start justify-between gap-4 px-4 pt-6 md:px-page">
            <div className="flex min-w-0 flex-col gap-0.5">
              {projectTitle && <span className="truncate text-small font-medium text-muted-foreground">{projectTitle}</span>}
              <DialogTitle className="text-h2 font-semibold tracking-tight text-foreground">Key milestones</DialogTitle>
              <DialogDescription className="sr-only">Every milestone and action on this project, by when it&apos;s due.</DialogDescription>
            </div>
            <Button variant="secondary" size="icon" aria-label="Close" onClick={() => onOpenChange(false)}>
              <X />
            </Button>
          </div>
          <div className="flex flex-col gap-3 px-4 pt-5 pb-3 md:px-page">
            {canEdit && <MilestoneAddLine projectId={projectId} crew={crew} detailed={detailed} onAdded={onAdded} onChange={onChange} />}
            {filtering && (
              <ChipRow aria-label="Filters">
                <ChipMenu
                  label="Assignee:"
                  value={who}
                  defaultValue="all"
                  onChange={setWho}
                  options={[{ value: "all", label: "Everyone" }, ...(crew ?? []).map((p) => ({ value: p.id, label: p.name })), { value: NONE, label: "Unassigned" }]}
                />
                <ChipMenu label="Stage:" value={stage} defaultValue="all" onChange={setStage} options={[{ value: "all", label: "All" }, ...STAGES.map((s) => ({ value: s, label: sentenceCase(s) }))]} />
                <ChipMenu label="Department:" value={department} defaultValue="all" onChange={setDepartment} options={[{ value: "all", label: "All" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
              </ChipRow>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-page">
            <div className={cn(ROW, "sticky top-0 z-10 hidden border-b border-border bg-background py-2 pr-2 text-caption font-medium text-muted-foreground md:grid")}>
              <span />
              <span />
              <span className="px-1">Item</span>
              <span>Assignee</span>
              <span>Department</span>
              <span>Stage</span>
              <span>Priority</span>
              <span className="text-right">Date</span>
            </div>
            {groups.length === 0 && doneItems.length === 0 && <p className="py-6 text-sm text-muted-foreground">{items.length ? "Nothing matches these filters." : "No milestones yet."}</p>}
            {groups.map(({ g, list }) => (
              <section key={g} aria-label={GROUP_LABEL[g]} className="pt-4">
                <h3 className={cn("pb-1 text-small font-semibold", g === "overdue" ? "text-nia-danger" : "text-muted-foreground")}>
                  {GROUP_LABEL[g]} · {list.length}
                </h3>
                <ul className="flex flex-col">{list.map((item) => row(item, canEdit))}</ul>
              </section>
            ))}
            {doneItems.length > 0 && (
              <div className="pt-4">
                <button
                  type="button"
                  aria-expanded={showDone}
                  onClick={() => setShowDone((s) => !s)}
                  className="flex w-fit items-center gap-1 rounded-full py-1 text-small font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-fast", !showDone && "-rotate-90")} />
                  Done · {doneItems.length}
                </button>
                {showDone && <ul className="flex flex-col">{doneItems.map((item) => row(item, false))}</ul>}
              </div>
            )}
          </div>
        </div>
        {selected && (
          <Details
            key={selected.id}
            item={selected}
            crew={crew}
            detailed={detailed}
            canEdit={canEdit}
            today={today}
            earlier={!selected.done_at ? neighbour(selected, -1) : null}
            later={!selected.done_at ? neighbour(selected, 1) : null}
            onChange={(patch) => onChange(selected, patch)}
            onMove={(to) => reorder(selected.id, to.id)}
            onRemove={() => {
              setSelectedId(null);
              onRemove(selected);
            }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** One item's details beside the list: everything about it, saved as it changes. */
function Details({
  item,
  crew,
  detailed,
  canEdit,
  today,
  earlier,
  later,
  onChange,
  onMove,
  onRemove,
  onClose,
}: {
  item: Item;
  crew: CrewPerson[] | null;
  detailed: boolean;
  canEdit: boolean;
  today: string;
  earlier: Item | null;
  later: Item | null;
  onChange: (patch: Partial<Item>) => void;
  onMove: (to: Item) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const label = "text-small font-bold text-muted-foreground";
  const p = item.assignee_id ? crew?.find((c) => c.id === item.assignee_id) : null;
  const saveTitle = () => {
    const next = title.trim().slice(0, 300);
    if (!next) return setTitle(item.title);
    if (next !== item.title) onChange({ title: next });
  };
  const readOnly = (value: string | null | undefined) => <span className="text-sm text-foreground">{value || "—"}</span>;

  return (
    <aside aria-label="Details" className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto border-border p-6 lg:w-96 lg:shrink-0 lg:border-l">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="compact" className="lg:invisible" onClick={onClose}>
          <ChevronLeft aria-hidden /> All milestones
        </Button>
        <Button variant="secondary" size="icon-sm" aria-label="Close details" className="hidden lg:inline-flex" onClick={onClose}>
          <X />
        </Button>
      </div>
      {canEdit ? (
        <textarea
          aria-label="Words"
          value={title}
          rows={2}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="resize-none rounded-md bg-transparent text-subtitle font-semibold text-foreground outline-none hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ) : (
        <p className="text-subtitle font-semibold break-words text-foreground">{item.title}</p>
      )}

      {canEdit && (
        <div role="radiogroup" aria-label="Kind" className="flex w-fit rounded-full bg-muted p-0.5">
          {(["action", "milestone"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={item.kind === k}
              onClick={() => onChange({ kind: k })}
              className={cn("inline-flex h-7 items-center gap-1 rounded-full px-3 text-small font-semibold text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50", item.kind === k && "bg-background text-foreground shadow-xs")}
            >
              {k === "milestone" && <Flag aria-hidden className="size-3.5" />}
              {k === "action" ? "Action" : "Milestone"}
            </button>
          ))}
        </div>
      )}

      {detailed && (
        <div className="flex flex-col gap-2">
          <span id="milestone-assignee" className={label}>
            Assignee
          </span>
          {canEdit ? (
            crew && crew.length === 0 ? (
              <span className="text-small text-muted-foreground">Add cast &amp; crew to this project to assign people.</span>
            ) : (
              <Select
                value={item.assignee_id ?? NONE}
                onValueChange={(v) => {
                  const next = v === NONE ? null : v;
                  const who = crew?.find((c) => c.id === next);
                  // Assigning fills in their department when it's empty.
                  onChange({ assignee_id: next, ...(who?.department && !item.department ? { department: who.department } : {}) });
                }}
              >
                <SelectTrigger aria-labelledby="milestone-assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {(crew ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : p ? (
            <span className="flex items-center gap-2 text-sm text-foreground">
              <Face person={p} /> {p.name}
            </span>
          ) : (
            readOnly("Unassigned")
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className={label}>Date</span>
        {canEdit ? (
          <span className="-ml-2.5">
            <DuePicker value={item.due_on ?? ""} onChange={(next) => onChange({ due_on: next || null })} label="Date" today={today} overdue={!item.done_at && !!item.due_on && item.due_on < today} />
          </span>
        ) : (
          readOnly(item.due_on ? dueLabel(item.due_on, today) : null)
        )}
      </div>

      {detailed && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["Stage", "stage", STAGES.map((s) => ({ value: s, label: sentenceCase(s) }))],
                ["Department", "department", DEPARTMENTS.map((d) => ({ value: d, label: d }))],
              ] as const
            ).map(([name, key, options]) => (
              <div key={key} className="flex min-w-0 flex-col gap-2">
                <span id={`milestone-${key}`} className={label}>
                  {name}
                </span>
                {canEdit ? (
                  <Select value={item[key] ?? NONE} onValueChange={(v) => onChange({ [key]: v === NONE ? null : v })}>
                    <SelectTrigger aria-labelledby={`milestone-${key}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  readOnly(key === "stage" && item.stage ? sentenceCase(item.stage) : item[key])
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span id="milestone-priority" className={label}>
              Priority
            </span>
            {canEdit ? (
              <div role="radiogroup" aria-labelledby="milestone-priority" className="grid grid-cols-3 rounded-full bg-muted p-0.5">
                {PRIORITIES.map((x) => (
                  <button
                    key={x.value}
                    type="button"
                    role="radio"
                    aria-checked={item.priority === x.value}
                    // Choosing it again clears it.
                    onClick={() => onChange({ priority: item.priority === x.value ? null : x.value })}
                    className={cn("h-8 rounded-full text-small font-semibold text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50", item.priority === x.value && "bg-background text-foreground shadow-xs")}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            ) : (
              readOnly(PRIORITIES.find((x) => x.value === item.priority)?.label)
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="milestone-notes" className={label}>
              Notes
            </label>
            {canEdit ? (
              <Textarea
                id="milestone-notes"
                defaultValue={item.notes ?? ""}
                rows={4}
                maxLength={2000}
                placeholder="More detail"
                onBlur={(e) => {
                  const next = e.target.value.trim().slice(0, 2000) || null;
                  if (next !== (item.notes ?? null)) onChange({ notes: next });
                }}
                className="resize-none"
              />
            ) : (
              <p className="text-sm whitespace-pre-line text-foreground">{item.notes || "—"}</p>
            )}
          </div>
        </>
      )}

      {canEdit && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button variant="secondary" size="compact" onClick={() => onChange({ done_at: item.done_at ? null : new Date().toISOString() })}>
            {item.done_at ? "Mark not done" : "Mark done"}
          </Button>
          <Button variant="ghost" size="compact" disabled={!earlier} onClick={() => earlier && onMove(earlier)}>
            Move up
          </Button>
          <Button variant="ghost" size="compact" disabled={!later} onClick={() => later && onMove(later)}>
            Move down
          </Button>
          <Button variant="ghost" size="compact" className="ml-auto text-muted-foreground" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </aside>
  );
}
