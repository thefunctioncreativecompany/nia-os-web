"use client";

import { useState } from "react";
import {
  CameraOff,
  ChevronDown,
  ClipboardList,
  Clock,
  Columns3,
  Compass,
  FileSearch,
  FileText,
  FileVideo,
  Folder,
  Home,
  ImageUp,
  Inbox,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  MegaphoneOff,
  Receipt,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import panther from "@/assets/hero/08-black-panther.jpg";
import church from "@/assets/hero/01-sinners-bts-church.png";
import portrait from "@/assets/hero/02-sinners-portrait.png";
import dance from "@/assets/hero/05-sinners-dance.png";
import backrooms from "@/assets/hero/06-backrooms.webp";
import fitting from "@/assets/hero/10-studio-fitting.jpg";
import { PRODUCTION_TYPES } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CallTimePicker } from "@/components/nia/call-time-picker";
import { FilterPills } from "@/components/nia/filter-pills";
import { NavPillTabs } from "@/components/nia/nav-pill-tabs";
import { PosterRow } from "@/components/nia/poster-row";
import { ScriptPreview } from "@/components/nia/script-preview";
import { SearchableList } from "@/components/nia/searchable-list";
import { SetupChecklist } from "@/components/nia/setup-checklist";
import { StatusBadge } from "@/components/nia/status-badge";
import { StatusPicker, type TalentStatus } from "@/components/nia/status-picker";
import { TalentCard } from "@/components/nia/talent-card";
import { TemplateCard } from "@/components/nia/template-card";
import { TemplateDetail } from "@/components/nia/template-detail";
import { WorkspaceSwitcher } from "@/components/nia/workspace-switcher";
import { GalleryCard, GallerySection } from "../_gallery";

const labelClassName = "text-micro font-bold tracking-wide text-muted-foreground uppercase";
const fieldClassName = "h-10 rounded-lg text-sm md:text-sm";
const selectClassName = "h-10 w-full rounded-lg text-sm data-[size=default]:h-10";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

export function NavigationSection() {
  const [workspace, setWorkspace] = useState("nia");

  return (
    <GallerySection
      id="navigation"
      number={26}
      title="Navigation & Account"
      figma="1181-12103"
      description="Compact navbar tabs (current tab labelled, others icon-only) and the profile menu with team accounts. <NavPillTabs>, <WorkspaceSwitcher>."
    >
      <GalleryCard title="1. Navbar tab iterations" description="One row per current tab.">
        <div className="flex flex-col gap-3">
          {NAV.map((tab) => (
            <NavPillTabs key={tab.href} tabs={NAV} current={tab.href} />
          ))}
        </div>
      </GalleryCard>

      <GalleryCard title="2. Profile & workspace switcher">
        <div className="flex justify-end">
          <WorkspaceSwitcher
            user={{ name: "Kai Cenat", email: "kai@niastudio.com" }}
            current={workspace}
            onSwitch={(id) => {
              setWorkspace(id);
              toast(`Switched workspace`);
            }}
            onCreate={() => toast("Create a workspace")}
            onManageAccount={() => toast("Opening account settings")}
            onSignOut={() => toast("Logged out")}
            workspaces={[
              { id: "nia", name: "Nia Studio", role: "Owner" },
              { id: "gumba", name: "Gumba Fire Productions", role: "Editor" },
              { id: "universal", name: "Client Portal: Universal", role: "Viewer" },
            ]}
          />
        </div>
      </GalleryCard>
    </GallerySection>
  );
}

