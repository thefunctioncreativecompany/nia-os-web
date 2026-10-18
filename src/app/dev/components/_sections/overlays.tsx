"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Award,
  Camera,
  Check,
  CircleCheck,
  Cloud,
  Copy,
  Download,
  FileText,
  Folder,
  LayoutGrid,
  Link as LinkIcon,
  LogOut,
  Mail,
  Moon,
  PencilLine,
  Plus,
  Printer,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import showroom from "@/assets/hero/11-showroom.jpg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/nia/confirm-dialog";
import { Dots } from "@/components/nia/dots";
import { MultiSelect } from "@/components/nia/multi-select";
import { GalleryCard, GallerySection } from "../_gallery";

const fieldClassName = "h-10 rounded-lg text-sm md:text-sm";
const selectClassName = "h-10 w-full rounded-lg text-sm data-[size=default]:h-10";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-small font-bold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function MenusSection() {
  const [schedule, setSchedule] = useState("day");
  const [roles, setRoles] = useState(["director", "dp", "gaffer", "editor"]);
  const [view, setView] = useState("list");
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <GallerySection
      id="menus"
      number={5}
      title="Pop-up Menus & Dropdowns"
      figma="957-20429"
      description="Context menu, select, multi-select, cascading menu, command palette, user menu and filter popover. <ContextMenu>, <Select>, <MultiSelect>, <DropdownMenu>, <Command>, <Popover>."
    >
      <GalleryCard title="1. Context menu" description="Right-click the scene card.">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-28 items-center justify-center rounded-xl border-[1.5px] border-dashed border-border bg-white text-small text-muted-foreground">
            Scene 4 · Harbor kitchen (right-click)
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuItem><PencilLine />Edit scene<ContextMenuShortcut>⌘E</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem><Copy />Duplicate<ContextMenuShortcut>⌘D</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem><Folder />Move to folder<ContextMenuShortcut>⌘M</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem><Archive />Archive<ContextMenuShortcut>⌥A</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem variant="destructive"><Trash2 />Delete scene</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </GalleryCard>

      <GalleryCard title="2. Dropdown select" description="Standard pick-list with the selected item ticked.">
        <Select value={schedule} onValueChange={setSchedule}>
          <SelectTrigger aria-label="Schedule" className={selectClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="day"><Sun />Day schedule</SelectItem>
            <SelectItem value="night"><Moon />Night schedule</SelectItem>
            <SelectItem value="weather"><Cloud />Weather hold</SelectItem>
            <SelectItem value="wrap"><CircleCheck />Wrap procedures</SelectItem>
          </SelectContent>
        </Select>
      </GalleryCard>

      <GalleryCard title="3. Multi-select dropdown" description="Several choices, shown as chips in the field.">
        <MultiSelect
          label="Crew roles"
          value={roles}
          onChange={setRoles}
          options={[
            { value: "director", label: "Director" },
            { value: "producer", label: "Producer" },
            { value: "dp", label: "DP" },
            { value: "gaffer", label: "Gaffer / Key Grip" },
            { value: "editor", label: "Editor" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="4. Nested / cascading menu" description="A submenu for related options.">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md" className="w-fit">Document options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem><Plus />New file</DropdownMenuItem>
            <DropdownMenuItem><PencilLine />Edit layout</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><LayoutGrid />View style</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                  <DropdownMenuRadioItem value="grid">Grid view</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="list">List view</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="board">Board status</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Download />Export options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </GalleryCard>

      <GalleryCard title="5. Command palette" description="Jump anywhere. Opens with the button (⌘K in the app).">
        <Command className="rounded-xl border border-border bg-white">
          <CommandInput placeholder="Jump to…" />
          <CommandList>
            <CommandGroup heading="Recents">
              <CommandItem><FileText />Scene 4 – Breakdown sheet<CommandShortcut>⌘1</CommandShortcut></CommandItem>
              <CommandItem><FileText />Call sheet – Day 12<CommandShortcut>⌘2</CommandShortcut></CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem><Plus />Create new breakdown<CommandShortcut>⌥N</CommandShortcut></CommandItem>
              <CommandItem><Download />Export current AV script<CommandShortcut>⌥E</CommandShortcut></CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setPaletteOpen(true)}>
          <Search />Open as dialog
        </Button>
        <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
          <Command>
            <CommandInput placeholder="Jump to…" />
            <CommandList>
              <CommandGroup heading="Recents">
                <CommandItem onSelect={() => setPaletteOpen(false)}><FileText />Scene 4 – Breakdown sheet</CommandItem>
                <CommandItem onSelect={() => setPaletteOpen(false)}><FileText />Call sheet – Day 12</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </GalleryCard>

      <GalleryCard title="6. User / avatar menu" description="Profile menu from the navbar avatar.">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-fit rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary text-small font-bold text-primary-foreground">MA</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-3 p-2.5 normal-case tracking-normal">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary text-small font-bold text-primary-foreground">MA</AvatarFallback>
              </Avatar>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Maya Alvarez</span>
                <span className="text-caption font-normal text-muted-foreground">Line producer</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Settings />Account settings</DropdownMenuItem>
            <DropdownMenuItem><SlidersHorizontal />Production preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive"><LogOut />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </GalleryCard>

      <GalleryCard title="7. Filter menu" description="Popover with inline options.">
        <FilterPopover />
      </GalleryCard>
    </GallerySection>
  );
}

function FilterPopover() {
  const [archived, setArchived] = useState(true);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="md" className="w-fit"><SlidersHorizontal />Filter scenes</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-4">
        <Field id="f-status" label="Status">
          <Select defaultValue="ready">
            <SelectTrigger id="f-status" className={selectClassName}><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="ready"><CircleCheck />Ready to export</SelectItem>
              <SelectItem value="draft"><PencilLine />Draft</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="f-dept" label="Department">
          <Select defaultValue="all">
            <SelectTrigger id="f-dept" className={selectClassName}><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all"><Users />All departments</SelectItem>
              <SelectItem value="camera"><Camera />Camera</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-3">
          <Switch id="f-archived" size="lg" checked={archived} onCheckedChange={setArchived} />
          <Label htmlFor="f-archived" className="text-sm font-medium">Include archived scenes</Label>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="ghost" size="md">Reset</Button>
          <Button size="md">Apply filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ModalsSection() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(0);
  const photos = [
    { title: "Reference location scout", caption: "Showroom, interior day" },
    { title: "Wardrobe fitting", caption: "Studio B, interior day" },
  ];

  return (
    <GallerySection
      id="modals"
      number={6}
      title="Modals & Dialogs"
      figma="957-20670"
      description="Confirmation, form, announcement, side panel, image preview, multi-step and success modals. <ConfirmDialog>, <Dialog>, <Sheet>."
    >
      <GalleryCard title="1. Confirmation dialog" description="Destructive confirmation.">
        <ConfirmDialog
          title="Delete Scene 4?"
          description="Scene 4 and its breakdown notes will be removed from this project."
          confirmLabel="Delete scene"
          pendingLabel="Deleting…"
          onConfirm={() => {
            toast.success("Scene 4 deleted");
          }}
        >
          <Button variant="danger" size="md" className="w-fit">Delete scene</Button>
        </ConfirmDialog>
      </GalleryCard>

      <GalleryCard title="2. Form modal" description="Structured data entry.">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="md" className="w-fit"><Plus />Add cast member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Cast Member</DialogTitle>
              <DialogDescription className="sr-only">Their name, character, department and notes.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field id="m-name" label="Name"><Input id="m-name" placeholder="e.g. Elias Miller" className={fieldClassName} /></Field>
              <Field id="m-role" label="Role / Character"><Input id="m-role" placeholder="e.g. Elias (Owner)" className={fieldClassName} /></Field>
              <Field id="m-dept" label="Department">
                <Select defaultValue="cast">
                  <SelectTrigger id="m-dept" className={selectClassName}><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="cast"><Users />Cast / Principal</SelectItem>
                    <SelectItem value="extras"><Users />Background</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="m-notes" label="Notes"><Textarea id="m-notes" placeholder="Special requirements, allergies, etc." className="min-h-20 rounded-lg text-sm md:text-sm" /></Field>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost" size="md">Cancel</Button></DialogClose>
              <DialogClose asChild><Button size="md" onClick={() => toast.success("Cast member added")}>Save member</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="3. Alert / announcement modal" description="Informational update.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Show announcement</Button></DialogTrigger>
          <DialogContent className="items-center text-center sm:max-w-sm">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-status-on-hold text-status-on-hold-foreground">
              <Award aria-hidden className="size-6" />
            </span>
            <DialogTitle className="text-center">Breakdown approved</DialogTitle>
            <DialogDescription className="text-center text-sm">
              The script breakdown is locked. Export packs are ready for the crew.
            </DialogDescription>
            <DialogClose asChild><Button size="md" className="w-full">Got it</Button></DialogClose>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="4. Side panel / drawer" description="Narrow panel for side tasks (360px).">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="md" className="w-fit">Open camera settings</Button></SheetTrigger>
          <SheetContent className="w-[360px] sm:max-w-[360px]">
            <SheetHeader className="border-b border-border p-5">
              <SheetTitle>Camera Settings</SheetTitle>
              <SheetDescription className="sr-only">Camera package, aspect ratio and frame rate.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 px-5">
              <Field id="s-camera" label="Camera package"><Input id="s-camera" defaultValue="ARRI Alexa 35" className={fieldClassName} /></Field>
              <Field id="s-aspect" label="Aspect ratio"><Input id="s-aspect" defaultValue="2.39:1 Anamorphic" className={fieldClassName} /></Field>
              <Field id="s-fps" label="Frame rate"><Input id="s-fps" defaultValue="23.976 fps" className={fieldClassName} /></Field>
            </div>
            <SheetFooter className="grid grid-cols-2 gap-3 border-t border-border p-5">
              <Button variant="outline" size="md">Reset</Button>
              <Button size="md">Update</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </GalleryCard>

      <GalleryCard title="5. Image preview modal" description="Look closely, step through stills.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Preview stills</Button></DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
              <Image src={showroom} alt={photos[photo].title} fill sizes="(min-width: 640px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <DialogTitle className="text-base">{photos[photo].title}</DialogTitle>
                <DialogDescription className="text-small">{photos[photo].caption}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Previous still" onClick={() => setPhoto((p) => (p + photos.length - 1) % photos.length)}><ArrowLeft /></Button>
                <Button variant="outline" size="icon" aria-label="Next still" onClick={() => setPhoto((p) => (p + 1) % photos.length)}><ArrowRight /></Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="6. Multi-step modal" description="Sequential setup with a step indicator.">
        <Dialog onOpenChange={(open) => open && setStep(0)}>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Import a script</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-micro font-bold tracking-wide text-muted-foreground uppercase">Step {step + 1} of 3</span>
              <Dots count={3} current={step} label="Step" />
            </div>
            <DialogTitle>{["Script file", "Characters", "Review"][step]}</DialogTitle>
            <DialogDescription className="sr-only">Import a script in three steps.</DialogDescription>
            <div className="flex flex-col gap-4">
              <Field id="ms-format" label="Format"><Input id="ms-format" defaultValue="Final Draft (.fdx)" className={fieldClassName} /></Field>
              <Field id="ms-map" label="Character list"><Input id="ms-map" defaultValue="Build from scene headings" className={fieldClassName} /></Field>
            </div>
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild><Button variant="ghost" size="md">Skip setup</Button></DialogClose>
              {step < 2 ? (
                <Button size="md" onClick={() => setStep((s) => s + 1)}>Next: {["Characters", "Review"][step]}</Button>
              ) : (
                <DialogClose asChild><Button size="md">Import script</Button></DialogClose>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>

      <GalleryCard title="7. Success / completion modal" description="Confirms a finished action.">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="md" className="w-fit">Add scene</Button></DialogTrigger>
          <DialogContent className="items-center text-center sm:max-w-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-confirmed text-status-confirmed-foreground">
              <Check aria-hidden className="size-5" strokeWidth={3} />
            </span>
            <DialogTitle className="text-center">Scene added</DialogTitle>
            <DialogDescription className="text-center text-small">
              Scene 4 · Harbor kitchen · INT. KITCHEN – NIGHT · 2 cast
            </DialogDescription>
            <DialogFooter className="grid grid-cols-2 gap-3">
              <DialogClose asChild><Button variant="ghost" size="md">Close</Button></DialogClose>
              <DialogClose asChild><Button size="md">View scene</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </GalleryCard>
    </GallerySection>
  );
}

const sheetRowClassName =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function SheetsSection() {
  const [sort, setSort] = useState("date");
  const [verified, setVerified] = useState(true);
  const [incomplete, setIncomplete] = useState(false);
  const [department, setDepartment] = useState("cast");

  return (
    <GallerySection
      id="sheets"
      number={7}
      title="Action Sheets & Bottom Sheets"
      figma="957-20826"
      description="Bottom-anchored menus with a drag handle: actions, destructive, share, sort & filter, selection and expandable. <Drawer>."
    >
      <GalleryCard title="1. Standard action sheet" description="Quick actions from the bottom.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Call sheet actions</Button></DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only"><DrawerTitle>Call sheet actions</DrawerTitle><DrawerDescription>Share, export, print or copy a link.</DrawerDescription></DrawerHeader>
            <div className="mx-auto flex w-full max-w-md flex-col p-3">
              <button type="button" className={sheetRowClassName}><Share2 />Share PDF pack</button>
              <button type="button" className={sheetRowClassName}><Download />Export details (.csv)</button>
              <button type="button" className={sheetRowClassName}><Printer />Print call sheet</button>
              <button type="button" className={sheetRowClassName}><LinkIcon />Copy document link</button>
            </div>
            <DrawerFooter className="mx-auto w-full max-w-md border-t border-border">
              <DrawerClose asChild><Button variant="ghost" size="md">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="2. Destructive action sheet" description="Confirmation from the bottom.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Remove location</Button></DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="mx-auto max-w-md text-center">
              <DrawerTitle className="text-center">Remove location?</DrawerTitle>
              <DrawerDescription className="text-center text-sm">
                Harbor kitchen will be unlinked from Scene 4. Crew schedules for that day will need a new location.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="mx-auto w-full max-w-md">
              <DrawerClose asChild><Button variant="danger" size="md">Unlink location</Button></DrawerClose>
              <DrawerClose asChild><Button variant="ghost" size="md">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="3. Share sheet" description="Invite collaborators.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit"><Share2 />Share call sheet</Button></DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
              <DrawerTitle className="text-left text-lg">Share Call Sheet</DrawerTitle>
              <DrawerDescription className="sr-only">Invite crew by email.</DrawerDescription>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["EL", "MA", "+5"].map((initials, i) => (
                    <Avatar key={initials} className="size-8 ring-2 ring-white">
                      <AvatarFallback className={i === 0 ? "bg-primary text-micro font-bold text-white" : "bg-ring text-micro font-bold text-white"}>{initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-small text-muted-foreground">Crew on this project</span>
              </div>
              <Field id="sh-email" label="Invite by email">
                <div className="relative">
                  <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="sh-email" type="email" placeholder="e.g. producer@studio.com" className={`${fieldClassName} pl-9`} />
                </div>
              </Field>
              <Field id="sh-perm" label="Access">
                <Select defaultValue="view">
                  <SelectTrigger id="sh-perm" className={selectClassName}><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <DrawerClose asChild><Button size="md" onClick={() => toast.success("Invite sent")}>Send invite</Button></DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="4. Filter / sort sheet" description="Sort preference and filters.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit"><SlidersHorizontal />Sort & filter</Button></DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
              <DrawerTitle className="text-left text-lg">Sort & Filter Scenes</DrawerTitle>
              <DrawerDescription className="sr-only">Choose order and which scenes show.</DrawerDescription>
              <Tabs value={sort} onValueChange={setSort}>
                <TabsList className="h-10 w-full bg-muted p-1">
                  <TabsTrigger value="date" className="text-small data-active:bg-white data-active:font-bold">By date</TabsTrigger>
                  <TabsTrigger value="scene" className="text-small data-active:bg-white data-active:font-bold">By scene #</TabsTrigger>
                  <TabsTrigger value="dept" className="text-small data-active:bg-white data-active:font-bold">By department</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <Checkbox id="fs-verified" checked={verified} onCheckedChange={(c) => setVerified(c === true)} />
                <Label htmlFor="fs-verified" className="text-sm font-semibold">Only show confirmed</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="fs-incomplete" checked={incomplete} onCheckedChange={(c) => setIncomplete(c === true)} />
                <Label htmlFor="fs-incomplete" className="text-sm font-normal">Only show incomplete</Label>
              </div>
              <DrawerClose asChild><Button size="md">Apply</Button></DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="5. Selection sheet" description="Single choice with search.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Select department</Button></DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
              <DrawerTitle className="text-left text-lg">Select Department</DrawerTitle>
              <DrawerDescription className="sr-only">Pick one department.</DrawerDescription>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search departments" placeholder="Search departments…" className={`${fieldClassName} pl-9`} />
              </div>
              <RadioGroup value={department} onValueChange={setDepartment} className="gap-1">
                {[
                  ["cast", "Cast / Principal"],
                  ["art", "Art department"],
                  ["camera", "Camera / Grip"],
                  ["sound", "Sound / Audio"],
                ].map(([value, label]) => (
                  <div key={value} className="flex items-center gap-3 rounded-lg px-1 py-2">
                    <RadioGroupItem id={`dep-${value}`} value={value} />
                    <Label htmlFor={`dep-${value}`} className={department === value ? "text-sm font-bold" : "text-sm font-normal"}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <DrawerClose asChild><Button size="md">Done</Button></DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="6. Expandable bottom sheet" description="Peeks first, drags up for detail.">
        <Drawer snapPoints={[0.3, 0.9]}>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Scene 4 details</Button></DrawerTrigger>
          <DrawerContent className="h-full">
            <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-5">
              <DrawerTitle className="text-left">Scene 4 details</DrawerTitle>
              <DrawerDescription className="text-sm">
                All crew slots filled. Harbor kitchen confirmed. Transport leaves base at 05:00 for a 06:00 call.
              </DrawerDescription>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View map</Button>
                <Button variant="outline" size="sm">Crew list</Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </GalleryCard>
    </GallerySection>
  );
}
