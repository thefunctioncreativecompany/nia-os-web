import { cn } from "@/lib/utils";

export type ScriptLine =
  | { kind: "heading"; text: string }
  | { kind: "action"; text: string }
  | { kind: "character"; text: string }
  | { kind: "dialogue"; text: string }
  | { kind: "transition"; text: string };

// A screenplay excerpt in Courier, with scene headings, action, characters and dialogue
// laid out the industry way (Figma "Preview Card").
export function ScriptPreview({
  project,
  title,
  byline,
  lines,
  footer,
  page,
  className,
}: {
  project: string;
  title: string;
  byline?: string;
  lines: ScriptLine[];
  footer?: string;
  page?: string;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-menu", className)}>
      <header className="border-b border-border pb-3">
        <span className="text-micro text-muted-foreground">Script preview</span>
        <h3 className="text-base font-bold text-foreground">{project}</h3>
      </header>
      <div className="flex flex-col gap-2 font-mono text-small leading-snug text-foreground">
        <div>
          <p className="text-base font-bold uppercase">{title}</p>
          {byline && <p className="text-muted-foreground">{byline}</p>}
        </div>
        {lines.map((line, i) => (
          <p
            key={i}
            className={cn(
              line.kind === "heading" && "mt-1 font-bold uppercase",
              line.kind === "character" && "-mb-2 pl-8 font-bold uppercase",
              line.kind === "dialogue" && "pl-8",
              line.kind === "transition" && "text-muted-foreground uppercase",
            )}
          >
            {line.text}
          </p>
        ))}
      </div>
      {(footer || page) && (
        <footer className="flex justify-between text-micro text-muted-foreground">
          <span>{footer}</span>
          <span>{page}</span>
        </footer>
      )}
    </article>
  );
}