export function CastCrewSection() {
  const [status, setStatus] = useState<TalentStatus>("confirmed");
  const [notify, setNotify] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [callTime, setCallTime] = useState("14:00");

  return (
    <GallerySection
      id="cast-crew"
      number={27}
      title="Cast & Crew"
      figma="1181-12255"
      description="Change someone's status, move their call time, and their details card. <StatusPicker>, <CallTimePicker>, <TalentCard>."
    >
      <GalleryCard title="1. Status picker" description="In a popover from the status badge.">
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger className="flex w-fit items-center gap-1.5 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {status === "unavailable" ? <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-bold">Unavailable</span> : <StatusBadge status={status} />}
            <ChevronDown aria-hidden className="size-4" />
            <span className="sr-only">Change status</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-1.5">
            <StatusPicker
              value={status}
              onChange={(next) => {
                setStatus(next);
                setStatusOpen(false);
                toast.success(notify ? "Status updated and Focalistic notified" : "Status updated");
              }}
              notify={notify}
              onNotifyChange={setNotify}
            />
          </PopoverContent>
        </Popover>
      </GalleryCard>

      <GalleryCard title="2. Call time picker" description="In a popover from the call time.">
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="md" className="w-fit"><Clock />Call {callTime}</Button>
          </PopoverTrigger>
          <PopoverContent align="start" collisionPadding={16} className="max-h-(--radix-popover-content-available-height) w-auto overflow-y-auto p-5">
            <CallTimePicker
              title="Adjust call time"
              subtitle="Focalistic · Lead Artist"
              date="Aug 29, 2026"
              value={callTime}
              onCancel={() => setTimeOpen(false)}
              onSave={(time) => {
                setCallTime(time);
                setTimeOpen(false);
                toast.success(`Call time moved to ${time}`);
              }}
            />
          </PopoverContent>
        </Popover>
      </GalleryCard>

      <GalleryCard title="3. Talent card" wide>
        <TalentCard
          className="max-w-[480px]"
          name="Focalistic"
          role="Lead Vocalist / Performer"
          photo={portrait}
          status="confirmed"
          statusLabel="Confirmed on set"
          details={[
            { label: "Call time", value: `${callTime} (Scenes 4, 5, 8)` },
            { label: "Agent", value: "Sarah M. / Collective Artists" },
            { label: "Phone", value: "+27 82 *** ****" },
            { label: "Email", value: "f•••@email.com" },
          ]}
          notes="Green room with drinks and monitors. Wardrobe check by the 12:30 call. Sound check on the main stage at 13:15."
          onMessage={() => toast("Opening messages")}
          onEdit={() => toast("Editing Focalistic")}
          onContact={() => toast("Showing contact details")}
          onAdjust={() => setTimeOpen(true)}
        />
      </GalleryCard>
    </GallerySection>
  );
}

const SETUP_STEPS = [
  { id: "profile", title: "Complete your profile", description: "Add your photo, bio and what you do.", href: "#cards", done: true },
  { id: "project", title: "Start a new project", description: "Pick a template that fits: lookbooks, cast sheets, mood boards and more.", href: "#cards", done: false },
  { id: "explore", title: "Explore community projects", description: "See what others are making.", href: "#cards", done: false },
];

