"use client";

import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { FilterChip } from "@/components/nia/filter-bar";
import { CREW_ROLES } from "@/lib/projects";
import { DEPARTMENTS, departmentFor, type DirectoryEntry } from "@/features/crew/directory";
import { addPerson, removeFromProject, updatePerson, type PersonForm } from "@/features/crew/mutations";
import type { ProductionStatus } from "@/components/nia/status-badge";

// Add person (Figma 967:31635, a pop-up) and Edit profile (967:31816, a drawer): one set of
// fields for the person (how to reach them, agent, union, bio, their usual week) and their role
// on this project (cast or crew, department, role, character, episodes or days, status, notes).

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUSES: { value: ProductionStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "on-hold", label: "On hold" },
  { value: "wrapped", label: "Wrapped" },
  { value: "cancelled", label: "Cancelled" },
];

const blank: PersonForm = {
  name: "",
  kind: "crew",
  department: "",
  role: "",
  character: "",
  episodes: "",
  status: "pending",
  email: "",
  phone: "",
  agent: "",
  union: "",
  bio: "",
  availability: [false, false, false, false, false, false, false],
  notes: "",
};

const fromEntry = (e: DirectoryEntry): PersonForm => ({
  name: e.name,
  kind: e.kind,
  department: e.department,
  role: e.role,
  character: e.character ?? "",
  episodes: e.episodes.join(", "),
  status: e.status ?? "pending",
  email: e.email ?? "",
  phone: e.phone ?? "",
  agent: e.agent ?? "",
  union: e.union ?? "",
  bio: e.bio ?? "",
  availability: e.availability ?? blank.availability,
  notes: e.notes ?? "",
});

/** Add someone (no `entry`) or edit them; `onDone` after a save or removal. */
export function PersonEditor({
  projectId,
  entry,
  open,
  onOpenChange,
  onDone,
}: {
  projectId: string;
  entry: DirectoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const body = <Fields key={entry?.id ?? "new"} projectId={projectId} entry={entry} onCancel={() => onOpenChange(false)} onDone={onDone} />;
  if (entry) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <div className="flex flex-col gap-1 p-6 pb-0">
            <SheetTitle className="text-h3 font-bold">Edit profile</SheetTitle>
            <SheetDescription>{entry.name}&rsquo;s details and their role on this project.</SheetDescription>
          </div>
          {body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <div className="flex flex-col gap-1 p-6 pb-0">
          <DialogTitle className="text-h3 font-bold">Add person</DialogTitle>
          <DialogDescription>Who they are on this project, and how to reach them.</DialogDescription>
        </div>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function Fields({ projectId, entry, onCancel, onDone }: { projectId: string; entry: DirectoryEntry | null; onCancel: () => void; onDone: () => void }) {
  const id = useId();
  const [f, setF] = useState<PersonForm>(entry ? fromEntry(entry) : blank);
  // The department follows the role until it's chosen by hand.
  const [departmentChosen, setDepartmentChosen] = useState(Boolean(entry));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PersonForm>(key: K, value: PersonForm[K]) => setF((was) => ({ ...was, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.role.trim()) return;
    setSaving(true);
    try {
      const form = { ...f, department: f.kind === "crew" ? f.department || departmentFor(f.role) : "" };
      if (entry?.personId) await updatePerson(projectId, entry.id, entry.personId, form);
      else await addPerson(projectId, form);
      toast.success(entry ? "Saved." : `${f.name.trim()} added.`);
      onDone();
    } catch {
      toast.error("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      await removeFromProject(projectId, entry.id);
      toast.success(`${entry.name} taken off this project.`);
      onDone();
    } catch {
      toast.error("Couldn't remove them. Try again.");
      setSaving(false);
    }
  };

  const field = (key: keyof PersonForm, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      <Input id={`${id}-${key}`} value={f[key] as string} onChange={(e) => set(key, e.target.value as never)} {...props} />
    </div>
  );

  return (
    <form onSubmit={save} className="flex flex-col gap-5 p-6">
      {field("name", "Name", { required: true, maxLength: 120, autoComplete: "off" })}

      <div role="group" aria-label="Cast or crew" className="flex gap-2">
        <FilterChip on={f.kind === "cast"} onClick={() => set("kind", "cast")}>Cast</FilterChip>
        <FilterChip on={f.kind === "crew"} onClick={() => set("kind", "crew")}>Crew</FilterChip>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-role`}>{f.kind === "cast" ? "Billing" : "Role"}</Label>
          <Input
            id={`${id}-role`}
            list={`${id}-roles`}
            required
            maxLength={80}
            placeholder={f.kind === "cast" ? "Lead, Supporting…" : "Director of Photography…"}
            value={f.role}
            onChange={(e) => {
              set("role", e.target.value);
              if (!departmentChosen) set("department", departmentFor(e.target.value));
            }}
          />
          <datalist id={`${id}-roles`}>
            {(f.kind === "cast" ? ["Lead", "Supporting", "Featured", "Talent", "Model"] : CREW_ROLES).map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
        {f.kind === "cast" ? (
          field("character", "Character", { maxLength: 120 })
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-department`}>Department</Label>
            <Select
              value={f.department || undefined}
              onValueChange={(v) => {
                set("department", v);
                setDepartmentChosen(true);
              }}
            >
              <SelectTrigger id={`${id}-department`}>
                <SelectValue placeholder="From the role" />
              </SelectTrigger>
              <SelectContent position="popper">
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("episodes", "Episodes or days", { placeholder: "All episodes, or Ep 1-5, Ep 10" })}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-status`}>Status</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v as ProductionStatus)}>
            <SelectTrigger id={`${id}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("email", "Email", { type: "email", maxLength: 254, autoComplete: "off" })}
        {field("phone", "Phone", { type: "tel", maxLength: 40, autoComplete: "off" })}
        {field("agent", "Agent", { maxLength: 160, placeholder: "Agency (agent's name)" })}
        {field("union", "Union", { maxLength: 80, placeholder: "SAG-AFTRA, Equity…" })}
      </div>

      <div role="group" aria-labelledby={`${id}-week`} className="flex flex-col gap-1.5">
        <span id={`${id}-week`} className="text-sm font-medium text-foreground">Usually available</span>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => (
            <FilterChip key={d} on={f.availability[i]} onClick={() => set("availability", f.availability.map((on, j) => (j === i ? !on : on)))} className="h-8 px-3">
              {d}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-bio`}>Biography</Label>
        <Textarea id={`${id}-bio`} rows={3} maxLength={2000} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-notes`}>Production notes</Label>
        <Textarea id={`${id}-notes`} rows={3} maxLength={2000} placeholder="Early make-up call on the 12th, wardrobe fitting approved…" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" disabled={saving || !f.name.trim() || !f.role.trim()}>
          {saving ? "Saving…" : entry ? "Save" : "Add person"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {entry && (
          <Button type="button" variant="ghost" onClick={remove} disabled={saving} className="ml-auto text-nia-danger hover:text-nia-danger">
            Remove from project
          </Button>
        )}
      </div>
    </form>
  );
}
