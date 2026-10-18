import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

// A project in a grid (Figma: Projects grid "Frame" 778:2462) or in Home's recent
// projects (`compact`, 872:42924): cover still, title, and a line like
// "Edited 2 hours ago • Kai Cenat". Lifts slightly on hover.
export function ProjectCard({
  href,
  title,
  meta,
  cover,
  size = "default",
  className,
}: {
  href: string;
  title: string;
  meta: string;
  cover?: string | StaticImageData | null;
  size?: "default" | "compact";
  className?: string;
}) {
  const compact = size === "compact";

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl outline-none transition-transform duration-fast ease-out hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:scale-100",
        compact ? "gap-2" : "gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[19/10] w-full overflow-hidden bg-muted",
          compact ? "rounded-lg" : "rounded-xl",
        )}
      >
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes={compact ? "(min-width: 1024px) 300px, 50vw" : "(min-width: 1024px) 380px, 100vw"}
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "font-bold text-foreground",
            compact ? "text-caption leading-normal" : "text-base leading-normal",
          )}
        >
          {title}
        </p>
        <p className={cn("text-muted-foreground", compact ? "text-meta" : "text-small leading-normal")}>
          {meta}
        </p>
      </div>
    </Link>
  );
}
