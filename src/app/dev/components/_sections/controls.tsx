"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dots } from "@/components/nia/dots";
import { NumberStepper } from "@/components/nia/number-stepper";
import { Steps } from "@/components/nia/steps";
import { GalleryCard, GallerySection, StateRow } from "../_gallery";

// Hover and pressed rows force the look of that state so all four sit side by side.
const STATES = [
  { label: "Default", className: "" },
  { label: "Hover", hover: true },
  { label: "Pressed", pressed: true },
  { label: "Disabled", disabled: true },
] as const;

export function ButtonsSection() {
  const variants = [
    { title: "1. Primary buttons", variant: "default", size: "md", text: "Primary Button", hover: "bg-primary/85", pressed: "bg-primary translate-y-px" },
    { title: "2. Secondary buttons", variant: "outline", size: "md", text: "Secondary Button", hover: "border-foreground", pressed: "bg-muted" },
    { title: "3. Ghost & text buttons", variant: "ghost", size: "md", text: "Ghost Button", hover: "bg-muted text-foreground", pressed: "text-foreground" },
    { title: "4. Destructive buttons", variant: "danger", size: "md", text: "Delete Entry", hover: "bg-nia-danger/90", pressed: "bg-nia-danger translate-y-px" },
  ] as const;
  const pill = { title: "6. Pill buttons", variant: "default", size: "pill", text: "Pill CTA", hover: "bg-primary/85", pressed: "bg-primary translate-y-px" } as const;

  const card = (v: (typeof variants)[number] | typeof pill) => (
    <GalleryCard key={v.title} title={v.title}>
      {STATES.map((state) => (
        <StateRow key={state.label} label={state.label}>
          <Button
            variant={v.variant}
            size={v.size}
            disabled={"disabled" in state}
            className={"hover" in state ? v.hover : "pressed" in state ? v.pressed : undefined}
          >
            {v.text}
          </Button>
        </StateRow>
      ))}
    </GalleryCard>
  );

  return (
    <GallerySection
      id="buttons"
      number={1}
      title="Buttons"
      figma="957-19992"
      description="Eight variations across Default, Hover, Pressed and Disabled. <Button variant size>; pill is the default size."
    >
      {variants.map(card)}
      <GalleryCard title="5. Icon buttons">
        {STATES.map((state) => (
          <StateRow key={state.label} label={state.label}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Search"
              disabled={"disabled" in state}
              className={cn("rounded-md", "hover" in state && "border-foreground", "pressed" in state && "bg-muted")}
            >
              <Search />
            </Button>
          </StateRow>
        ))}
      </GalleryCard>
      {card(pill)}
      <GalleryCard title="7. Button with icon">
        {STATES.map((state) => (
          <StateRow key={state.label} label={state.label}>
            <Button
              size="md"
              disabled={"disabled" in state}
              className={"hover" in state ? "bg-primary/85" : "pressed" in state ? "translate-y-px" : undefined}
            >
              <ArrowRight data-icon="inline-start" />
              Proceed Next
            </Button>
          </StateRow>
        ))}
      </GalleryCard>
      <GalleryCard title="8. Small & large scales">
        <StateRow label="Small (32px)">
          <Button size="sm">Compact Action</Button>
        </StateRow>
        <StateRow label="Medium (40px)">
          <Button size="md">Medium Action</Button>
        </StateRow>
        <StateRow label="Large (48px)">
          <Button size="lg">Prominent Action</Button>
        </StateRow>
        <StateRow label="Pill (44px)">
          <Button>Default Pill</Button>
        </StateRow>
      </GalleryCard>
    </GallerySection>
  );
}

