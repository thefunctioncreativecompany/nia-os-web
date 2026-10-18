import Image, { type StaticImageData } from "next/image";
import { Mail, MessageCircle, Pencil, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge, type ProductionStatus } from "@/components/nia/status-badge";

// A cast or crew member's details for the day (Figma cast & crew "talent-preview-panel").
export function TalentCard({
  name,
  role,
  photo,
  status,
  statusLabel,
  details,
  notes,
  onMessage,
  onEdit,
  onContact,
  onAdjust,
  className,
}: {
  name: string;
  role: string;
  photo?: StaticImageData | string;
  status: ProductionStatus;
  statusLabel?: string;
  details: { label: string; value: string }[];
  notes?: string;
  onMessage: () => void;
  onEdit: () => void;
  onContact: () => void;
  onAdjust: () => void;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-menu md:p-8", className)}>
      <header className="flex items-center gap-4">
        <span className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted md:size-24">
          {photo && <Image src={photo} alt="" fill sizes="96px" className="object-cover" />}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <h3 className="text-h2 font-bold text-foreground">{name}</h3>
          <p className="text-base text-muted-foreground">{role}</p>
          <StatusBadge status={status}>{statusLabel}</StatusBadge>
        </div>
      </header>
      <section aria-label="Production details" className="flex flex-col gap-3 border-t border-border pt-6">
        <h4 className="text-micro font-bold text-muted-foreground">Production details</h4>
        <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
          {details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="text-muted-foreground">{d.label}</dt>
              <dd className="min-w-0 font-bold break-words text-foreground">{d.value}</dd>
            </div>
          ))}
        </dl>
        <div aria-hidden className="flex gap-2 text-muted-foreground">
          <Mail className="size-4" /><Phone className="size-4" /><MessageCircle className="size-4" />
        </div>
      </section>
      {notes && (
        <section aria-label="Rider and setup notes" className="flex flex-col gap-3 border-t border-border pt-6">
          <h4 className="text-micro font-bold text-muted-foreground">Rider & setup notes</h4>
          <p className="rounded-xl border border-border bg-nia-panel p-4 text-sm text-muted-foreground">{notes}</p>
        </section>
      )}
      <footer className="flex flex-wrap gap-2.5">
        <Button variant="outline" size="icon-lg" className="size-12" aria-label={`Message ${name}`} onClick={onMessage}><MessageCircle /></Button>
        <Button variant="outline" size="icon-lg" className="size-12" aria-label={`Edit ${name}`} onClick={onEdit}><Pencil /></Button>
        <Button variant="outline" size="lg" onClick={onContact}>Contact</Button>
        <Button size="lg" className="flex-1" onClick={onAdjust}>Adjust schedule</Button>
      </footer>
    </article>
  );
}
