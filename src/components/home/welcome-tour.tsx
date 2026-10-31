"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { FileText, Mic, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dots } from "@/components/nia/dots";
import { ProjectCard } from "@/components/nia/project-card";
import { TmdbCredit } from "@/components/explore/tmdb-credit";
import { HERO_SET } from "@/components/auth/hero-images";
import { DocMiniature } from "@/features/templates/components/doc-miniature";
import { loadTemplatePreview, type TemplatePreview } from "@/features/templates/actions";

type Step = { id: string; title: string; body: string };

// What Nia does, one production job a step (Ika, 2026-10-23). No Copilot until it's built.
const STEPS: Step[] = [
  { id: "welcome", title: "Welcome to Nia", body: "Nia is where you plan, make and manage your productions. This tour shows you the essentials in about a minute." },
  { id: "projects", title: "Projects", body: "Every production gets a project: its cover, details, stage and the people on it, on one page. Start one for each shoot, film or campaign." },
  { id: "documents", title: "Documents", body: "Call sheets, shot lists and invoices start from a template. Fill them in with real dates, times and people, then save them to a project or download a PDF." },
  { id: "files", title: "Files and references", body: "Keep stills, PDFs, voice memos and video with the project, tagged by what they're for. Paste an Instagram link to add it as a reference." },
  { id: "crew", title: "Your crew", body: "Invite people by email to view or edit a project. When someone changes it, everyone sees the change straight away." },
  { id: "explore", title: "Explore", body: "Films, series and creators' work to learn from, matched to your project's genres and type. Save titles to collections or add them to a project's references." },
  { id: "done", title: "You're set", body: "Start your first project. You can take this tour again any time from your profile menu." },
];

// Ika's stills (hero-images.ts): Sinners behind the scenes, and the studio shoots.
const [, , CAMERA, , , , FITTING, SHOWROOM, TEAM] = HERO_SET.map((h) => h.src);