export function CardsSection() {
  const [hidden, setHidden] = useState(false);
  const [type, setType] = useState<string | null>("Film");
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <GallerySection
      id="cards"
      number={28}
      title="Cards & Forms"
      figma="1181-11763"
      description="First-steps checklist, a script preview, a searchable type list and the add-location form. <SetupChecklist>, <ScriptPreview>, <SearchableList>, <Dialog>."
    >
      <GalleryCard title="1. Welcome setup card">
        {hidden ? (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setHidden(false)}>Show setup card</Button>
        ) : (
          <SetupChecklist steps={SETUP_STEPS} onDismiss={() => setHidden(true)} />
        )}
      </GalleryCard>

      <GalleryCard title="2. Script preview">
        <ScriptPreview
          project="Black Panther"
          title="Black Panther: Wakanda Forever"
          byline="Written by Ryan Coogler & Joe Robert Cole"
          footer="Generated Aug 6, 2026"
          page="1/4"
          lines={[
            { kind: "transition", text: "Fade in:" },
            { kind: "heading", text: "EXT. ATLANTIC OCEAN - UNDERWATER - DAY" },
            { kind: "action", text: "Darkness gives way to shafts of blue-green light filtering through the deep." },
            { kind: "heading", text: "INT. TALOKAN - GREAT HALL - CONTINUOUS" },
            { kind: "character", text: "Namor" },
            { kind: "dialogue", text: "My people have remained hidden for five hundred years." },
            { kind: "character", text: "Shuri" },
            { kind: "dialogue", text: "Why reveal yourselves now?" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="3. Searchable list" description="Production type, in a popover.">
        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
          <PopoverTrigger className="flex h-10 w-full max-w-xs items-center justify-between rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:border-foreground">
            {type ?? "Choose a type"}
            <ChevronDown aria-hidden className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
            <SearchableList
              label="Production type"
              placeholder="Search types…"
              options={PRODUCTION_TYPES}
              value={type}
              onChange={(next) => {
                setType(next);
                setTypeOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </GalleryCard>

      <GalleryCard title="4. Add location form" description="Dialog with address, notes and photos.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Add location</Button></DialogTrigger>
          <DialogContent className="flex max-h-[90svh] flex-col overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add new location</DialogTitle>
              <DialogDescription className="sr-only">Name, type, address, map link, notes and photos.</DialogDescription>
            </DialogHeader>
            <form
              id="location-form"
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Location saved");
              }}
            >
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-small font-bold">Location name</span><Input defaultValue="Griffith Observatory: Exterior" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-small font-bold">Location type</span>
                <Select defaultValue="set">
                  <SelectTrigger className={selectClassName}><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="set">Set location</SelectItem>
                    <SelectItem value="base">Base camp</SelectItem>
                    <SelectItem value="parking">Crew parking</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-1.5"><span className="text-small font-bold">Address line 1</span><Input defaultValue="2800 E Observatory Rd" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-small font-bold">Address line 2</span><Input placeholder="Optional" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-small font-bold">City</span><Input defaultValue="Los Angeles" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-small font-bold">State / ZIP</span><Input defaultValue="CA 90027" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-small font-bold">Map link</span>
                <span className="relative">
                  <LinkIcon aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="url" defaultValue="https://maps.google.com/?q=Griffith+Observatory" className={`${fieldClassName} pl-9`} />
                </span>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-small font-bold">Instructions & notes</span><Textarea placeholder="Permits, parking, access times…" className="min-h-20 rounded-lg text-sm md:text-sm" /></label>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-small font-bold">Photos</span>
                <div className="flex flex-wrap items-start gap-3">
                  <label className="flex h-24 w-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ring text-center text-micro text-muted-foreground hover:bg-muted">
                    <ImageUp aria-hidden className="size-5 text-foreground" />
                    <span className="font-bold text-foreground">Drop images here</span>
                    or click to browse
                    <input type="file" accept="image/*" multiple className="sr-only" />
                  </label>
                  {[church, backrooms].map((src, i) => (
                    <span key={i} className="relative size-14 overflow-hidden rounded-md">
                      <Image src={src} alt={`Location photo ${i + 1}`} fill sizes="56px" className="object-cover" />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-sm bg-nia-danger text-white">
                        <X aria-hidden className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </form>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
              <DialogClose asChild><Button type="submit" form="location-form" size="md">Save location</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>
    </GallerySection>
  );
}

const TEMPLATE_GROUPS = [
  {
    title: "Production management & operations",
    description: "Planning, people and day-to-day running of the shoot.",
    stage: "Production",
    templates: [
      { name: "Call Sheet", icon: FileText },
      { name: "Call Sheet: Detailed", icon: ClipboardList },
      { name: "Script Breakdown", icon: FileSearch },
      { name: "3-Column AV Script", icon: Columns3 },
      { name: "Continuity Log", icon: RotateCcw },
      { name: "Equipment Rental Log", icon: CameraOff },
      { name: "Crew Contact List", icon: Users },
      { name: "Invoice", icon: Receipt },
      { name: "Filming Notice", icon: MegaphoneOff },
      { name: "Shot Logging Sheet", icon: FileVideo },
      { name: "Storyboard: 9 Frame", icon: LayoutGrid },
      { name: "Shot List", icon: ListChecks },
    ],
  },
  {
    title: "Strategy & development",
    description: "Pitching, budgeting and casting before the shoot.",
    stage: "Pre-Production",
    templates: [
      { name: "Content Production Guide", icon: ClipboardList },
      { name: "Series Bible", icon: FileText },
      { name: "Casting Deck", icon: Users },
      { name: "Production Budget", icon: Receipt },
    ],
  },
];

export function TemplatesSection() {
  const [stage, setStage] = useState(["All"]);
  const shown = TEMPLATE_GROUPS.filter((g) => stage[0] === "All" || g.stage === stage[0]);

  return (
    <GallerySection
      id="templates"
      number={29}
      title="Templates & Explore"
      figma="1181-11445"
      description="A project's detail page, the Explore poster row and the full template library. <TemplateDetail>, <PosterRow>, <FilterPills>, <TemplateCard>."
    >
      <GalleryCard title="1. Template detail">
        <TemplateDetail
          backHref="#templates"
          backLabel="Back to projects"
          cover={fitting}
          title="Streamer University (Behind the Scenes)"
          summary="Behind the scenes of the second Streamer University: preparation, campus logistics and the creative work behind student events, from sports and fashion shows to workshops for new creators."
          info={[
            { label: "Date", value: "July 2026" },
            { label: "Duration", value: "3 minutes" },
            { label: "Director", value: "Kai Cenat" },
            { label: "Genres", value: "YouTube series, Streaming" },
          ]}
          activeDocument="Series Bible"
          documents={[
            { label: "Series Bible", href: "#templates" },
            { label: "Production Budget", href: "#templates" },
            { label: "Call Sheet", href: "#templates" },
            { label: "Script", href: "#templates" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="2. Explore row" description="Scrolls sideways.">
        <PosterRow
          title="Explore"
          href="#templates"
          posters={[
            { id: "1", title: "Sinners", kind: "Scene Breakdown", src: portrait, href: "#templates" },
            { id: "2", title: "Wakanda Forever", kind: "Script", src: panther, href: "#templates" },
            { id: "3", title: "Juke Joint", kind: "Character Study", src: dance, href: "#templates" },
            { id: "4", title: "The Backrooms", kind: "Casting", src: backrooms, href: "#templates" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="3. All templates" description="Filter by stage." wide>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-micro text-muted-foreground">Show:</span>
            <FilterPills label="Stage" options={["All", "Pre-Production", "Production", "Post-Production"]} value={stage} onChange={setStage} />
          </div>
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No templates for this stage yet.</p>}
          {shown.map((group) => (
            <section key={group.title} aria-labelledby={`tg-${group.stage}`} className="flex flex-col gap-3">
              <div>
                <h4 id={`tg-${group.stage}`} className="text-h3 font-bold">{group.title}</h4>
                <p className="text-micro text-muted-foreground">{group.description}</p>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {group.templates.map((t) => (
                  <li key={t.name}>
                    <TemplateCard size="compact" name={t.name} icon={t.icon} href="#templates" className="h-24 w-full shadow-elevation-2" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-center text-micro text-muted-foreground">
            Can&rsquo;t find what you need? <a href="#templates" className="font-bold text-foreground hover:underline">Request a template</a>
          </p>
        </div>
      </GalleryCard>
    </GallerySection>
  );
}

export function ProjectModalsSection() {
  const [genres, setGenres] = useState(["Action", "Drama", "Sci-Fi"]);
  const [rating, setRating] = useState(["IMDb 8+"]);
  const [sort, setSort] = useState(["Most popular"]);
  const [saveDefault, setSaveDefault] = useState(false);
  const [scope, setScope] = useState(["All films"]);
  const [types, setTypes] = useState<string[]>([]);
  const [period, setPeriod] = useState(["Any time"]);
  const [format, setFormat] = useState(["PDF"]);
  const [size, setSize] = useState(["Letter"]);

  return (
    <GallerySection
      id="project-modals"
      number={30}
      title="Project Modals"
      figma="957-22891"
      description="Filter Explore, search everything, and save a report. <Dialog>, <FilterPills>, <Checkbox>."
    >
      <GalleryCard title="1. Filter modal">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Customize Explore</Button></DialogTrigger>
          <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
            <DialogHeader className="border-b border-border p-6 md:p-8 md:pb-6">
              <DialogTitle className="text-h2">Customize Explore</DialogTitle>
              <DialogDescription>Filter to find exactly what you&rsquo;re looking for.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 p-6 md:px-8">
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>What are you looking for?</span><Input placeholder="Films, TV shows, documentaries…" className={fieldClassName} /></label>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Genre</span><FilterPills multiple label="Genre" options={["Action", "Drama", "Sci-Fi", "Thriller", "Comedy", "Horror"]} value={genres} onChange={setGenres} /></div>
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Director</span><Input defaultValue="Christopher Nolan" className={fieldClassName} /></label>
              <div className="flex flex-col gap-1.5">
                <span className={labelClassName}>Year range</span>
                <div className="grid grid-cols-2 gap-3">
                  <Input aria-label="From year" inputMode="numeric" placeholder="2020" className={fieldClassName} />
                  <Input aria-label="To year" inputMode="numeric" placeholder="2026" className={fieldClassName} />
                </div>
              </div>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Rating</span><FilterPills label="Rating" options={["IMDb 7+", "IMDb 8+", "IMDb 9+"]} value={rating} onChange={setRating} /></div>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Sort by</span><FilterPills label="Sort by" options={["Most popular", "Newest", "Highest rated"]} value={sort} onChange={setSort} /></div>
              <fieldset className="flex flex-col gap-2.5">
                <legend className={`${labelClassName} mb-2.5`}>More options</legend>
                {[["Include TV shows", true], ["Include short films", true], ["Include unreleased", false]].map(([label, on]) => (
                  <label key={label as string} className="flex items-center gap-2.5 text-sm"><Checkbox defaultChecked={on as boolean} />{label}</label>
                ))}
              </fieldset>
            </div>
            <DialogFooter className="flex-row items-center justify-between border-t border-border p-6 md:px-8 sm:justify-between">
              <label className="flex items-center gap-2 text-small"><Switch checked={saveDefault} onCheckedChange={setSaveDefault} />Save as default</label>
              <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
                <DialogClose asChild><Button size="md" onClick={() => toast.success("Filters applied")}>Apply filters</Button></DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="2. Search modal">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Search Nia</Button></DialogTrigger>
          <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
            <DialogHeader className="border-b border-border p-6 md:p-8 md:pb-6">
              <DialogTitle className="text-h2">Search Nia</DialogTitle>
              <DialogDescription>Find projects, templates and people.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 p-6 md:px-8">
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Search</span><Input type="search" placeholder="Films, people, templates…" className={fieldClassName} /></label>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Search in</span><FilterPills label="Search in" options={["My projects", "All films", "Templates", "People"]} value={scope} onChange={setScope} /></div>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Type</span><FilterPills multiple label="Type" options={["Press kit", "Director's note", "Shot list", "Call sheet", "Script"]} value={types} onChange={setTypes} /></div>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Time period</span><FilterPills label="Time period" options={["Any time", "Past week", "Past month"]} value={period} onChange={setPeriod} /></div>
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Created by</span><Input placeholder="Anyone" className={fieldClassName} /></label>
              <div className="flex flex-col gap-2.5">
                <span className={labelClassName}>Recent searches</span>
                {["The Odyssey press kit", "Christopher Nolan projects"].map((q) => (
                  <button key={q} type="button" className="flex w-fit items-center gap-2 rounded-sm text-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                    <Clock aria-hidden className="size-3.5 text-muted-foreground" />{q}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="flex-row items-center justify-between border-t border-border p-6 md:px-8 sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setScope(["All films"]);
                  setTypes([]);
                  setPeriod(["Any time"]);
                }}
                className="rounded-sm text-small text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Clear all
              </button>
              <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
                <DialogClose asChild><Button size="md" onClick={() => toast("Searching…")}>Search</Button></DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="3. Save report modal" wide>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Save comparison report</Button></DialogTrigger>
          <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
            <DialogHeader className="border-b border-border p-6 md:p-8 md:pb-6">
              <DialogTitle className="text-h2">Save comparison report</DialogTitle>
              <DialogDescription>Download it, or save it to your projects.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 p-6 md:px-8">
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>File name</span><Input defaultValue="The Odyssey vs Oppenheimer: Comparison Report" className={fieldClassName} /></label>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Download as</span><FilterPills label="Download as" options={["PDF", "PNG", "CSV", "DOCX"]} value={format} onChange={setFormat} /></div>
              <div className="flex flex-col gap-2"><span className={labelClassName}>Page size</span><FilterPills label="Page size" options={["Letter", "A4", "Custom"]} value={size} onChange={setSize} /></div>
              <fieldset className="flex flex-col gap-2.5">
                <legend className={`${labelClassName} mb-2.5`}>Include sections</legend>
                {[["Overview & key metrics", true], ["Stats comparison", true], ["Cast analysis", true], ["Crew comparison", true], ["Scene breakdown", false], ["Script notes", false], ["Call sheet data", false]].map(([label, on]) => (
                  <label key={label as string} className="flex items-center gap-2.5 text-sm"><Checkbox defaultChecked={on as boolean} />{label}</label>
                ))}
              </fieldset>
              <div className="flex flex-col gap-2.5">
                <span className={labelClassName}>Save to project</span>
                <Select defaultValue="odyssey">
                  <SelectTrigger className={`${selectClassName} *:data-[slot=select-value]:flex-1`} aria-label="Project"><Folder className="size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="odyssey">The Odyssey</SelectItem>
                    <SelectItem value="oppenheimer">Oppenheimer</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2.5 text-sm"><Checkbox defaultChecked />Also save to the Oppenheimer project</label>
                <label className="flex items-center gap-2.5 text-sm"><Checkbox />Create a share link</label>
              </div>
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Notify people</span><Input placeholder="Add people to notify…" className={fieldClassName} /></label>
            </div>
            <DialogFooter className="flex-row items-center justify-between border-t border-border p-6 md:px-8 sm:justify-between">
              <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
              <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="outline" size="md" onClick={() => toast(`Downloading ${format[0]}`)}>Download {format[0]}</Button></DialogClose>
                <DialogClose asChild><Button size="md" onClick={() => toast.success("Saved to The Odyssey")}>Save to project</Button></DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>
    </GallerySection>
  );
}
