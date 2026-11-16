"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Link2, List, ListOrdered } from "lucide-react";

import { cn } from "@/lib/utils";

// Formatting as you type (Ika, 2026-11-15: bold, italics, bullets, numbering, links "wherever
// there's text inputs"; she chose formatting that shows while typing). Loaded only when someone
// starts editing (next/dynamic), so pages that just show text stay light. Saves Markdown, the part
// rich-text.tsx shows: paragraphs, bold, italic, bullet and numbered lists, links. The toolbar
// keeps focus in the text, so using it doesn't count as leaving; the link goes in a line inside.
// Keys: ⌘B, ⌘I, ⌘K (link), "- " or "1. " starts a list, Tab nests it, Escape cancels, ⌘Enter saves.

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
  variant?: "inline" | "field" | "comment";
  /** Fields: start focused. */
  autoFocus?: boolean;
  /** Fields: ⌘Enter (a comment's Send). */
  onSubmit?: () => void;
  /** Fields: Escape (a comment's Cancel); without it Escape is left to the page (a dialog closes). */
  onCancel?: () => void;
  /** Longest it may be, formatting included; typing past it is undone. */
  maxLength?: number;
}) {
  const inline = variant === "inline";
  const wrapper = useRef<HTMLDivElement>(null);
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");
  // The latest handlers, for the editor's keys (set up once, when it's made).
  const keys = useRef({ done: onDone ?? (() => {}), link: () => {}, submit: onSubmit, cancel: onCancel });

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: inline || autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: false,
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
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: cn("rich-text-editor outline-none flex flex-col gap-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li_p]:my-0 [&_a]:underline [&_a]:underline-offset-2", variant === "comment" ? "min-h-6" : "min-h-16"),
      },
      handleKeyDown: (_view, event) => {
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
        if (inline && !wrapper.current?.contains(e.relatedTarget as Node | null)) keys.current.done(true);
      }}
      className={cn(
        "flex flex-col gap-2",
        inline
          ? "rounded-md ring-2 ring-ring/40 ring-offset-4 ring-offset-background"
          : variant === "comment"
            ? "border-b border-border py-1.5 text-sm focus-within:border-nia-blue"
            : "rounded-lg border border-input px-3 py-2 transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      <div role="toolbar" aria-label={`Format ${label.toLowerCase()}`} className="-ml-1 flex flex-wrap items-center gap-0.5">
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
    </div>
  );
}
