"use client";

import { useState } from "react";
import { Archive, ArrowRight, ChevronRight, CircleAlert, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/nia/confirm-dialog";
import { LoadingDots } from "@/components/nia/loading-dots";
import { ProgressRing } from "@/components/nia/progress-ring";
import { ReorderableList } from "@/components/nia/reorderable-list";
import { SearchInput } from "@/components/nia/search-input";
import { SearchSuggest } from "@/components/nia/search-suggest";
import { Steps } from "@/components/nia/steps";
import { SwipeRow } from "@/components/nia/swipe-row";
import { TagInput } from "@/components/nia/tag-input";
import { UploadProgress } from "@/components/nia/upload-progress";
import { GalleryCard, GallerySection } from "../_gallery";

export function DialogsSection() {
  const [name, setName] = useState("Scene 4 - Seafood Kitchen");

  return (
    <GallerySection
      id="dialogs"
      number={12}
      title="Dialogs"
      figma="957-21486"
      description="Short prompts that need an answer before carrying on: discard, rename, permission, error and a blocking wait. <ConfirmDialog tone>, <Dialog>, <Spinner>."
    >
      <GalleryCard title="1. Discard confirmation" description="Warning tone.">
        <ConfirmDialog
          tone="warning"
          title="Discard unsaved changes?"
          description="Your edits to the scene description will be lost permanently. This can't be undone."
          confirmLabel="Discard"
          onConfirm={() => {
            toast("Changes discarded");
          }}
        >
          <Button variant="outline" size="md" className="w-fit">Discard changes</Button>
        </ConfirmDialog>
      </GalleryCard>

      <GalleryCard title="2. Rename" description="One field, saves on Enter.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit"><Pencil />Rename scene</Button></DialogTrigger>
          <DialogContent className="gap-4 sm:max-w-md" showCloseButton={false}>
            <DialogTitle>Rename Scene</DialogTitle>
            <DialogDescription className="sr-only">Give this scene a new name.</DialogDescription>
            <form
              id="rename-scene"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(`Renamed to “${name}”`);
              }}
            >
              <Input
                aria-label="Scene name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-lg border-foreground text-sm md:text-sm"
              />
            </form>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
              <DialogClose asChild><Button type="submit" form="rename-scene" size="md" disabled={!name.trim()}>Rename</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="3. Permission request" description="Info tone.">
        <ConfirmDialog
          tone="info"
          title="Allow camera access?"
          description="Nia needs your camera to capture reference stills on set for the script breakdown."
          confirmLabel="Allow"
          cancelLabel="Don't allow"
          onConfirm={() => {
            toast.success("Camera access allowed");
          }}
        >
          <Button variant="outline" size="md" className="w-fit">Request camera</Button>
        </ConfirmDialog>
      </GalleryCard>

      <GalleryCard title="4. Error" description="What failed and why, with a retry.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Show export error</Button></DialogTrigger>
          <DialogContent className="gap-4 sm:max-w-md" showCloseButton={false}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-cancelled text-nia-danger">
                <CircleAlert aria-hidden className="size-5" />
              </span>
              <DialogTitle className="text-nia-danger">Export failed</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="flex flex-col gap-1 text-caption">
                <span className="text-nia-danger">Error code: 504_GATEWAY_TIMEOUT</span>
                <span className="text-muted-foreground">The export server didn&rsquo;t respond within 30 seconds.</span>
              </div>
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" size="md">Close</Button></DialogClose>
              <DialogClose asChild><Button size="md" onClick={() => toast("Trying the export again…")}>Try again</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="5. Loading" description="Blocks the screen while a long task runs; can be cancelled.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Generate breakdown</Button></DialogTrigger>
          <DialogContent
            className="items-center gap-2 text-center sm:max-w-sm"
            showCloseButton={false}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <Spinner className="mx-auto mb-3 size-8 text-foreground" />
            <DialogTitle className="text-center">Generating breakdown sheet…</DialogTitle>
            <DialogDescription className="text-center text-sm">Please wait while we find the characters.</DialogDescription>
            <DialogClose className="mx-auto mt-3 w-fit rounded-sm text-small font-bold text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              Cancel
            </DialogClose>
          </DialogContent>
        </Dialog>
      </GalleryCard>
    </GallerySection>
  );
}

