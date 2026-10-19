"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AtSign, Check, ChevronDown, Mail, UserPlus } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { motionTokens } from "@/components/arc/motion-tokens";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Assignees, adapted from Bencho's "Assignees" (MIT licence, bencho.dev/licence) for Nia's people
// fields (T5, Ika 2026-10-19): director, writers, crew. Type a name, @username or email; matching
// Nia profiles pop up (find_people) and picking one fills in their name, photo and role. People
// who aren't on Nia are added as typed. Changes from Bencho: real data instead of its four
// sample faces, a search box in the list, the names beside the faces (documents are printed and
// read, so the faces alone aren't enough there), Nia's springs (no overshoot, CLAUDE.md →
// Motion), and the list closes on an outside press, which Bencho's own note says a real
// interface wants back.

export type PersonRef = { name: string; userId?: string; username?: string; email?: string; avatarUrl?: string; role?: string };
export type PersonMatch = { id: string; full_name: string; username: string | null; avatar_url: string | null; profession: string | null };

/* the faces in the pill */
const FACE = 28;
/* how much of each face the next one covers, px */
const LAP = 10;

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
const same = (a: PersonRef, b: PersonRef) =>
  (a.userId && a.userId === b.userId) || (!a.userId && !b.userId && a.name.toLowerCase() === b.name.toLowerCase());
const fromMatch = (m: PersonMatch): PersonRef => ({
  name: m.full_name || (m.username ? `@${m.username}` : "Nia member"),
  userId: m.id,
  username: m.username ?? undefined,
  avatarUrl: m.avatar_url ?? undefined,
  role: m.profession ?? undefined,
});

function Face({ person, size = FACE }: { person: PersonRef; size?: number }) {
  return person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- small profile photos from Supabase Storage
    <img src={person.avatarUrl} alt="" draggable={false} style={{ width: size, height: size }} className="rounded-full object-cover ring-2 ring-background" />
  ) : (
    <span style={{ width: size, height: size }} className="flex items-center justify-center rounded-full bg-accent text-micro font-bold text-foreground ring-2 ring-background">
      {getInitials(person.name.replace(/^@/, ""), person.email ?? "")}
    </span>
  );
}

