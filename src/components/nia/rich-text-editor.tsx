"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps } from "@tiptap/suggestion";
import { Bold, Heading3, Italic, Link2, List, ListOrdered } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Formatting as you type (Ika, 2026-11-15: bold, italics, bullets, numbering, links "wherever
// there's text inputs"; she chose formatting that shows while typing). Loaded only when someone
// starts editing (next/dynamic), so pages that just show text stay light. Saves Markdown, the part
// rich-text.tsx shows: paragraphs, bold, italic, bullet and numbered lists, links. The toolbar
// keeps focus in the text, so using it doesn't count as leaving; the link goes in a line inside.
// Keys: ⌘B, ⌘I, ⌘K (link), "- " or "1. " starts a list, Tab nests it, Escape cancels, ⌘Enter saves.
// `document` (meeting notes, Ika 2026-11-19): always open for typing, like a document, with section
// headings ("### ") when `headings` is on; the owner saves as it changes.
// `mentions` (project comments, 2026-11-28): typing @ suggests people (by name, @username or exact
// email) and a pick becomes "@Ama Owusu", saved as [@ id="…" label="Ama Owusu"] (rich-text.tsx shows
// it; the database tells that person, 20261129000000_mentions.sql). Arrows pick, Enter or Tab
// chooses, Escape closes the list only.

export type MentionPerson = { id: string; name: string; username?: string | null; avatar?: string | null };
type Suggest = { items: MentionPerson[]; query: string; at: { left: number; top: number }; choose: (p: MentionPerson) => void };

const SAFE = /^(https?:\/\/|mailto:)/i;

export function RichTextEditor({
  value,
  label,
  placeholder,
  onChange,
  onDone,
  className,
  variant = "inline",
  autoFocus = false,
  onSubmit,
  onCancel,
  maxLength,
  headings = false,
  mentions,
}: {
  value: string;
  label: string;
  placeholder?: string;
  onChange: (markdown: string) => void;
  /** Leaving the text (save) or Escape (cancel). Inline only. */
  onDone?: (save: boolean) => void;
  className?: string;
  /** `inline`: click-to-edit text (focused, saves on leaving, Escape cancels). `field`: a form's box.
   * `comment`: a field with an underline (comments). */
  variant?: "inline" | "field" | "comment" | "document";
  /** Fields: start focused. */
  autoFocus?: boolean;
  /** Fields: ⌘Enter (a comment's Send). */
  onSubmit?: () => void;
  /** Fields: Escape (a comment's Cancel); without it Escape is left to the page (a dialog closes). */
  onCancel?: () => void;
  /** Longest it may be, formatting included; typing past it is undone. */
  maxLength?: number;
  /** Section headings ("### "), with a button in the toolbar. */
  headings?: boolean;
  /** People who can be @mentioned, for what's typed after the @. Off without it. */
  mentions?: (query: string) => Promise<MentionPerson[]>;
}) {
  const inline = variant === "inline";
  const wrapper = useRef<HTMLDivElement>(null);
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  // The latest handlers, for the editor's keys (set up once, when it's made).
  const keys = useRef({ done: onDone ?? (() => {}), link: () => {}, submit: onSubmit, cancel: onCancel });
  // The @ list: what it shows, and which row is picked (a ref too, for the editor's keys).
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [pick, setPick] = useState(0);
  const listRef = useRef<ListState>({ open: false, pick: 0, suggest: null });
  const findPeople = useRef(mentions);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: inline || autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: headings ? { levels: [3] } : false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", isAllowedUri: (url) => SAFE.test(url) },
      }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      // eslint-disable-next-line react-hooks/refs -- the refs are read only as someone types, never while drawing
      ...(mentions ? [mentionExtension({ wrapper, listRef, findPeople, setSuggest, setPick })] : []),
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: cn("rich-text-editor outline-none flex flex-col gap-2 [&_h3]:pt-2 [&_h3]:text-lead [&_h3]:font-semibold [&_h3:first-child]:pt-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li_p]:my-0 [&_a]:underline [&_a]:underline-offset-2", variant === "comment" ? "min-h-6" : "min-h-16"),
      },
      handleKeyDown: (_view, event) => {
        // While the @ list is open, its keys are its own.
        if (listRef.current.open && ["Escape", "Enter", "Tab", "ArrowUp", "ArrowDown"].includes(event.key) && !event.metaKey && !event.ctrlKey) return false;
        if (event.key === "Escape") {
          if (inline) keys.current.done(false);
          else if (keys.current.cancel) keys.current.cancel();
          else return false;
          return true;
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          if (inline) keys.current.done(true);
          else if (keys.current.submit) keys.current.submit();
          else return false;
          return true;
        }
        if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
          keys.current.link();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const markdown = e.getMarkdown();
      // Past the limit: the last change is undone.
      if (maxLength && markdown.length > maxLength) {
        e.commands.undo();
        return;
      }
      onChange(markdown);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      heading: !!e?.isActive("heading"),
      bold: !!e?.isActive("bold"),
      italic: !!e?.isActive("italic"),
      bullets: !!e?.isActive("bulletList"),
      numbers: !!e?.isActive("orderedList"),
      link: !!e?.isActive("link"),
    }),
  });

  const openLink = () => {
    if (!editor) return;
    setHref((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinking(true);
  };
  useEffect(() => {
    keys.current = { done: onDone ?? (() => {}), link: openLink, submit: onSubmit, cancel: onCancel };
    findPeople.current = mentions;
  });
  const applyLink = () => {
    if (!editor) return;
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else {
      const full = /^[a-z]+:/i.test(url) ? url : url.includes("@") && !url.includes("/") ? `mailto:${url}` : `https://${url}`;
      if (SAFE.test(full)) chain.setLink({ href: full }).run();
    }
    setLinking(false);
  };

  const tool = (name: string, on: boolean, run: () => void, Icon: typeof Bold) => (
    <button
      type="button"
      aria-label={name}
      aria-pressed={on}
      title={name}
      // Keeps the text focused, so a tool isn't "leaving" it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        on && "bg-secondary text-foreground",
      )}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );

  return (
    <div
      ref={wrapper}
      onBlur={(e) => {
        // Leaving the whole box (not moving to its toolbar or link line) saves.
        if ((inline || variant === "document") && !wrapper.current?.contains(e.relatedTarget as Node | null)) keys.current.done(true);
      }}
      className={cn(
        "relative flex flex-col gap-2",
        inline
          ? "rounded-md ring-2 ring-ring/40 ring-offset-4 ring-offset-background"
          : variant === "document"
            ? ""
            : variant === "comment"
            ? "border-b border-border py-1.5 text-sm focus-within:border-nia-blue"
              : "rounded-lg border border-input px-3 py-2 transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      <div role="toolbar" aria-label={`Format ${label.toLowerCase()}`} className="-ml-1 flex flex-wrap items-center gap-0.5">
        {headings && tool("Section heading", state?.heading ?? false, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), Heading3)}
        {tool("Bold (⌘B)", state?.bold ?? false, () => editor?.chain().focus().toggleBold().run(), Bold)}
        {tool("Italic (⌘I)", state?.italic ?? false, () => editor?.chain().focus().toggleItalic().run(), Italic)}
        {tool("Bullet list", state?.bullets ?? false, () => editor?.chain().focus().toggleBulletList().run(), List)}
        {tool("Numbered list", state?.numbers ?? false, () => editor?.chain().focus().toggleOrderedList().run(), ListOrdered)}
        {tool("Link (⌘K)", state?.link ?? false, openLink, Link2)}
      </div>
      {linking && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            aria-label="Link address"
            placeholder="Paste a link, or an email address"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                // Closes the link line only.
                e.preventDefault();
                e.stopPropagation();
                setLinking(false);
                editor?.commands.focus();
              }
            }}
            className="h-8 min-w-0 flex-1 rounded-full border border-border bg-background px-3 text-small outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button type="button" onClick={applyLink} className="h-8 rounded-full bg-secondary px-3 text-small font-semibold text-foreground hover:bg-secondary/80">
            {href.trim() ? "Add link" : "Remove link"}
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      {suggest && (suggest.items.length > 0 || suggest.query) && (
        <div
          role="listbox"
          aria-label="People to mention"
          style={{ left: suggest.at.left, top: suggest.at.top }}
          className="absolute z-50 flex w-64 flex-col gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-elevation-2"
        >
          {suggest.items.length === 0 ? (
            <p className="px-2 py-1.5 text-small text-muted-foreground">No one on this project matches</p>
          ) : (
            suggest.items.map((person, i) => (
              <button
                key={person.id}
                type="button"
                role="option"
                aria-selected={i === pick}
                // Keeps the text focused while choosing.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => {
                  listRef.current = { ...listRef.current, pick: i };
                  setPick(i);
                }}
                onClick={() => suggest.choose(person)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-small outline-none", i === pick && "bg-muted")}
              >
                <Avatar className="size-6">
                  {person.avatar && <AvatarImage src={person.avatar} alt="" />}
                  <AvatarFallback className="text-meta">{getInitials(person.name, "")}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{person.name}</span>
                {person.username && <span className="truncate text-caption text-muted-foreground">@{person.username}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

type ListState = { open: boolean; pick: number; suggest: Suggest | null };
type MentionCtx = {
  wrapper: RefObject<HTMLDivElement | null>;
  listRef: RefObject<ListState>;
  findPeople: RefObject<((query: string) => Promise<MentionPerson[]>) | undefined>;
  setSuggest: (s: Suggest | null) => void;
  setPick: (n: number) => void;
};

// The @ list, wired to the editor's state through refs (read only when someone types).
function mentionExtension({ wrapper, listRef, findPeople, setSuggest, setPick }: MentionCtx) {
  return Mention.configure({
    HTMLAttributes: { class: "font-medium text-nia-blue" },
    renderText: ({ node }) => `@${node.attrs.label ?? ""}`,
    suggestion: {
      char: "@",
      // "@ama@studio.com" stays one search (the default stops at a second @).
      findSuggestionMatch: ({ $position }) => {
        const before = $position.nodeBefore;
        if (!before?.isText || !before.text) return null;
        const match = /(?:^|\s)@([^\s]{0,60})$/.exec(before.text);
        if (!match) return null;
        const typed = match[0].trimStart();
        return { range: { from: $position.pos - typed.length, to: $position.pos }, query: match[1], text: typed };
      },
      items: async ({ query }) => {
        try {
          return (await findPeople.current?.(query)) ?? [];
        } catch {
          return [];
        }
      },
      render: () => {
        const show = (props: SuggestionProps<MentionPerson>) => {
          const rect = props.clientRect?.();
          const box = wrapper.current?.getBoundingClientRect();
          const next: Suggest = {
            items: props.items,
            query: props.query,
            at: rect && box ? { left: rect.left - box.left, top: rect.bottom - box.top + 4 } : { left: 0, top: 0 },
            choose: (person) => props.command({ id: person.id, label: person.name }),
          };
          listRef.current = { open: true, pick: 0, suggest: next };
          setSuggest(next);
          setPick(0);
        };
        return {
          onStart: show,
          onUpdate: show,
          onKeyDown: ({ event }) => {
            const list = listRef.current;
            const items = list.suggest?.items ?? [];
            if (!list.open) return false;
            if (event.key === "Escape") {
              listRef.current = { open: false, pick: 0, suggest: null };
              setSuggest(null);
              return true;
            }
            if (!items.length) return false;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              const next = (list.pick + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
              listRef.current = { ...list, pick: next };
              setPick(next);
              return true;
            }
            if (event.key === "Enter" || event.key === "Tab") {
              list.suggest?.choose(items[list.pick]);
              return true;
            }
            return false;
          },
          onExit: () => {
            listRef.current = { open: false, pick: 0, suggest: null };
            setSuggest(null);
          },
        };
      },
    },
  });
}