export function TogglesSection() {
  const [on, setOn] = useState({ a: true, b: false, assistant: true, vendor: false, sync: true, mini: true, miniOff: false, large: true, largeOff: false, override: true, protect: false });
  const flip = (key: keyof typeof on) => (checked: boolean) => setOn((s) => ({ ...s, [key]: checked }));

  return (
    <GallerySection
      id="toggles"
      number={2}
      title="Toggles"
      figma="957-20166"
      description="Binary switches with labels, descriptions, three sizes and an icon variant. <Switch size tone withIcon>."
    >
      <GalleryCard title="1. Standard toggles">
        <ToggleLine id="t-on" label="Active (On)" checked={on.a} onChange={flip("a")} bold />
        <ToggleLine id="t-off" label="Inactive (Off)" checked={on.b} onChange={flip("b")} />
      </GalleryCard>
      <GalleryCard title="2. Toggle with label">
        {[
          { id: "t-assistant", label: "Enable AI suggestions", key: "assistant" as const },
          { id: "t-vendor", label: "Allow external vendor exports", key: "vendor" as const },
        ].map((row) => (
          <div key={row.id} className="flex items-center gap-3">
            <Switch id={row.id} size="lg" checked={on[row.key]} onCheckedChange={flip(row.key)} />
            <Label htmlFor={row.id} className={on[row.key] ? "text-sm font-medium" : "text-sm font-normal text-muted-foreground"}>
              {row.label}
            </Label>
          </div>
        ))}
      </GalleryCard>
      <GalleryCard title="3. Toggle with description">
        <div className="flex items-start gap-3">
          <Switch id="t-sync" size="lg" checked={on.sync} onCheckedChange={flip("sync")} className="mt-0.5" />
          <div className="flex flex-col gap-1">
            <Label htmlFor="t-sync" className="text-sm font-bold">
              Real-time sync
            </Label>
            <p className="text-small text-muted-foreground">
              Continuously saves draft breakdown notes and scene reports to cloud backups.
            </p>
          </div>
        </div>
      </GalleryCard>
      <GalleryCard title="4. Small toggle">
        <ToggleLine id="t-mini" label="Mini switch (On)" checked={on.mini} onChange={flip("mini")} size="sm" small />
        <ToggleLine id="t-mini-off" label="Mini switch (Off)" checked={on.miniOff} onChange={flip("miniOff")} size="sm" small />
      </GalleryCard>
      <GalleryCard title="5. Large toggle">
        <ToggleLine id="t-large" label="Enhanced (On)" checked={on.large} onChange={flip("large")} size="lg" bold />
        <ToggleLine id="t-large-off" label="Enhanced (Off)" checked={on.largeOff} onChange={flip("largeOff")} size="lg" />
      </GalleryCard>
      <GalleryCard title="6. Toggle with icon">
        <ToggleLine id="t-override" label="System override" checked={on.override} onChange={flip("override")} size="lg" tone="danger" withIcon />
        <ToggleLine id="t-protect" label="Protected mode" checked={on.protect} onChange={flip("protect")} size="lg" withIcon />
      </GalleryCard>
    </GallerySection>
  );
}

