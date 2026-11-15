"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonPicture } from "@/components/nia/cast-crew-row";
import { CREW_ROLES } from "@/lib/projects";
import { parsePeople, type QuickPerson } from "@/features/crew/directory";
import { quickAdd, type PersonForm } from "@/features/crew/mutations";

// Adding people in a line (Ika, 2026-11-15: "adding each crew member with full details each time may
// be time consuming and some of those details may not yet be confirmed … just add name, role,
// profile picture as a start and or add by @ / email for existing users and pre-filling"). Type a
// name, @username or email: people already in the workspace come first (with what they did last
// time), then people on Nia (their photo and name come from their account). A role, Add, and the
// next one; or paste a list. Everyone starts Pending; the rest of their details come later, in
// Edit profile. More details opens the full form for anyone who wants it now.

type Match =
  | { from: "workspace"; personId: string; name: string; photo: string | null; role: string | null; email: string | null; onProject: boolean }
  | { from: "nia"; userId: string; name: string; username: string | null; photo: string | null; role: string | null };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = [...new Set([...CREW_ROLES, "Lead", "Supporting", "Featured", "Talent", "Model"])];

export function QuickAddPeople({
  projectId,
  onProject,
  onMoreDetails,
  onClose,
}: {
  projectId: string;
  /** People (directory ids) already on this project, so they show as such. */
  onProject: string[];
  onMoreDetails: (start: Partial<PersonForm>) => void;
  onClose: () => void;
}) {
  const id = useId();
  const router = useRouter();
  const whoRef = useRef<HTMLInputElement>(null);
  const [who, setWho] = useState("");
  const [picked, setPicked] = useState<Match | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [found, setFound] = useState<Match[]>([]);
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(-1);
  const [pasting, setPasting] = useState(false);
  const [list, setList] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string[]>([]);

  const email = !picked && EMAIL.test(who.trim()) ? who.trim() : "";
  const personName = picked ? picked.name : email ? name.trim() : who.trim();
  const ready = Boolean(personName && role.trim()) && !(picked?.from === "workspace" && picked.onProject);
  // Suggestions only while in the Who field (two letters or more) and nobody is picked; a search
  // that finishes after you've moved on stays hidden.
  const matches = picked || !typing || who.trim().length < 2 ? [] : found;
  const open = matches.length > 0;

  // Suggestions as you type: your workspace's directory, then Nia accounts (find_people: @username,
  // an exact email, or a name among people you work with).
  const workspace = useRef<string | null>(null);
  useEffect(() => {
    const q = who.trim();
    if (picked || q.length < 2) return;
    let stale = false;
    const t = setTimeout(async () => {
      const db = createClient();
      if (!workspace.current) {
        const { data } = await db.from("projects").select("workspace_id").eq("id", projectId).single();
        workspace.current = (data?.workspace_id as string) ?? null;
      }
      const term = q.replace(/[%,()*\\]/g, "");
      const [own, nia] = await Promise.all([
        workspace.current && !q.startsWith("@") && term
          ? db
              .from("people")
              .select("id, name, email, user_id, photo_url, cast_crew(role, created_at, deleted_at)")
              .eq("workspace_id", workspace.current)
              .is("deleted_at", null)
              .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
              .limit(5)
          : Promise.resolve({ data: [] }),
        db.rpc("find_people", { q }),
      ]);
      if (stale) return;
      type Row = { id: string; name: string; email: string | null; user_id: string | null; photo_url: string | null; cast_crew: { role: string; created_at: string; deleted_at: string | null }[] };
      const mine: Match[] = ((own.data ?? []) as Row[]).map((p) => {
        const last = p.cast_crew.filter((r) => !r.deleted_at).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return { from: "workspace", personId: p.id, name: p.name, photo: p.photo_url, role: last?.role ?? null, email: p.email, onProject: onProject.includes(p.id) };
      });
      const linked = new Set(((own.data ?? []) as Row[]).flatMap((p) => (p.user_id ? [p.user_id] : [])));
      type Profile = { id: string; full_name: string | null; username: string | null; avatar_url: string | null; profession: string | null };
      const onNia: Match[] = ((nia.data ?? []) as Profile[])
        .filter((p) => !linked.has(p.id) && (p.full_name || p.username))
        .map((p) => ({ from: "nia", userId: p.id, name: p.full_name || p.username || "", username: p.username, photo: p.avatar_url, role: p.profession }));
      setFound([...mine, ...onNia].slice(0, 8));
      setActive(-1);
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [who, picked, projectId, onProject]);

  const pick = (m: Match) => {
    setPicked(m);
    setFound([]);
    if (!role.trim() && m.role) setRole(m.role);
    requestAnimationFrame(() => document.getElementById(`${id}-role`)?.focus());
  };

  const clear = () => {
    setWho("");
    setPicked(null);
    setName("");
    setRole("");
    setFound([]);
    requestAnimationFrame(() => whoRef.current?.focus());
  };

  const run = async (people: QuickPerson[]) => {
    setBusy(true);
    try {
      const { added: n, already } = await quickAdd(projectId, people);
      if (n) {
        setAdded((was) => [...was, ...people.filter((p) => !already.includes(p.name.trim())).map((p) => p.name.trim())]);
        router.refresh();
      }
      if (already.length) toast(`Already on this project: ${already.join(", ")}.`);
      else if (n > 1) toast.success(`${n} people added.`);
      return true;
    } catch {
      // Kept as typed, to try again.
      toast.error("Couldn't add them. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    const person: QuickPerson = {
      name: personName,
      role: role.trim(),
      email: picked?.from === "workspace" ? null : email || null,
      userId: picked?.from === "nia" ? picked.userId : null,
      personId: picked?.from === "workspace" ? picked.personId : null,
    };
    if (await run([person])) clear();
  };

  const people = parsePeople(list);
  const addList = async () => {
    if (!people.length || busy) return;
    if (await run(people)) {
      setList("");
      setPasting(false);
    }
  };

  const keys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const by = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + by + matches.length) % matches.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      // Closes the suggestions, not the pop-up.
      e.preventDefault();
      e.stopPropagation();
      setFound([]);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {pasting ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-list`}>One person per line: name, role</Label>
          <Textarea
            id={`${id}-list`}
            rows={7}
            autoFocus
            maxLength={10000}
            placeholder={"Thandi Mokoena, Director of Photography\nSipho Dube, Gaffer\nLerato Khumalo, Make-up Artist"}
            value={list}
            onChange={(e) => setList(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" onClick={addList} disabled={busy || !people.length}>
              {busy ? "Adding…" : people.length ? `Add ${people.length} ${people.length === 1 ? "person" : "people"}` : "Add people"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPasting(false)} disabled={busy}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={addOne} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="relative flex flex-col gap-1.5">
              <Label htmlFor={`${id}-who`}>Who</Label>
              {picked ? (
                <div className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-secondary py-1 pr-1.5 pl-1.5">
                  <PersonPicture name={picked.name} photo={picked.photo} className="size-8 [&_span]:text-micro" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-semibold text-foreground">{picked.name}</span>
                    <span className="truncate text-caption text-muted-foreground">
                      {picked.from === "nia" ? (picked.username ? `@${picked.username} on Nia` : "On Nia") : picked.onProject ? "Already on this project" : "In your workspace"}
                    </span>
                  </span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Not ${picked.name}`} onClick={clear}>
                    <X aria-hidden />
                  </Button>
                </div>
              ) : (
                <Input
                  ref={whoRef}
                  id={`${id}-who`}
                  autoFocus
                  autoComplete="off"
                  maxLength={254}
                  placeholder="Name, @username or email"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={open}
                  aria-controls={`${id}-matches`}
                  aria-activedescendant={open && active >= 0 ? `${id}-match-${active}` : undefined}
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  onKeyDown={keys}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                />
              )}
              {open && (
                <ul id={`${id}-matches`} role="listbox" aria-label="People" className="absolute top-full right-0 left-0 z-10 mt-1 flex max-h-72 flex-col overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-elevation-2">
                  {matches.map((m, i) => (
                    <li
                      key={m.from === "nia" ? m.userId : m.personId}
                      id={`${id}-match-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(m)}
                      className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5", i === active ? "bg-muted" : "hover:bg-muted")}
                    >
                      <PersonPicture name={m.name} photo={m.photo} className="size-8 [&_span]:text-micro" />
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-sm font-semibold text-foreground">{m.name}</span>
                        <span className="truncate text-caption text-muted-foreground">
                          {m.from === "workspace"
                            ? m.onProject
                              ? "Already on this project"
                              : [m.role, "your workspace"].filter(Boolean).join(" · ")
                            : [m.username && `@${m.username}`, m.role, "Nia"].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-role`}>Role</Label>
              <Input id={`${id}-role`} list={`${id}-roles`} maxLength={80} placeholder="Gaffer, Lead…" value={role} onChange={(e) => setRole(e.target.value)} />
              <datalist id={`${id}-roles`}>
                {ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {email && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-name`}>Their name</Label>
              <Input id={`${id}-name`} maxLength={120} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy || !ready}>
              {busy ? "Adding…" : "Add"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPasting(true)} disabled={busy}>
              Paste a list
            </Button>
            {picked?.from !== "workspace" && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => onMoreDetails({ name: personName, role: role.trim(), email, userId: picked?.from === "nia" ? picked.userId : null })}
              >
                More details
              </Button>
            )}
          </div>
        </form>
      )}

      {added.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p aria-live="polite" className="min-w-0 text-small text-muted-foreground">
            Added: {added.join(", ")}
          </p>
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
