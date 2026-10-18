"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Share,
  SlidersHorizontal,
  ZoomIn,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DocumentPreview } from "@/components/nia/document-preview";
import { ExportProgress } from "@/components/nia/export-progress";
import { Gauge } from "@/components/nia/gauge";
import { LocationMap, RouteMap, type MapPin } from "@/components/nia/location-map";
import { PropertyInspector, type Frame } from "@/components/nia/property-inspector";
import { RecipientInput } from "@/components/nia/recipient-input";
import { ScrollTabs } from "@/components/nia/scroll-tabs";
import { SegmentedControl } from "@/components/nia/segmented-control";
import { StatSparkline } from "@/components/nia/stat-sparkline";
import { GalleryCard, GallerySection } from "../_gallery";

const labelClassName = "text-micro font-bold tracking-wide text-muted-foreground uppercase";
const fieldClassName = "h-10 rounded-lg text-sm md:text-sm";

const HOURS = [
  { day: "M", hours: 6.5 },
  { day: "T", hours: 7.8 },
  { day: "W", hours: 9.2 },
  { day: "T ", hours: 11.4, peak: true },
  { day: "F", hours: 8.6 },
  { day: "S", hours: 3.9 },
  { day: "S ", hours: 1.8 },
];
const hoursConfig = {
  hours: { label: "Standard crew", color: "var(--chart-1)" },
  peak: { label: "Peak day", color: "var(--chart-2)" },
} satisfies ChartConfig;

const SPEND = [
  { milestone: "Prep", actual: 4, projected: 8 },
  { milestone: "Wk 1", actual: 22, projected: 18 },
  { milestone: "Wk 2", actual: 31, projected: 30 },
  { milestone: "Wk 3", actual: 38, projected: 41 },
  { milestone: "Wrap", actual: 46, projected: 52 },
];
const spendConfig = {
  actual: { label: "Actual", color: "var(--chart-1)" },
  projected: { label: "Projected", color: "var(--chart-5)" },
} satisfies ChartConfig;