function ToggleLine({
  id,
  label,
  checked,
  onChange,
  size = "lg",
  tone,
  withIcon,
  bold,
  small,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "default" | "lg";
  tone?: "default" | "danger";
  withIcon?: boolean;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label
        htmlFor={id}
        className={cn(small ? "text-small" : "text-sm", bold ? "font-bold text-foreground" : "font-medium text-muted-foreground")}
      >
        {label}
      </Label>
      <Switch id={id} size={size} tone={tone} withIcon={withIcon} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SlidersSection() {
  const [volume, setVolume] = useState([72]);
  const [budget, setBudget] = useState([150, 850]);
  const [latency, setLatency] = useState(45);
  const [crew, setCrew] = useState([3]);
  const [light, setLight] = useState([100]);
  const [price, setPrice] = useState(56);

  return (
    <GallerySection
      id="sliders"
      number={3}
      title="Sliders & Steppers"
      figma="957-20242"
      description="Numeric adjustments: single, range, with input, stepped, labelled, and the price stepper. <Slider>, <NumberStepper>."
    >
      <GalleryCard title="1. Simple slider">
        <SliderHeader label="Audio volume" value={`${volume[0]}%`} />
        <Slider aria-label="Audio volume" value={volume} onValueChange={setVolume} max={100} />
      </GalleryCard>
      <GalleryCard title="2. Range slider">
        <SliderHeader label="Budget window" value={`$${budget[0]} – $${budget[1]}`} />
        <Slider aria-label="Budget window" value={budget} onValueChange={setBudget} max={1000} step={10} />
      </GalleryCard>
      <GalleryCard title="3. Slider with input">
        <span className="text-sm font-bold text-foreground">Frame buffer latency</span>
        <div className="flex items-center gap-5">
          <Slider aria-label="Frame buffer latency" value={[latency]} onValueChange={([v]) => setLatency(v)} max={100} className="flex-1" />
          <div className="relative w-24">
            <Input
              type="number"
              aria-label="Latency in milliseconds"
              min={0}
              max={100}
              value={latency}
              onChange={(e) => setLatency(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="h-9 rounded-md pr-9 text-center text-sm font-semibold md:text-sm"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-small text-muted-foreground">
              ms
            </span>
          </div>
        </div>
      </GalleryCard>
      <GalleryCard title="4. Stepped slider">
        <SliderHeader label="Crew multiplier" value={`Step ${crew[0]} of 5`} />
        <Slider aria-label="Crew multiplier" value={crew} onValueChange={setCrew} min={1} max={5} step={1} />
        <div className="flex justify-between text-micro text-muted-foreground">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n === crew[0] ? "font-bold text-foreground" : undefined}>
              {n}x
            </span>
          ))}
        </div>
      </GalleryCard>
      <GalleryCard title="5. Slider with labels">
        <SliderHeader label="Lighting level" value={light[0] === 100 ? "Maximum" : `${light[0]}%`} />
        <div className="flex items-center gap-3 text-micro font-semibold text-muted-foreground">
          <span>Min</span>
          <Slider aria-label="Lighting level" value={light} onValueChange={setLight} max={100} className="flex-1" />
          <span>Max</span>
        </div>
      </GalleryCard>
      <GalleryCard title="6. Stepper / price & quantity">
        <span className="text-sm font-bold text-foreground">Base price per shooting scene</span>
        <NumberStepper label="Base price" value={price} onChange={setPrice} min={0} max={100} step={0.5} prefix="$" decimals={2} showRange />
      </GalleryCard>
    </GallerySection>
  );
}

function SliderHeader({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm font-bold text-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function PageControlsSection() {
  const [page, setPage] = useState(2);
  const [tab, setTab] = useState("breakdown");
  const [segment, setSegment] = useState("day");
  const [slide, setSlide] = useState(2);

  return (
    <GallerySection
      id="page-controls"
      number={4}
      title="Page Controls"
      figma="957-20321"
      description="Pagination, tabs, segmented control, breadcrumbs, wizard steps and carousel dots. <Pagination>, <Tabs>, <Breadcrumb>, <Steps>, <Dots>."
    >
      <GalleryCard title="1. Pagination (table nav)">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#page-controls" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
            </PaginationItem>
            {[1, 2, 3].map((n) => (
              <PaginationItem key={n}>
                <PaginationLink href="#page-controls" isActive={page === n} onClick={(e) => { e.preventDefault(); setPage(n); }}>
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#page-controls" isActive={page === 12} onClick={(e) => { e.preventDefault(); setPage(12); }}>
                12
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#page-controls" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(12, p + 1)); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </GalleryCard>
      <GalleryCard title="2. Tabs navigation">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="w-full justify-start gap-6 overflow-x-auto border-b border-border">
            {[
              ["breakdown", "Breakdown Sheets"],
              ["call", "Call Sheets"],
              ["av", "AV Scripts"],
              ["gear", "Equipment Logs"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="flex-none px-0 text-sm data-active:font-bold">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </GalleryCard>
      <GalleryCard title="3. Segmented controls">
        <Tabs value={segment} onValueChange={setSegment}>
          <TabsList className="h-10 w-full bg-muted p-1">
            {[
              ["day", "Day Schedule"],
              ["night", "Night Shoots"],
              ["splits", "Splits & Rehearsals"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="text-small data-active:bg-white data-active:font-bold">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </GalleryCard>
      <GalleryCard title="4. Breadcrumbs">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="#page-controls">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#page-controls">Breakdown sheets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold">Script breakdown</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </GalleryCard>
      <GalleryCard title="5. Stepper / wizard checklist">
        <Steps steps={["Script import", "Breakdown details", "Export PDF"]} current={1} />
      </GalleryCard>
      <GalleryCard title="6. Dot carousel indicators">
        <Dots count={5} current={slide} onSelect={setSlide} className="justify-center" />
      </GalleryCard>
    </GallerySection>
  );
}
