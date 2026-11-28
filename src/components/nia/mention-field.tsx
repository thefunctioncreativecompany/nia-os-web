"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MentionPerson } from "@/components/nia/rich-text-editor";

// A plain text box (a document's answers) where typing @ suggests the people on the project and a
// pick writes their @username (2026-11-28). Documents stay plain text, so an @username reads the
// same in the PDF and Word downloads; the database tells that person when the document saves
// (20261130000000_mentions_notes_documents.sql). Only people with a username are offered; anyone
// can still be mentioned by typing @ and their exact email. Arrows pick, Enter or Tab chooses,
// Escape closes the list.

const TYPED = /(?:^|[\s(,;])@([A-Za-z0-9._]{0,30})$/;

type Props = { value: string; onChange: (next: string) => void; find: (query: string) => Promise<MentionPerson[]>; multiline?: boolean } & Omit<
  ComponentProps<"input"> & ComponentProps<"textarea">,
  "value" | "onChange"
>;

export function MentionField({ value, onChange, find, multiline = false, className, onKeyDown, onBlur, ...rest }: Props) {
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [people, setPeople] = useState<MentionPerson[]>([]);
  const [pick, setPick] = useState(0);

  // Who matches what's typed after the @ (people with a username only).
  useEffect(() => {
    if (query === null) return;
    let live = true;
    void find(query).then((found) => {
      if (!live) return;
      setPeople(found.filter((p) => p.username).slice(0, 6));
      setPick(0);
    });
    return () => {
      live = false;
    };
  }, [query, find]);

  const look = (text: string, caret: number | null) => {
    const typed = TYPED.exec(text.slice(0, caret ?? text.length));
    setQuery(typed ? typed[1] : null);
  };

  const choose = (person: MentionPerson) => {
    const el = field.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@[A-Za-z0-9._]{0,30}$/, `@${person.username} `);
    const next = before + value.slice(caret);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  const open = query !== null && people.length > 0;
  const shared = {
    ...rest,
    ref: field,
    value,
    className,
    "aria-autocomplete": "list" as const,
    "aria-expanded": open,
    onChange: (e: { target: { value: string; selectionStart: number | null } }) => {
      onChange(e.target.value);
      look(e.target.value, e.target.selectionStart);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      if (open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setPick((p) => (p + (e.key === "ArrowDown" ? 1 : people.length - 1)) % people.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          choose(people[pick]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setQuery(null);
          return;
        }
      }
      onKeyDown?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setQuery(null);
      onBlur?.(e);
    },
  };

  return (
    <div className="relative w-full min-w-0">
      {multiline ? <Textarea {...shared} /> : <Input {...shared} />}
      {open && (
        <div role="listbox" aria-label="People to mention" className="absolute top-full left-0 z-50 mt-1 flex w-64 flex-col gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-elevation-2">
          {people.map((person, i) => (
            <button
              key={person.id}
              type="button"
              role="option"
              aria-selected={i === pick}
              // Keeps the text box focused while choosing.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setPick(i)}
              onClick={() => choose(person)}
              className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-small outline-none", i === pick && "bg-muted")}
            >
              <Avatar className="size-6">
                {person.avatar && <AvatarImage src={person.avatar} alt="" />}
                <AvatarFallback className="text-meta">{getInitials(person.name, "")}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{person.name}</span>
              <span className="truncate text-caption text-muted-foreground">@{person.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
