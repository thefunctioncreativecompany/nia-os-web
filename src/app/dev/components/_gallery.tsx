import { cn } from "@/lib/utils";

// Layout pieces for the component gallery, in the nOS Design System's own style:
// numbered sections with a rule, and light cards titled like "1. PRIMARY BUTTONS".

export function GallerySection({
  id,
  number,
  title,
  description,
  figma,
  children,
}: {
  id: string;
  number?: number;
  title: string;
  description: string;
  // Figma node id, e.g. "957-19992".
  figma: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-6 flex-col gap-6">
      <header className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`${id}-title`} className="text-h2 font-bold text-foreground">
            {number ? `Section ${number}: ` : ""}
            {title}
          </h2>
          <a
            href={`https://www.figma.com/design/jaF49U0T0DQ5lNB6h4wJvp/Nia-Technologies-Inc.?node-id=${figma}`}
            target="_blank"
            rel="noreferrer"
            className="text-caption font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Figma {figma}
          </a>
        </div>
        <p className="text-small text-muted-foreground">{description}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function GalleryCard({
  title,
  wide = false,
  className,
  children,
}: {
  title: string;
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-nia-surface p-6",
        wide && "md:col-span-2",
        className,
      )}
    >
      <h3 className="text-small font-bold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}

// "DEFAULT / HOVER / PRESSED / DISABLED" rows beside a component.
export function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <span className="w-20 shrink-0 text-micro font-bold tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