const BUDGET = [
  { phase: "pre", value: 25, fill: "var(--color-pre)" },
  { phase: "production", value: 45, fill: "var(--color-production)" },
  { phase: "post", value: 30, fill: "var(--color-post)" },
];
const budgetConfig = {
  value: { label: "Share" },
  pre: { label: "Pre-production (25%)", color: "var(--chart-3)" },
  production: { label: "Production (45%)", color: "var(--chart-2)" },
  post: { label: "Post-production (30%)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ChartsSection() {
  return (
    <GallerySection
      id="charts"
      number={20}
      title="Charts & Data"
      figma="957-22294"
      description="Hours, spend, budget split, progress and small trend cards. shadcn <ChartContainer> with Recharts, <Gauge>, <StatSparkline>; colours are --chart-1 (ink), -2 (teal), -3 (rust)."
    >
      <GalleryCard title="1. Bar chart" description="Shooting hours per day; hover for values.">
        <ChartContainer config={hoursConfig} className="aspect-auto h-52 w-full">
          <BarChart data={HOURS} margin={{ top: 8, left: 0, right: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="hours" radius={3} maxBarSize={24}>
              {HOURS.map((d) => (
                <Cell key={d.day} fill={d.peak ? "var(--color-peak)" : "var(--color-hours)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </GalleryCard>

      <GalleryCard title="2. Line chart" description="Spend so far against the plan ($K).">
        <ChartContainer config={spendConfig} className="aspect-auto h-52 w-full">
          <LineChart data={SPEND} margin={{ top: 8, left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="milestone" tickLine={false} axisLine={false} tickMargin={8} interval={0} padding={{ left: 16, right: 16 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="projected" type="linear" stroke="var(--color-projected)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line dataKey="actual" type="linear" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-actual)" }} />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </GalleryCard>

      <GalleryCard title="3. Budget ring" description="Spend split by phase.">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <ChartContainer config={budgetConfig} className="aspect-square h-40">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="phase" hideLabel />} />
                <Pie data={BUDGET} dataKey="value" nameKey="phase" innerRadius={52} outerRadius={76} strokeWidth={0} startAngle={90} endAngle={-270} />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-h3 leading-none font-bold">$124K</span>
              <span className="mt-1 text-tiny tracking-wide text-muted-foreground uppercase">Total budget</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5">
            {BUDGET.map((b) => (
              <li key={b.phase} className="flex items-center gap-2 text-small font-bold">
                <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: budgetConfig[b.phase as "pre"].color }} />
                {budgetConfig[b.phase as "pre"].label}
              </li>
            ))}
          </ul>
        </div>
      </GalleryCard>

      <GalleryCard title="4. Progress gauge">
        <Gauge value={68} label="Scenes wrapped" />
        <p className="flex justify-center gap-4 text-small text-muted-foreground">
          Milestone: Act II wrap <strong className="font-bold tracking-wide text-chart-2 uppercase">On schedule</strong>
        </p>
      </GalleryCard>

      <GalleryCard title="5. Sparkline cards" wide>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatSparkline label="Scenes shot" value="24" trend={[3, 4, 3, 5, 7]} />
          <StatSparkline label="Hours logged" value="186" trend={[6, 5, 7, 4, 6]} tone="ink" />
          <StatSparkline label="Budget used" value="$42K" trend={[2, 3, 4, 5, 6]} tone="rust" />
        </div>
      </GalleryCard>
    </GallerySection>
  );
}

const PINS: (MapPin & { address: string; distance: string; note: string })[] = [
  { id: "kitchen", label: "Shoreline Kitchen", x: 52, y: 38, address: "124 Harbour Blvd, SF", distance: "4.2 miles", note: "Active shoot location" },
  { id: "base", label: "Base Camp West", x: 18, y: 44, address: "Pier 39 lot C, SF", distance: "1.1 miles", note: "Logistics & rigging" },
  { id: "stage", label: "Stage 4 Studio", x: 66, y: 74, address: "900 Innes Ave, SF", distance: "6.8 miles", note: "Green screen unit" },
];

export function MapSection() {
  const [selected, setSelected] = useState<string | null>("kitchen");
  const [active, setActive] = useState("kitchen");
  const [listed, setListed] = useState("kitchen");
  const pin = PINS.find((p) => p.id === selected);

  return (
    <GallerySection
      id="map"
      number={21}
      title="Map View"
      figma="957-22429"
      description="Location plans for setups, base camp and routes. Schematic, not street maps. <LocationMap>, <RouteMap>."
    >
      <GalleryCard title="1. Map with location card" description="Click a pin for its details." wide>
        <LocationMap label="Shoot locations" pins={PINS} selected={selected} activeId={active} onSelect={setSelected} className="h-80">
          {pin && (
            <div className="flex flex-col gap-2 rounded-xl border-2 border-foreground bg-white p-3.5 shadow-menu">
              <span className="text-sm font-bold text-foreground">{pin.label}</span>
              <span className="text-micro text-muted-foreground">{pin.address}</span>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                <span className="text-micro text-muted-foreground">Distance: {pin.distance}</span>
                {pin.id === active ? (
                  <span className="text-tiny font-bold tracking-wide text-chart-2 uppercase">Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActive(pin.id);
                      toast.success(`${pin.label} is now the active location`);
                    }}
                    className="rounded-sm bg-chart-2 px-1.5 py-0.5 text-tiny font-bold tracking-wide text-white uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    Set active
                  </button>
                )}
              </div>
            </div>
          )}
        </LocationMap>
      </GalleryCard>

      <GalleryCard title="2. List and map" description="Picking a place in the list highlights it on the map." wide>
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <ul className="flex flex-col gap-2">
            {PINS.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={listed === p.id}
                  onClick={() => setListed(p.id)}
                  className={
                    listed === p.id
                      ? "flex w-full flex-col rounded-xl bg-foreground px-3 py-2.5 text-left text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      : "flex w-full flex-col rounded-xl border border-border bg-white px-3 py-2.5 text-left outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  }
                >
                  <span className="text-small font-bold">{i + 1}. {p.label}</span>
                  <span className={listed === p.id ? "text-micro text-primary-foreground/70" : "text-micro text-muted-foreground"}>{p.note}</span>
                </button>
              </li>
            ))}
          </ul>
          <LocationMap label="Selected location" pins={PINS} selected={listed} activeId={listed} onSelect={setListed} className="h-64" />
        </div>
      </GalleryCard>

      <GalleryCard title="3. Route" description="Travel between base camp and set.">
        <RouteMap from="Base Camp West" to="Shoreline Kitchen" eta="22 min" />
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Leaves at 05:30 AM</span>
          <span className="font-bold tracking-wide text-chart-2 uppercase">Route ready</span>
        </div>
      </GalleryCard>
    </GallerySection>
  );
}

export function AdvancedTabsSection() {
  const [top, setTop] = useState("overview");
  const [side, setSide] = useState("general");
  const [sheet, setSheet] = useState("all");
  const [view, setView] = useState("grid");
  const [segment, setSegment] = useState("all");

  const panels: Record<string, [string, string]> = {
    overview: ["Production overview", "Scene breakdowns, key dates and who's on the crew."],
    schedule: ["Schedule", "Shoot days, call times and company moves."],
    budget: ["Budget", "Spend by department against the approved plan."],
    team: ["Team", "Cast and crew with their roles and contact details."],
  };
  const sidePanels: Record<string, [string, string]> = {
    general: ["General settings", "Project name, format and default units."],
    permissions: ["Crew permissions", "Who can view, comment on or edit this project."],
    integrations: ["Integrations", "Connect storage and calendar apps."],
  };

  return (
    <GallerySection
      id="advanced-tabs"
      number={22}
      title="Tabs: Advanced"
      figma="957-22496"
      description="Top tabs with panels, side tabs, a scrolling filter row, icon tabs and segments with counts. <Tabs>, <ScrollTabs>, <SegmentedControl>."
    >
      <GalleryCard title="1. Top tabs with content">
        <Tabs value={top} onValueChange={setTop}>
          <TabsList variant="line" className="w-full justify-start gap-5 overflow-x-auto border-b border-border">
            {Object.keys(panels).map((key) => (
              <TabsTrigger key={key} value={key} className="flex-none px-0 text-sm capitalize data-active:font-bold">{key}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(panels).map(([key, [title, body]]) => (
            <TabsContent key={key} value={key} className="mt-3 rounded-xl border border-border bg-white p-4">
              <h4 className="text-sm font-bold">{title}</h4>
              <p className="mt-1 text-small text-muted-foreground">{body}</p>
            </TabsContent>
          ))}
        </Tabs>
      </GalleryCard>

      <GalleryCard title="2. Side tabs">
        <Tabs value={side} onValueChange={setSide} orientation="vertical" className="flex-row gap-4">
          <TabsList variant="line" className="w-36 shrink-0 items-stretch gap-1">
            {Object.entries(sidePanels).map(([key, [title]]) => (
              <TabsTrigger key={key} value={key} className="justify-start rounded-none py-2 pl-3 text-small group-data-vertical/tabs:after:right-auto group-data-vertical/tabs:after:-left-px data-active:bg-nia-panel data-active:font-bold">{title}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(sidePanels).map(([key, [title, body]]) => (
            <TabsContent key={key} value={key} className="min-h-32 rounded-xl border border-border bg-white p-4">
              <h4 className="text-small font-bold uppercase">{title}</h4>
              <p className="mt-1 text-small text-muted-foreground">{body}</p>
            </TabsContent>
          ))}
        </Tabs>
      </GalleryCard>

      <GalleryCard title="3. Scrolling filter row">
        <ScrollTabs
          label="Document type"
          value={sheet}
          onChange={setSheet}
          items={[
            { value: "all", label: "All documents" },
            { value: "call", label: "Call sheets" },
            { value: "shot", label: "Shot lists" },
            { value: "scripts", label: "Scripts" },
            { value: "budgets", label: "Budgets" },
            { value: "logs", label: "Logs", disabled: true },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="4. Icon tabs">
        <Tabs value={view} onValueChange={setView}>
          <TabsList variant="line" className="w-full justify-start gap-5 border-b border-border">
            {[
              { value: "grid", label: "Grid", icon: LayoutGrid },
              { value: "list", label: "List", icon: List },
              { value: "calendar", label: "Calendar", icon: CalendarDays },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="h-auto flex-none flex-col gap-1 px-0 pb-1.5 text-micro data-active:font-bold">
                <Icon aria-hidden />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </GalleryCard>

      <GalleryCard title="5. Segments with counts" description="Rust counts flag items that need you." wide>
        <SegmentedControl
          label="Approvals"
          value={segment}
          onChange={setSegment}
          segments={[
            { value: "all", label: "All", count: 24 },
            { value: "pending", label: "Pending", count: 3, alert: true },
            { value: "approved", label: "Approved" },
          ]}
        />
      </GalleryCard>
    </GallerySection>
  );
}

export function PanelsSection() {
  const [frame, setFrame] = useState<Frame>({ x: 1420, y: 680, width: 440, height: 220, opacity: 80, color: "#0B7A75" });
  const [guides, setGuides] = useState(true);
  const [ticker, setTicker] = useState(false);

  return (
    <GallerySection
      id="panels"
      number={23}
      title="Sheets & Panels"
      figma="957-22581"
      description="Bottom sheets (peek and full), a right-hand detail panel, a small settings popover and a property inspector. <Drawer>, <Sheet>, <Popover>, <PropertyInspector>."
    >
      <GalleryCard title="1. Peek bottom sheet" description="Short list of quick actions.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Quick actions</Button></DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="mx-auto w-full max-w-md text-left">
              <DrawerTitle>Quick actions</DrawerTitle>
              <DrawerDescription className="sr-only">Create or share call sheets.</DrawerDescription>
            </DrawerHeader>
            <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-6">
              <DrawerClose asChild>
                <button type="button" onClick={() => toast("New call sheet")} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="size-4" />New call sheet</button>
              </DrawerClose>
              <DrawerClose asChild>
                <button type="button" onClick={() => toast("Sharing selection")} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Share className="size-4" />Share selection</button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="2. Full bottom sheet" description="A short form from the bottom.">
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" size="md" className="w-fit">Add a setting</Button></DrawerTrigger>
          <DrawerContent>
            <form
              className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Setting saved");
              }}
            >
              <DrawerHeader className="px-0 text-left">
                <DrawerTitle>Add a setting</DrawerTitle>
                <DrawerDescription className="sr-only">Name the setting and add notes.</DrawerDescription>
              </DrawerHeader>
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Name</span><Input defaultValue="Camera rig offset" className={fieldClassName} /></label>
              <label className="flex flex-col gap-1.5"><span className={labelClassName}>Notes</span><Input placeholder="How should it be applied?" className={fieldClassName} /></label>
              <DrawerClose asChild><Button type="submit" size="md" className="w-full">Save setting</Button></DrawerClose>
            </form>
          </DrawerContent>
        </Drawer>
      </GalleryCard>

      <GalleryCard title="3. Side panel" description="Details of the selected item.">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="md" className="w-fit">Open scene panel</Button></SheetTrigger>
          <SheetContent className="w-[360px] sm:max-w-[360px]">
            <SheetHeader className="border-b border-border p-5">
              <SheetTitle>Scene 4</SheetTitle>
              <SheetDescription className="sr-only">Location, equipment and status.</SheetDescription>
            </SheetHeader>
            <dl className="flex flex-col gap-4 px-5">
              <div><dt className={labelClassName}>Location</dt><dd className="mt-1 text-sm font-bold">INT. KITCHEN - NIGHT</dd></div>
              <div><dt className={labelClassName}>Equipment</dt><dd className="mt-1 text-sm text-muted-foreground">ARRI Alexa 35, anamorphic lenses</dd></div>
              <div><dt className={labelClassName}>Status</dt><dd className="mt-1.5"><span className="rounded-sm bg-nia-success px-2 py-1 text-tiny font-bold tracking-wide text-white uppercase">Approved</span></dd></div>
            </dl>
          </SheetContent>
        </Sheet>
      </GalleryCard>

      <GalleryCard title="4. Settings popover" description="A few switches by the button that opened them.">
        <Popover>
          <PopoverTrigger asChild><Button variant="outline" size="md" className="w-fit"><SlidersHorizontal />Adjust view</Button></PopoverTrigger>
          <PopoverContent className="flex w-64 flex-col gap-3 p-4">
            <span className="text-sm font-bold">Adjust view</span>
            <label className="flex items-center justify-between text-small text-muted-foreground">Safe-area guides<Switch checked={guides} onCheckedChange={setGuides} /></label>
            <label className="flex items-center justify-between text-small text-muted-foreground">Timecode overlay<Switch checked={ticker} onCheckedChange={setTicker} /></label>
          </PopoverContent>
        </Popover>
      </GalleryCard>

      <GalleryCard title="5. Property inspector">
        <PropertyInspector name="Scene preview box" value={frame} onChange={setFrame} />
      </GalleryCard>
    </GallerySection>
  );
}

export function ExportSection() {
  const [format, setFormat] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const [recipients, setRecipients] = useState(["Maya Alvarez", "Elias Miller"]);
  const [percent, setPercent] = useState(75);

  return (
    <GallerySection
      id="export"
      number={24}
      title="Export Document"
      figma="957-22699"
      description="Export options, the finished file, sharing with people and export progress. <Tabs> segments, <Select>, <RecipientInput>, <ExportProgress>."
    >
      <GalleryCard title="1. Export options">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
          <h4 className="text-lg font-bold">Export call sheet</h4>
          <div className="flex flex-col gap-1.5">
            <span id="export-format" className={labelClassName}>Format</span>
            <Tabs value={format} onValueChange={setFormat}>
              <TabsList aria-labelledby="export-format" className="grid h-9 w-full grid-cols-3 gap-2 bg-transparent p-0">
                {["pdf", "csv", "xlsx"].map((f) => (
                  <TabsTrigger key={f} value={f} className="rounded-md border border-border bg-white text-small uppercase data-active:border-foreground data-active:bg-foreground data-active:font-bold data-active:text-primary-foreground">{f}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelClassName}>Quality</span>
            <Select defaultValue="300">
              <SelectTrigger className="h-10 w-full rounded-lg text-sm data-[size=default]:h-10"><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="150">Draft (150 DPI)</SelectItem>
                <SelectItem value="300">Production standard (300 DPI)</SelectItem>
                <SelectItem value="600">Print master (600 DPI)</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" disabled={!exporting} onClick={() => setExporting(false)}>Cancel</Button>
            <Button
              size="md"
              disabled={exporting}
              onClick={() => {
                setExporting(true);
                setTimeout(() => {
                  setExporting(false);
                  toast.success(`call-sheet-day12.${format} is ready`);
                }, 1600);
              }}
            >
              {exporting ? <><Loader2 className="animate-spin" />Exporting…</> : "Export"}
            </Button>
          </div>
        </div>
      </GalleryCard>

      <GalleryCard title="2. Finished file">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
          <span aria-hidden className="flex h-28 w-22 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-bold">call-sheet-day12.pdf</span>
            <span className="text-micro text-muted-foreground">2.4 MB · PDF</span>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => toast("Downloading call-sheet-day12.pdf")}><Download />Download</Button>
              <Button variant="outline" size="sm" onClick={() => toast("Share link copied")}>Share</Button>
            </div>
          </div>
        </div>
      </GalleryCard>

      <GalleryCard title="3. Share with people">
        <form
          className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success(`Invite sent to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}`);
          }}
        >
          <h4 className="text-lg font-bold">Share call sheet</h4>
          <div className="flex flex-col gap-1.5">
            <span className={labelClassName}>Recipients</span>
            <RecipientInput label="Recipients" value={recipients} onChange={setRecipients} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelClassName}>Message</span>
            <Textarea placeholder="Please review the Day 12 call sheet before the shoot." className="min-h-20 rounded-lg text-sm md:text-sm" />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-small font-bold"><Lock aria-hidden className="size-4" />Can view & comment</span>
            <Button type="submit" size="sm" disabled={!recipients.length}>Send invite</Button>
          </div>
        </form>
      </GalleryCard>

      <GalleryCard title="4. Export progress">
        <ExportProgress name="call-sheet-day12.pdf" percent={percent} remaining="12 seconds" onCancel={() => toast("Export cancelled")} />
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setPercent((p) => (p >= 100 ? 0 : Math.min(100, p + 25)))}>
          Advance sample
        </Button>
      </GalleryCard>
    </GallerySection>
  );
}

export function PreviewSection() {
  const [title, setTitle] = useState("Shoreline Kitchen");
  const [priority, setPriority] = useState("high");

  return (
    <GallerySection
      id="preview"
      number={25}
      title="Preview Panel"
      figma="957-22790"
      description="A paged document preview, a live preview beside a form, a hover card for files and a preview toolbar. <DocumentPreview>, <HoverCard>."
    >
      <GalleryCard title="1. Document preview" description="Zoom, page through, full screen." wide>
        <DocumentPreview
          label="Day 12 call sheet"
          pages={4}
          renderPage={(page) => (
            <div className="flex h-full flex-col gap-3">
              <h4 className="border-b border-border pb-3 text-base font-bold">DAY 12 CALL SHEET</h4>
              <span className="h-2 w-1/2 rounded-full bg-border" />
              <span className="h-2 w-3/4 rounded-full bg-border" />
              <span className="h-2 w-1/3 rounded-full bg-border" />
              <span className="mt-auto text-micro text-muted-foreground">Page {page}</span>
            </div>
          )}
        />
      </GalleryCard>

      <GalleryCard title="2. Live preview" description="Edits on the left show on the right straight away." wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
            <span className="text-small font-bold uppercase">Edit</span>
            <label className="flex flex-col gap-1.5"><span className={labelClassName}>Scene title</span><Input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClassName} /></label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClassName}>Priority</span>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 w-full rounded-lg text-sm data-[size=default]:h-10"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <div aria-live="polite" className="flex min-h-44 flex-col gap-3 rounded-xl bg-[#1a1a1a] p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-bold tracking-wide text-[#3fb8b1] uppercase">Live preview</span>
              <RefreshCw aria-hidden className="size-4" />
            </div>
            <span className="text-lg font-bold">{title || "Untitled scene"}</span>
            {priority === "high" && <span className="w-fit rounded-sm bg-chart-3 px-2 py-1 text-tiny font-bold tracking-wide uppercase">High priority</span>}
          </div>
        </div>
      </GalleryCard>

      <GalleryCard title="3. Hover card" description="Hover or focus the file name.">
        <p className="text-sm">
          Camera package:{" "}
          <HoverCard openDelay={150}>
            <HoverCardTrigger href="#preview" className="font-bold underline underline-offset-2">ARRI Alexa 35 Spec.pdf</HoverCardTrigger>
            <HoverCardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex size-10 items-center justify-center rounded-md border border-border bg-muted"><FileText className="size-4 text-muted-foreground" /></span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">ARRI Alexa 35 Spec.pdf</span>
                  <span className="text-micro text-muted-foreground">PDF · 1.8 MB</span>
                </div>
              </div>
              <p className="border-t border-border pt-3 text-micro text-muted-foreground">Edited today at 4:12 PM by Elias Miller.</p>
            </HoverCardContent>
          </HoverCard>
        </p>
      </GalleryCard>

      <GalleryCard title="4. Preview with toolbar">
        <div className="flex flex-col rounded-xl border border-border bg-white">
          <div role="toolbar" aria-label="Preview tools" className="flex items-center justify-between border-b border-border p-1.5">
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><ZoomIn /></Button>
              <Button variant="ghost" size="icon-sm" aria-label="Refresh"><RefreshCw /></Button>
              <Button variant="ghost" size="icon-sm" aria-label="Download"><Download /></Button>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon-sm" aria-label="Share"><Share /></Button>
              <Button variant="ghost" size="icon-sm" aria-label="Print"><Printer /></Button>
            </div>
          </div>
          <div className="m-3 min-h-28 rounded-lg border border-border p-4">
            <span className="text-small font-bold uppercase">Preview</span>
            <p className="mt-1 text-micro text-muted-foreground">The frame shows the document as it will print, with anamorphic guides.</p>
          </div>
        </div>
      </GalleryCard>
    </GallerySection>
  );
}