// The welcome tour (Ika, 2026-10-23, after Gabriel's "Onboarding Experience made with Figma
// Motion" on Collect UI): a card over Home with the step on the left and a preview of that part of
// Nia on the right, drawn with the app's own components. It opens by itself once: on a new
// account's first visit to Home after onboarding (`tour_pending`, set when onboarding finishes and
// cleared when the tour first opens), and again from "Take the tour" in the profile menu
// (`/home?tour=1`). Accounts from before the tour never get it by itself.
export function WelcomeTour({ firstName, firstVisit }: { firstName: string; firstVisit: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const asked = useSearchParams().get("tour") === "1";
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(firstVisit || asked);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const primary = useRef<HTMLButtonElement>(null);

  // "Take the tour" while already on Home: start again from the first step.
  const [lastAsked, setLastAsked] = useState(asked);
  if (asked !== lastAsked) {
    setLastAsked(asked);
    if (asked) {
      setStep(0);
      setOpen(true);
    }
  }

  // Shown once: the flag clears as soon as the tour opens by itself, so leaving or reloading
  // Home never brings it back.
  useEffect(() => {
    if (!firstVisit) return;
    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { tour_pending: false } });
      // The sign-in token carries the flag; refresh it so Home stops opening the tour.
      if (!error) await supabase.auth.refreshSession();
    })();
  }, [firstVisit]);

  const go = (next: number) => {
    if (next < 0 || next >= STEPS.length) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const close = (then?: string) => {
    setOpen(false);
    if (asked) router.replace(pathname, { scroll: false });
    if (then) router.push(then);
  };

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const title = step === 0 && firstName ? `Welcome to Nia, ${firstName}` : current.title;
  const shift = reduce ? 0 : 16 * direction;
  const enter = { duration: reduce ? 0 : DURATION.base, ease: EASE_OUT };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        showCloseButton={false}
        // The main button takes focus (not the first dot), so Enter moves on.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          primary.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(step + 1);
          if (e.key === "ArrowLeft") go(step - 1);
        }}
        className="grid max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-4xl md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:grid-rows-1"
      >
        {/* The preview sits on the right on wide screens, above the words on phones. */}
        <div aria-hidden inert className="relative order-first flex h-64 items-center justify-center overflow-hidden bg-nia-canvas p-4 md:order-last md:h-120 md:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current.id}
              initial={{ opacity: 0, x: shift }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -shift }}
              transition={enter}
              className="flex size-full items-center justify-center"
            >
              {/* Drawn at one size and scaled down on phones, so every preview fits whole. */}
              <div className="flex w-md shrink-0 items-center justify-center max-md:scale-55">
                <Preview id={current.id} />
              </div>
            </m.div>
          </AnimatePresence>
        </div>
        {/* Its own close button, above the preview (the dialog's would sit under it). */}
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3 z-10">
            <X aria-hidden />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>

        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-6 md:p-10">
          <p className="text-caption text-muted-foreground">
            {step + 1} of {STEPS.length}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={current.id} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={enter} className="flex flex-col gap-3">
              <DialogTitle className="text-h2 leading-tight font-bold text-foreground">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-normal text-muted-foreground">{current.body}</DialogDescription>
            </m.div>
          </AnimatePresence>

          <div className="mt-auto flex flex-col gap-6 pt-2">
            <Dots count={STEPS.length} current={step} onSelect={go} label="Step" />
            {/* One main button that changes its words, so focus stays on it from step to step. */}
            <div className="flex flex-wrap items-center gap-2">
              <Button ref={primary} onClick={() => (last ? close("/projects/new") : go(step + 1))}>
                {step === 0 ? "Get started" : last ? "Start a project" : "Next"}
              </Button>
              <Button variant="ghost" onClick={() => (step === 0 ? close() : go(step - 1))}>
                {step === 0 ? "Skip for now" : "Back"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Preview({ id }: { id: string }) {
  if (id === "projects") return <ProjectsPreview />;
  if (id === "documents") return <DocumentsPreview />;
  if (id === "files") return <FilesPreview />;
  if (id === "crew") return <CrewPreview />;
  if (id === "explore") return <ExplorePreview />;
  return <Collage />;
}

// The opening and closing picture: stills from productions, loosely stacked.
function Collage() {
  return (
    <div className="relative aspect-[4/3] w-full">
      {[
        { src: TEAM, className: "top-[6%] left-0 w-[58%] aspect-[4/3]" },
        { src: CAMERA, className: "top-0 right-0 w-[38%] aspect-[3/4]" },
        { src: SHOWROOM, className: "bottom-0 left-[22%] w-[52%] aspect-[16/10] z-10" },
      ].map(({ src, className }, i) => (
        <div key={i} className={cn("absolute overflow-hidden rounded-xl bg-muted shadow-elevation-2", className)}>
          <Image src={src} alt="" fill sizes="240px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

const panel = "w-full max-w-md rounded-2xl bg-card p-4 shadow-elevation-2";

function ProjectsPreview() {
  return (
    <div className={panel}>
      <p className="mb-3 text-sm font-bold text-foreground">My projects</p>
      <div className="grid grid-cols-2 gap-3">
        <ProjectCard href="/projects" size="compact" cover={TEAM} title="Autumn lookbook" meta="Pre-production · edited 2 hours ago" />
        <ProjectCard href="/projects" size="compact" cover={CAMERA} title="Night market" meta="In production · shoot day 3" />
      </div>
    </div>
  );
}

// The real Call Sheet, drawn small as in the template preview pop-up.
function DocumentsPreview() {
  const [preview, setPreview] = useState<TemplatePreview | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadTemplatePreview("D01").then((p) => live && setPreview(p));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/60">
      {preview === undefined ? <Skeleton className="size-[86%] rounded-lg" /> : <DocMiniature icon="clipboard" name="Call Sheet" schema={preview?.schema ?? null} />}
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">{children}</span>;
}

function FilesPreview() {
  const files = [
    { name: "Showroom recce.jpg", tag: "Reference", still: SHOWROOM },
    { name: "Fitting, look 4.jpg", tag: "Final asset", still: FITTING },
    { name: "Call sheet, day 1.pdf", tag: "Document", Icon: FileText },
    { name: "Location notes.m4a", tag: "Voice memo", Icon: Mic },
  ];
  return (
    <div className={cn(panel, "grid grid-cols-2 gap-3")}>
      {files.map(({ name, tag, still, Icon }) => (
        <div key={name} className="flex flex-col gap-1.5">
          <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-nia-panel">
            {still ? <Image src={still} alt="" fill sizes="200px" className="object-cover" /> : Icon && <Icon aria-hidden className="size-6 text-muted-foreground" />}
          </div>
          <p className="truncate text-caption font-semibold text-foreground">{name}</p>
          <span>
            <Tag>{tag}</Tag>
          </span>
        </div>
      ))}
    </div>
  );
}

function CrewPreview() {
  const people = [
    { initials: "AO", name: "Amara Okafor", role: "Owner" },
    { initials: "TM", name: "Thabo Mokoena", role: "Can edit" },
    { initials: "JR", name: "Jess Reyes", role: "Can view" },
  ];
  return (
    <div className={cn(panel, "flex flex-col gap-3")}>
      <p className="text-sm font-bold text-foreground">Share “Night market”</p>
      <div className="flex h-10 items-center rounded-full border border-border px-4 text-small text-nia-placeholder">Add people by email</div>
      <ul className="flex flex-col gap-2.5">
        {people.map((p) => (
          <li key={p.name} className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{p.initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-small font-semibold text-foreground">{p.name}</span>
            <Tag>{p.role}</Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExplorePreview() {
  const titles = [
    { slug: "atlantics", title: "Atlantics" },
    { slug: "dahomey", title: "Dahomey" },
    { slug: "eyimofe", title: "Eyimofe" },
  ];
  return (
    <div className={cn(panel, "flex flex-col gap-3")}>
      <div className="flex items-center gap-1">
        <p className="text-sm font-bold text-foreground">Inspiration for this project</p>
        <TmdbCredit />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {titles.map((t) => (
          <div key={t.slug} className="flex flex-col gap-1.5">
            <div className="relative aspect-[268/373] overflow-hidden rounded-lg bg-muted">
              <Image src={`/explore/made-in-africa/${t.slug}.jpg`} alt="" fill sizes="140px" className="object-cover" />
            </div>
            <p className="truncate text-caption font-semibold text-foreground">{t.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
