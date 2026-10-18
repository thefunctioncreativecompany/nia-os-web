import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

// A project or example page: cover, title, summary, production info and its documents
// (Figma "template-browse-grid").
export function TemplateDetail({
  backHref,
  backLabel,
  cover,
  title,
  summary,
  info,
  documents,
  activeDocument,
  className,
}: {
  backHref: string;
  backLabel: string;
  cover: StaticImageData | string;
  title: string;
  summary: string;
  info: { label: string; value: string }[];
  documents: { label: string; href: string }[];
  activeDocument?: string;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col gap-6", className)}>
      <Link href={backHref} className="flex w-fit items-center gap-1.5 rounded-sm text-small font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <ArrowLeft aria-hidden className="size-4" />
        {backLabel}
      </Link>
      <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <Image src={cover} alt="" fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
      </span>
      <div className="flex flex-col gap-3">
        <h3 className="text-h1 font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <section aria-labelledby="production-info" className="flex flex-col gap-4">
        <h4 id="production-info" className="text-lg font-bold">Production info</h4>
        <dl className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-3 text-sm">
          {info.map((row) => (
            <div key={row.label} className="contents">
              <dt className="font-bold text-muted-foreground">{row.label}</dt>
              <dd className="text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <nav aria-label="Documents" className="flex flex-wrap gap-2.5">
        {documents.map((doc) => {
          const active = doc.label === activeDocument;
          return (
            <Link
              key={doc.label}
              href={doc.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center rounded-full border px-4 text-small outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "border-foreground bg-foreground font-bold text-primary-foreground" : "border-border bg-white text-muted-foreground hover:border-ring hover:text-foreground",
              )}
            >
              {doc.label}
            </Link>
          );
        })}
      </nav>
    </article>
  );
}