export function Assignees({
  id,
  label,
  value,
  onChange,
  search,
  single = false,
  compact = false,
}: {
  id?: string;
  label: string;
  value: PersonRef[];
  onChange: (next: PersonRef[]) => void;
  /** Looks people up as you type (Nia's find_people). */
  search: (q: string) => Promise<PersonMatch[]>;
  /** One person (e.g. Location manager): picking someone replaces them and closes the list. */
  single?: boolean;
  compact?: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<PersonMatch[]>([]);
  const seq = useRef(0);
  const face = compact ? 24 : FACE;

  // Look people up a moment after typing stops; only the newest answer counts.
  useEffect(() => {
    const q = query.trim();
    const run = ++seq.current;
    const timer = window.setTimeout(async () => {
      const found = q.length >= 2 ? await search(q).catch(() => []) : [];
      if (run === seq.current) setMatches(found);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, search]);

  const toggle = (person: PersonRef) => {
    const on = value.some((p) => same(p, person));
    if (single) {
      onChange(on ? [] : [person]);
      setOpen(false);
    } else onChange(on ? value.filter((p) => !same(p, person)) : [...value, person]);
    setQuery("");
  };

  const typed = query.trim();
  const typedIsEmail = isEmail(typed);
  const offerTyped =
    typed.length >= 2 &&
    !typed.startsWith("@") &&
    // An email that belongs to someone on Nia offers them, not the bare address.
    !(typedIsEmail && matches.length > 0) &&
    !matches.some((m) => m.full_name.toLowerCase() === typed.toLowerCase()) &&
    !value.some((p) => p.name.toLowerCase() === typed.toLowerCase() || p.email === typed);

  /* ── the width is COMPUTED, not measured ─────────────────
     A width worked out from the count is the same number at any zoom, and CSS can transition
     it without knowing where the block is. (Bencho.) */
  const rail = value.length ? face + (value.length - 1) * (face - LAP) : 0;
  const settle = reduced ? { duration: motionTokens.duration.instant } : motionTokens.spring.snappy;

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <PopoverTrigger
        id={id}
        aria-label={value.length ? `${label}: ${value.map((p) => p.name).join(", ")}` : `${label}: unassigned`}
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 text-sm font-medium text-foreground outline-none transition-colors duration-fast hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/70",
          !value.length && "pl-1.5",
        )}
      >
        {/* ── the faces ─────────────────────────────────────
            Absolutely placed inside a rail whose width is the arithmetic above. Reversed
            z-order: the first face sits on top of the second, so the stack reads left to
            right the way the list does. (Bencho.) */}
        <span className="relative shrink-0 transition-[width] duration-base ease-out" style={{ width: rail, height: face }}>
          <AnimatePresence initial={false}>
            {value.map((person, i) => (
              <motion.span
                key={person.userId ?? person.name}
                className="absolute top-0 left-0"
                style={{ zIndex: value.length - i }}
                /* ── a face lands, it does not fade in ──────
                   It drops from slightly above with a small turn on it, so adding somebody reads
                   as a token being put down. Nia's springs settle without going past rest. */
                initial={reduced ? { opacity: 0, x: i * (face - LAP) } : { scale: 0.4, opacity: 0, x: i * (face - LAP), y: -8, rotate: -14 }}
                animate={{ scale: 1, opacity: 1, x: i * (face - LAP), y: 0, rotate: 0 }}
                exit={reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0, y: -6, rotate: 10 }}
                transition={{ ...settle, opacity: { duration: motionTokens.duration.fast } }}
              >
                <Face person={person} size={face} />
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
        {/* The pill is the readout: who is on this. With nobody, it says so. */}
        <span className={cn("min-w-0 truncate", !value.length && "text-nia-placeholder")}>
          {value.length ? value.map((p) => p.name).join(", ") : "Unassigned"}
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground print:hidden" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-1.5">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the first match, or what was typed.
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (matches[0]) toggle(fromMatch(matches[0]));
            else if (offerTyped) toggle(typedIsEmail ? { name: typed, email: typed } : { name: typed });
          }}
          placeholder="Name, @username or email"
          aria-label={`Find someone for ${label.toLowerCase()}`}
          className="mb-1 h-9 w-full rounded-md border border-border bg-transparent px-2.5 text-sm outline-none placeholder:text-nia-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div role="listbox" aria-label={label} aria-multiselectable={!single} className="flex max-h-72 flex-col overflow-y-auto">
          {/* Who is on it already, then who matches, then "add as typed". */}
          {[...value.map((p) => ({ person: p, on: true })), ...matches.map(fromMatch).filter((p) => !value.some((v) => same(v, p))).map((p) => ({ person: p, on: false }))].map(({ person, on }, i) => (
            <motion.button
              key={`${person.userId ?? person.name}-${on}`}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => toggle(person)}
              /* they deal out under the card rather than arriving with it, 40ms apart (Bencho) */
              initial={reduced ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...motionTokens.spring.snappy, delay: reduced ? 0 : Math.min(i, 5) * 0.04 }}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <Face person={person} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{person.name}</span>
                <span className="block truncate text-caption text-muted-foreground">
                  {[person.role, person.username && `@${person.username}`, !person.userId && (person.email ? "Email" : "Not on Nia")].filter(Boolean).join(" · ")}
                </span>
              </span>
              {/* the box is always drawn; only the tick arrives (Bencho) */}
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border">
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={settle}>
                      <Check aria-hidden className="size-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          ))}
          {offerTyped && (
            <button
              type="button"
              onClick={() => toggle(typedIsEmail ? { name: typed, email: typed } : { name: typed })}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {typedIsEmail ? <Mail aria-hidden className="size-4" /> : <UserPlus aria-hidden className="size-4" />}
              </span>
              <span className="min-w-0 truncate">
                Add <strong className="font-semibold">{typed}</strong>
              </span>
            </button>
          )}
          {!typed && !value.length && (
            <p className="flex items-center gap-1.5 px-2 py-3 text-caption text-muted-foreground">
              <AtSign aria-hidden className="size-3.5" /> Type a name, @username or email.
            </p>
          )}
          {typed.length >= 2 && !matches.length && !offerTyped && <p className="px-2 py-3 text-caption text-muted-foreground">No one on Nia with that username.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