const SCENES = [
  { title: "Scene 1 - Beach Sunrise", time: "05:00 AM", tint: "from-[#3b2f2a] to-[#1c2230]" },
  { title: "Scene 2 - Pier Setup", time: "10:30 AM", tint: "from-[#4a5568] to-[#1a202c]" },
  { title: "Scene 3 - Restaurant INT", time: "02:00 PM", tint: "from-[#2d2d2d] to-[#1f1f1f]" },
];

const CREW = [
  { name: "Christopher Nolan", role: "Director" },
  { name: "Hoyte van Hoytema", role: "Director of Photography" },
  { name: "Emma Thomas", role: "Producer" },
  { name: "Devindran Auth", role: "Gaffer" },
  { name: "Richard King", role: "Sound" },
];

export function ListsSection() {
  const [order, setOrder] = useState([
    { id: "intro", label: "Master Intro Sequence" },
    { id: "kitchen", label: "Kitchen Dialogue INT" },
    { id: "night", label: "Exterior Night Tracking" },
  ]);

  return (
    <GallerySection
      id="lists"
      number={13}
      title="Lists"
      figma="957-21545"
      description="Rows for documents, crew and scenes, grouped lists, swipe actions and drag-to-order. Plain <ul> rows, <Avatar>, <SwipeRow>, <ReorderableList>."
    >
      <GalleryCard title="1. Simple list">
        <ul className="flex flex-col divide-y divide-border">
          {["Script Breakdown", "Shot List", "Storyboard", "Call Sheet", "Budget"].map((item) => (
            <li key={item}>
              <a href="#lists" className="flex items-center justify-between py-3 text-sm text-foreground outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                {item}
                <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </GalleryCard>

      <GalleryCard title="2. Crew list">
        <ul className="flex flex-col divide-y divide-border">
          {CREW.map((person) => (
            <li key={person.name} className="flex items-center gap-3 py-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-micro font-bold">{person.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold text-foreground">{person.name}</span>
                <span className="text-caption text-muted-foreground">{person.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </GalleryCard>

      <GalleryCard title="3. List with thumbnails">
        <ul className="flex flex-col divide-y divide-border">
          {SCENES.map((scene) => (
            <li key={scene.title}>
              <a href="#lists" className="flex items-center gap-3 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span aria-hidden className={`size-12 shrink-0 rounded-lg bg-gradient-to-br ${scene.tint}`} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold text-foreground">{scene.title}</span>
                  <span className="text-caption text-muted-foreground">Shoots at {scene.time}</span>
                </span>
                <ArrowRight aria-hidden className="size-5 shrink-0 text-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </GalleryCard>

      <GalleryCard title="4. Sectioned list" description="Grouped by production stage.">
        <div className="flex flex-col gap-4">
          {[
            { stage: "Pre-production", items: ["Script Draft v1", "Storyboard Sketches"] },
            { stage: "Production", items: ["Main Shoot Log", "Unit 1 Sound Package"] },
          ].map((group) => (
            <section key={group.stage} aria-label={group.stage}>
              <h4 className="text-micro font-bold tracking-wide text-muted-foreground uppercase">{group.stage}</h4>
              <ul className="mt-1 flex flex-col divide-y divide-border border-b border-border">
                {group.items.map((item) => (
                  <li key={item} className="py-2.5 text-sm text-foreground">{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </GalleryCard>

      <GalleryCard title="5. Swipeable row" description="Swipe left to reveal actions; shown revealed here.">
        <SwipeRow
          revealed
          actions={[
            { label: "Edit Master Shot 4", icon: Pencil, onClick: () => toast("Editing Master Shot 4") },
            { label: "Archive Master Shot 4", icon: Archive, tone: "warning", onClick: () => toast("Master Shot 4 archived") },
            { label: "Delete Master Shot 4", icon: Trash2, tone: "danger", onClick: () => toast("Master Shot 4 deleted") },
          ]}
        >
          Master Shot 4 - Opening
        </SwipeRow>
      </GalleryCard>

      <GalleryCard title="6. Reorderable list" description="Drag the handle, or use the arrows.">
        <ReorderableList label="Shot order" items={order} onChange={setOrder} />
      </GalleryCard>
    </GallerySection>
  );
}

export function ProgressSection() {
  return (
    <GallerySection
      id="progress"
      number={14}
      title="Loading & Progress"
      figma="957-21668"
      description="Show how far along something is, or hold its place while it loads. <Progress>, <ProgressRing>, <Skeleton>, <LoadingDots>, <Steps>, <UploadProgress>."
    >
      <GalleryCard title="1. Linear progress">
        <div className="flex items-center gap-3">
          <Progress value={67} aria-label="Breakdown progress" className="flex-1" />
          <span className="text-small font-bold text-foreground">67%</span>
        </div>
      </GalleryCard>

      <GalleryCard title="2. Ring loader">
        <div className="flex items-center gap-3">
          <ProgressRing value={42} label="Upload progress" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Uploading…</span>
            <span className="text-caption text-muted-foreground">42% done</span>
          </div>
        </div>
      </GalleryCard>

      <GalleryCard title="3. Skeleton placeholder">
        <div aria-hidden className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full bg-border" />
            <Skeleton className="h-3 w-36 bg-border" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg bg-border" />
        </div>
      </GalleryCard>

      <GalleryCard title="4. Loading dots">
        <div className="flex justify-center py-2">
          <LoadingDots label="Loading scenes" />
        </div>
      </GalleryCard>

      <GalleryCard title="5. Milestones">
        <Steps steps={["Imported", "Processing", "Finalizing"]} current={1} />
      </GalleryCard>

      <GalleryCard title="6. Upload progress">
        <UploadProgress
          name="call-sheet-v3.pdf"
          loaded={2_400_000}
          total={8_100_000}
          onCancel={() => toast("Upload cancelled")}
          className="p-0 border-0 bg-transparent"
        />
      </GalleryCard>
    </GallerySection>
  );
}

export function SearchSection() {
  const [active, setActive] = useState("Scene 4");
  const [docked, setDocked] = useState("");
  const [tags, setTags] = useState(["Unit: Active", "Format: FDX"]);

  return (
    <GallerySection
      id="search"
      number={15}
      title="Search Bars"
      figma="957-21729"
      description="Search fields: compact, active with clear, with suggestions, docked with a submit arrow, and with filter tags. <SearchInput>, <SearchSuggest>, <TagInput>."
    >
      <GalleryCard title="1. Compact">
        <SearchInput label="Search" value="" onChange={() => {}} placeholder="Search" className="w-36" />
      </GalleryCard>

      <GalleryCard title="2. Active">
        <SearchInput label="Search scenes" value={active} onChange={setActive} />
      </GalleryCard>

      <GalleryCard title="3. With suggestions" description="Type “call” to see them.">
        <SearchSuggest
          label="Search documents"
          placeholder="Search documents…"
          suggestions={[
            { value: "cs-12", label: "Call Sheet - Day 12" },
            { value: "cs-template", label: "Call Sheet Template Draft" },
            { value: "shot-list", label: "Shot List - Kitchen" },
          ]}
          onSelect={(s) => toast(`Opening ${s.label}`)}
        />
      </GalleryCard>

      <GalleryCard title="4. Docked with submit">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (docked.trim()) toast(`Searching for “${docked.trim()}”`);
          }}
          className="flex h-11 items-center gap-2 rounded-full border border-border bg-white pr-1.5 pl-3.5 focus-within:border-foreground"
        >
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search everything"
            value={docked}
            onChange={(e) => setDocked(e.target.value)}
            placeholder="Search everything…"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-nia-placeholder"
          />
          <Button type="submit" size="icon-sm" variant="ghost" aria-label="Search">
            <ChevronRight />
          </Button>
        </form>
      </GalleryCard>

      <GalleryCard title="5. Filter tags" description="Type and press Enter to add a tag.">
        <TagInput label="Filter documents" placeholder="Add a filter…" tags={tags} onChange={setTags} />
      </GalleryCard>
    </GallerySection>
  );
}
