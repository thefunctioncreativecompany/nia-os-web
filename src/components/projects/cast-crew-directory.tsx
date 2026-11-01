"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, List, Mail, MessageCircle, Pencil, Phone, Plus, Send, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChipMenu, ChipRow, FilterChip, ResultCount } from "@/components/nia/filter-bar";
import { EmptyState } from "@/components/nia/empty-state";
import { NotYet } from "@/components/nia/not-yet";
import { PersonPicture } from "@/components/nia/cast-crew-row";
import { StatusBadge, type ProductionStatus } from "@/components/nia/status-badge";
import { byDepartment, type DirectoryEntry } from "@/features/crew/directory";

// A project's cast and crew (Milestone 4, step 1; Figma frame 18, 967:30543), in Nia's look: the
// cast as a table, the crew by department, and the person in focus beside them (below on phones
// and tablets) with how to reach them, their week and production notes. List or grid; filter by
// department and status. Adding and editing people opens with the people tables
// (20261109000000_people.sql); until then the directory shows the project's Crew & talent.

type Filter<T extends string> = T | "all";
const STATUS_OPTIONS: { value: Filter<ProductionStatus>; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "on-hold", label: "On hold" },
  { value: "wrapped", label: "Wrapped" },
  { value: "cancelled", label: "Cancelled" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CastCrewDirectory({
  projectTitle,
  projectHref,
  entries,
  editable,
}: {
  projectTitle: string;
  projectHref: string;
  entries: DirectoryEntry[];
  /** Adding and editing people works (the people tables exist and they may edit the project). */
  editable: boolean;
}) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [department, setDepartment] = useState<string>("all");
  const [status, setStatus] = useState<Filter<ProductionStatus>>("all");
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? null);

  const shown = useMemo(
    () => entries.filter((e) => (department === "all" || (e.kind === "crew" && e.department === department)) && (status === "all" || e.status === status)),
    [entries, department, status],
  );
  const cast = shown.filter((e) => e.kind === "cast");
  const crew = byDepartment(shown);
  const selected = entries.find((e) => e.id === selectedId) ?? shown[0] ?? null;
  const onSet = entries.filter((e) => e.status === "confirmed").length;
  const departments = [...new Set(entries.filter((e) => e.kind === "crew").map((e) => e.department))];

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
      <div className="flex min-w-0 flex-col gap-7 px-4 pt-10 pb-15 md:px-15 lg:pr-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm leading-[1.4]">
          <Link href={projectHref} className="rounded-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            ← Back to project
          </Link>
          <span aria-hidden className="text-nia-placeholder">/</span>
          <span className="truncate font-bold text-foreground">{projectTitle}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-xl flex-col gap-2">
            <h1 className="text-h1 leading-tight font-bold text-foreground">Cast &amp; crew</h1>
            <p className="text-sm leading-normal text-muted-foreground">Everyone on {projectTitle}: who they play or what they do, how to reach them, and whether they&rsquo;re confirmed.</p>
          </div>
          <div className="flex items-center gap-4">
            {onSet > 0 && (
              <span className="flex items-center gap-1.5 text-small text-muted-foreground">
                <span aria-hidden className="size-1.5 rounded-full bg-status-confirmed-foreground" />
                {onSet} confirmed
              </span>
            )}
            <span className="rounded-md border border-border bg-nia-panel px-3 py-1.5 text-caption font-bold text-foreground">Total headcount: {entries.length}</span>
          </div>
        </header>

        {entries.length === 0 ? (
          <EmptyState
            icon={Users}
            message="No cast or crew added yet. Add people under Crew & talent in the project's Details."
            action={
              <Button asChild variant="outline" className="mt-2">
                <Link href={projectHref}>Open the project</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <ChipRow className="rounded-xl border border-border bg-nia-surface px-3 py-2 lg:flex-nowrap">
                <FilterChip on={view === "list"} onClick={() => setView("list")} aria-label="List">
                  <List aria-hidden className="size-4" /> List
                </FilterChip>
                <FilterChip on={view === "grid"} onClick={() => setView("grid")} aria-label="Grid">
                  <LayoutGrid aria-hidden className="size-4" /> Grid
                </FilterChip>
                <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
                <ChipMenu label="Department" value={department} defaultValue="all" options={[{ value: "all", label: "All" }, ...departments.map((d) => ({ value: d, label: d }))]} onChange={setDepartment} />
                <ChipMenu label="Status" value={status} defaultValue="all" options={STATUS_OPTIONS} onChange={setStatus} />
                <ResultCount className="ml-auto">{shown.length} of {entries.length}</ResultCount>
                <Button size="compact" disabled={!editable} className="shrink-0">
                  <Plus aria-hidden /> Add person
                </Button>
              </ChipRow>
              {!editable && <NotYet className="self-end">Adding and editing people opens with the people directory (step 1 of shoot day planning).</NotYet>}
            </div>

            {view === "grid" ? (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                {shown.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      aria-pressed={selected?.id === e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={cn("hover-sweep flex w-full flex-col items-center gap-2.5 rounded-xl border bg-card p-4 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50", selected?.id === e.id ? "border-foreground" : "border-border")}
                    >
                      <PersonPicture name={e.name} photo={e.photo} className="size-16" />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground">{e.name}</span>
                        <span className="text-small text-muted-foreground">{e.character ?? e.role}</span>
                      </span>
                      {e.status && <StatusBadge status={e.status} />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {cast.length > 0 && (
                  <section aria-labelledby="cast" className="flex flex-col gap-3">
                    <h2 id="cast" className="flex items-center gap-2 text-lg font-bold text-foreground">
                      Cast <span className="rounded-full border border-border bg-nia-panel px-2 py-0.5 text-micro font-bold text-muted-foreground">{cast.length}</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-xl text-left text-small">
                        <thead className="bg-nia-surface text-micro font-bold text-muted-foreground">
                          <tr>
                            <th scope="col" className="w-14 p-3 font-bold">Photo</th>
                            <th scope="col" className="p-3 font-bold">Name</th>
                            <th scope="col" className="p-3 font-bold">Character / role</th>
                            <th scope="col" className="w-20 p-3 font-bold">Episodes</th>
                            <th scope="col" className="w-24 p-3 font-bold">Contact</th>
                            <th scope="col" className="w-28 p-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cast.map((e) => (
                            <tr key={e.id} aria-selected={selected?.id === e.id} className={cn("border-t border-border", selected?.id === e.id && "bg-accent")}>
                              <td className="p-3"><PersonPicture name={e.name} photo={e.photo} className="size-8 [&_span]:text-micro" /></td>
                              <td className="p-3">
                                <button type="button" onClick={() => setSelectedId(e.id)} className="rounded-sm text-left font-bold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                                  {e.name}
                                </button>
                              </td>
                              <td className="p-3 text-foreground">{e.character ?? e.role}</td>
                              <td className="p-3 text-muted-foreground">{e.episodes.join(", ") || "—"}</td>
                              <td className="p-3"><Contact entry={e} /></td>
                              <td className="p-3">{e.status ? <StatusBadge status={e.status} /> : <span className="text-muted-foreground">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {crew.length > 0 && (
                  <section aria-labelledby="crew" className="flex flex-col gap-4">
                    <h2 id="crew" className="flex items-center gap-2 text-lg font-bold text-foreground">
                      Crew <span className="rounded-full border border-border bg-nia-panel px-2 py-0.5 text-micro font-bold text-muted-foreground">{crew.length} {crew.length === 1 ? "department" : "departments"}</span>
                    </h2>
                    {crew.map((g) => (
                      <Collapsible key={g.department} defaultOpen className="overflow-hidden rounded-xl border border-border">
                        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 bg-nia-surface p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
                          <span className="flex items-center gap-2 text-small font-bold text-foreground">
                            <ChevronDown aria-hidden className="size-3.5 transition-transform duration-fast group-data-[state=closed]:-rotate-90" />
                            {g.department}
                          </span>
                          <span className="text-micro font-bold text-nia-placeholder">
                            {g.people.length} {g.people.length === 1 ? "person" : "people"}
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul>
                            {g.people.map((e) => (
                              <li key={e.id} className={cn("flex flex-wrap items-center gap-3 border-t border-border p-3", selected?.id === e.id && "bg-accent")}>
                                <button type="button" onClick={() => setSelectedId(e.id)} className="flex min-w-0 flex-1 flex-col rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-52 sm:flex-none">
                                  <span className="truncate text-small font-bold text-foreground hover:underline">{e.name}</span>
                                  <span className="truncate text-micro text-muted-foreground">{e.role}</span>
                                </button>
                                {/* Episodes go under the name on phones. */}
                                <span className="order-last flex min-w-0 basis-full flex-wrap gap-1.5 sm:order-none sm:basis-0 sm:flex-1">
                                  {e.episodes.map((ep) => (
                                    <span key={ep} className="rounded-sm border border-border bg-nia-panel px-1.5 py-0.5 text-meta font-semibold whitespace-nowrap text-muted-foreground">{ep}</span>
                                  ))}
                                </span>
                                {e.email && <span className="w-48 truncate text-caption text-muted-foreground max-md:hidden">{e.email}</span>}
                                <Contact entry={e} withMessage className="w-20 justify-end" />
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </section>
                )}

                {shown.length === 0 && <p className="text-sm text-muted-foreground">No one matches these filters.</p>}
              </>
            )}
          </>
        )}
      </div>

      {selected && <ProfilePanel entry={selected} editable={editable} />}
    </div>
  );
}

// Email, call and text, where they've given the details.
function Contact({ entry: e, withMessage = false, className }: { entry: DirectoryEntry; withMessage?: boolean; className?: string }) {
  const link = "rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";
  if (!e.email && !e.phone) return <span className={cn("text-muted-foreground", className)}>—</span>;
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {e.email && (
        <a href={`mailto:${e.email}`} aria-label={`Email ${e.name}`} className={link}>
          <Mail aria-hidden className="size-4" />
        </a>
      )}
      {e.phone && (
        <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${e.name}`} className={link}>
          <Phone aria-hidden className="size-4" />
        </a>
      )}
      {withMessage && e.phone && (
        <a href={`sms:${e.phone.replace(/[^\d+]/g, "")}`} aria-label={`Text ${e.name}`} className={link}>
          <MessageCircle aria-hidden className="size-4" />
        </a>
      )}
    </span>
  );
}

function ProfilePanel({ entry: e, editable }: { entry: DirectoryEntry; editable: boolean }) {
  const label = "text-micro font-bold text-nia-placeholder";
  return (
    <aside aria-label={`${e.name}'s profile`} className="flex flex-col gap-6 border-border bg-nia-panel px-4 pt-8 pb-15 md:px-15 lg:border-l lg:px-10 lg:pt-10">
      <div className="flex items-center justify-between">
        <p className="text-micro font-bold text-muted-foreground">Selected profile</p>
        {e.status && <StatusBadge status={e.status} />}
      </div>
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <PersonPicture name={e.name} photo={e.photo} className="size-16" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-lg leading-[1.4] font-bold text-foreground">{e.name}</p>
            <p className="text-small font-medium text-muted-foreground">{e.character ? `${e.character} (${e.role})` : e.role}</p>
            {e.union && <p className="text-micro font-bold text-nia-blue">{e.union}</p>}
          </div>
        </div>

        {(e.email || e.phone || e.agent) && (
          <section className="flex flex-col gap-2.5 border-t border-border pt-5">
            <h3 className={label}>Contact details</h3>
            {e.email && <Detail icon={<Mail aria-hidden className="size-3.5" />}>{e.email}</Detail>}
            {e.phone && <Detail icon={<Phone aria-hidden className="size-3.5" />}>{e.phone}</Detail>}
            {e.agent && <Detail icon={<Users aria-hidden className="size-3.5" />}>Agent: {e.agent}</Detail>}
          </section>
        )}

        {e.bio && (
          <section className="flex flex-col gap-2 border-t border-border pt-5">
            <h3 className={label}>Biography</h3>
            <p className="text-small leading-normal text-muted-foreground">{e.bio}</p>
          </section>
        )}

        {e.availability && (
          <section className="flex flex-col gap-2.5 border-t border-border pt-5">
            <h3 className={label}>Shoot availability this week</h3>
            <ul className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d, i) => (
                <li key={d} className="flex flex-col items-center gap-1">
                  <span className="text-meta font-bold text-muted-foreground">{d}</span>
                  <span className={cn("flex h-6 w-full items-center justify-center rounded-sm text-meta font-bold", e.availability![i] ? "bg-status-confirmed text-status-confirmed-foreground" : "bg-status-wrapped text-status-wrapped-foreground")}>
                    {e.availability![i] ? "On" : "Off"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {e.notes && (
          <section className="flex flex-col gap-2 border-t border-border pt-5">
            <h3 className={label}>Production notes</h3>
            <p className="rounded-md border border-border bg-nia-panel p-2.5 text-caption leading-normal text-muted-foreground">{e.notes}</p>
          </section>
        )}

        {!e.email && !e.phone && !e.bio && !e.availability && !e.notes && (
          <p className="border-t border-border pt-5 text-small text-muted-foreground">No contact details or notes yet.</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" disabled={!editable} className="flex-1">
          <Pencil aria-hidden /> Edit profile
        </Button>
        {e.email ? (
          <Button asChild className="flex-1">
            <a href={`mailto:${e.email}`}>
              <Send aria-hidden /> Email {e.name.split(" ")[0]}
            </a>
          </Button>
        ) : (
          <Button disabled className="flex-1">
            <Send aria-hidden /> Email
          </Button>
        )}
      </div>
    </aside>
  );
}

function Detail({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-small text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
