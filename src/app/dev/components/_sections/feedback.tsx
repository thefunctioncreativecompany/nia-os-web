"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banner } from "@/components/nia/banner";
import { ChoicePills } from "@/components/nia/choice-pills";
import { CountedTextarea } from "@/components/nia/counted-textarea";
import { DateField, TimeField } from "@/components/nia/date-time-fields";
import { ExpandableAlert } from "@/components/nia/expandable-alert";
import { MonthPicker } from "@/components/nia/month-picker";
import { NotificationBell, PresenceAvatar } from "@/components/nia/notification-indicators";
import { SearchInput } from "@/components/nia/search-input";
import { ShootDayCard } from "@/components/nia/shoot-day-card";
import { TimeWheel, type TimeValue } from "@/components/nia/time-wheel";
import { GalleryCard, GallerySection } from "../_gallery";

// Static look of a toast, beside a button that fires the real one (sonner).
function ToastPreview({
  tone,
  children,
  action,
}: {
  tone: "success" | "error" | "warning" | "info" | "plain";
  children: React.ReactNode;
  action?: string;
}) {
  const tones = {
    success: { edge: "border-l-nia-success", icon: <Check />, tint: "bg-status-confirmed text-nia-success" },
    error: { edge: "border-l-nia-danger", icon: <CircleAlert />, tint: "bg-status-cancelled text-nia-danger" },
    warning: { edge: "border-l-status-pending-foreground", icon: <TriangleAlert />, tint: "bg-status-pending text-status-pending-foreground" },
    info: { edge: "border-l-status-on-hold-foreground", icon: <Info />, tint: "bg-status-on-hold text-status-on-hold-foreground" },
    plain: { edge: "border-l-border", icon: <Bell />, tint: "text-muted-foreground" },
  }[tone];
  return (
    <div aria-hidden className={cn("flex items-center gap-3 rounded-xl border border-l-4 border-border bg-white px-4 py-3.5 shadow-menu", tones.edge)}>
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5 [&_svg]:stroke-[2.5]", tones.tint)}>{tones.icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">{children}</span>
        {action && <span className={cn("text-small font-bold underline underline-offset-2", tone === "error" ? "text-nia-danger" : "text-foreground")}>{action}</span>}
      </div>
      <X className="size-4 text-muted-foreground" />
    </div>
  );
}

export function NotificationsSection() {
  return (
    <GallerySection
      id="notifications"
      number={8}
      title="Notifications & Toasts"
      figma="957-21014"
      description="Toasts (success, error with retry, warning, info, with action), a global banner and notification badges. toast() from sonner, <Banner>, <NotificationBell>, <PresenceAvatar>."
    >
      <GalleryCard title="1. Success toast">
        <ToastPreview tone="success">Scene 4 saved.</ToastPreview>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => toast.success("Scene 4 saved.")}>Show toast</Button>
      </GalleryCard>
      <GalleryCard title="2. Error toast with retry">
        <ToastPreview tone="error" action="Retry upload">Couldn&apos;t upload the call sheet.</ToastPreview>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => toast.error("Couldn't upload the call sheet.", { action: { label: "Retry upload", onClick: () => toast.success("Uploaded") } })}>Show toast</Button>
      </GalleryCard>
      <GalleryCard title="3. Warning toast">
        <ToastPreview tone="warning">Weather alert may affect outdoor scenes.</ToastPreview>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => toast.warning("Weather alert may affect outdoor scenes.")}>Show toast</Button>
      </GalleryCard>
      <GalleryCard title="4. Info toast">
        <ToastPreview tone="info">New crew member added to the project.</ToastPreview>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => toast.info("New crew member added to the project.")}>Show toast</Button>
      </GalleryCard>
      <GalleryCard title="5. Toast with action">
        <ToastPreview tone="plain" action="View changes">Call sheet updated.</ToastPreview>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => toast("Call sheet updated.", { action: { label: "View changes", onClick: () => {} } })}>Show toast</Button>
      </GalleryCard>
      <GalleryCard title="7. Notification badges & icons">
        <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-3"><NotificationBell count={1} />Dot alert</span>
          <span className="flex items-center gap-3"><NotificationBell count={3} />Count alert</span>
          <span className="flex items-center gap-3"><PresenceAvatar name="Jo Dlamini" active />Active now</span>
        </div>
      </GalleryCard>
      <GalleryCard title="6. Global banner notification" wide>
        <Banner action={<Button variant="outline" size="sm" className="border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white">Open schedule</Button>}>
          Shooting schedule updated: 3 scenes moved to tomorrow.
        </Banner>
      </GalleryCard>
    </GallerySection>
  );
}

export function AlertsSection() {
  return (
    <GallerySection
      id="alerts"
      number={9}
      title="Alerts & Inline Messages"
      figma="957-21102"
      description="Embedded messages in five tones, one with an action, one that expands and dismisses. <Alert variant>, <ExpandableAlert>."
    >
      <GalleryCard title="1. Info alert">
        <Alert variant="info">
          <Info aria-hidden />
          <AlertTitle>Scheduled maintenance tonight</AlertTitle>
          <AlertDescription>Nia will be unavailable for about 10 minutes from 02:00. Your work is saved.</AlertDescription>
        </Alert>
      </GalleryCard>
      <GalleryCard title="2. Success alert">
        <Alert variant="success">
          <Check aria-hidden />
          <AlertTitle>Cast list confirmed for Day 3</AlertTitle>
          <AlertDescription>Everyone has accepted their call. You can generate the breakdown.</AlertDescription>
        </Alert>
      </GalleryCard>
      <GalleryCard title="3. Warning alert">
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle>Location permits missing for 2 scenes</AlertTitle>
          <AlertDescription>Day 5 scenes don&apos;t have filming permits yet. Upload them before the shoot.</AlertDescription>
        </Alert>
      </GalleryCard>
      <GalleryCard title="4. Error / critical alert with action">
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>Schedule conflict</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            Scene 4&apos;s call time clashes with the lead actor&apos;s availability.
            <Button variant="danger" size="sm">Resolve conflict</Button>
          </AlertDescription>
        </Alert>
      </GalleryCard>
      <GalleryCard title="5. Neutral alert">
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Archive policy</AlertTitle>
          <AlertDescription>Wrapped projects move to Archive after 90 days without changes.</AlertDescription>
        </Alert>
      </GalleryCard>
      <GalleryCard title="6. Expandable / dismissible alert">
        <ExpandableAlert
          title="Equipment conflict on Day 12"
          summary="Some camera packages may not be back in time."
          defaultOpen
        >
          The anamorphic lens set is with Unit B until 08:00 on Day 12. Unit A&apos;s call time is 05:00.
        </ExpandableAlert>
      </GalleryCard>
    </GallerySection>
  );
}

// Calendars work out "today" from the clock, which Next can't prerender; samples use a fixed day.
const SAMPLE_TODAY = new Date(2026, 7, 5);

export function PickersSection() {
  const [day, setDay] = useState<Date | undefined>(new Date(2026, 7, 5));
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(2026, 7, 5), to: new Date(2026, 7, 12) });
  const [time, setTime] = useState<TimeValue>({ hour: 6, minute: 0, period: "AM" });
  const [callDate, setCallDate] = useState<Date | undefined>(new Date(2026, 7, 5));
  const [callTime, setCallTime] = useState<TimeValue>({ hour: 6, minute: 0, period: "AM" });
  const [month, setMonth] = useState({ year: 2026, month: 7 });
  const [quick, setQuick] = useState<string | null>("week");
  const days = range?.from && range?.to ? Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) + 1 : 0;

  return (
    <GallerySection
      id="pickers"
      number={10}
      title="Date & Time Pickers"
      figma="957-21167"
      description="Calendar, range, scrollable time, date + time fields, month picker, quick-date pills and the shoot day card. <Calendar>, <TimeWheel>, <DateField>, <TimeField>, <MonthPicker>, <ChoicePills>, <ShootDayCard>."
    >
      <GalleryCard title="1. Calendar date picker">
        <Calendar mode="single" selected={day} onSelect={setDay} today={SAMPLE_TODAY} defaultMonth={new Date(2026, 7, 1)} className="w-full rounded-xl border border-border bg-white p-3 [--cell-size:2.5rem]" />
      </GalleryCard>
      <GalleryCard title="2. Date range picker">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Shoot window</span>
          {days > 0 && <span className="text-small text-nia-success">{days} days selected</span>}
        </div>
        <Calendar mode="range" selected={range} onSelect={setRange} today={SAMPLE_TODAY} defaultMonth={new Date(2026, 7, 1)} className="w-full rounded-xl border border-border bg-white p-3 [--cell-size:2.5rem]" />
      </GalleryCard>
      <GalleryCard title="3. Scrollable time picker">
        <TimeWheel value={time} onChange={setTime} />
      </GalleryCard>
      <GalleryCard title="4. Date + time combined">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="call-date" className="text-small font-bold text-muted-foreground">Date</Label>
            <DateField id="call-date" value={callDate} onChange={setCallDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="call-time" className="text-small font-bold text-muted-foreground">Call time</Label>
            <TimeField id="call-time" value={callTime} onChange={setCallTime} />
          </div>
        </div>
      </GalleryCard>
      <GalleryCard title="5. Month & year picker">
        <MonthPicker year={month.year} month={month.month} onChange={setMonth} />
      </GalleryCard>
      <GalleryCard title="6. Quick date selector (pills)">
        <ChoicePills
          label="Date range"
          value={quick}
          onChange={setQuick}
          options={[
            { value: "today", label: "Today" },
            { value: "tomorrow", label: "Tomorrow" },
            { value: "week", label: "This week" },
            { value: "next", label: "Next week" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </GalleryCard>
      <GalleryCard title="7. Shoot day card">
        <ShootDayCard day={3} date={new Date(2026, 7, 5)} scenes={5} sunrise="05:42" sunset="20:14" />
      </GalleryCard>
    </GallerySection>
  );
}

export function FormsSection() {
  const [title, setTitle] = useState("Harbor kitchen");
  const [call, setCall] = useState("25:00 PM");
  const [synopsis, setSynopsis] = useState("INT. KITCHEN – NIGHT. Elias preps the catch of the day under harsh fluorescent light. Rain beats on the small window.");
  const [query, setQuery] = useState("Kitchen confrontation scene");
  const [gear, setGear] = useState({ alexa: true, primes: false, wireless: true });
  const [priority, setPriority] = useState("high");
  const callInvalid = !/^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i.test(call.trim());

  return (
    <GallerySection
      id="forms"
      number={11}
      title="Input Fields & Form Elements"
      figma="957-21388"
      description="Text inputs with an error state, counted textarea, search, select, checkbox and radio groups. <Field>, <Input>, <CountedTextarea>, <SearchInput>, <Select>, <Checkbox>, <RadioGroup>."
    >
      <GalleryCard title="1. Standard text inputs">
        <Field>
          <FieldLabel htmlFor="f-title" className="text-sm font-bold">Scene title</FieldLabel>
          <Input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-lg text-sm md:text-sm" />
        </Field>
        <Field data-invalid={callInvalid || undefined}>
          <FieldLabel htmlFor="f-call" className={cn("text-sm font-bold", callInvalid && "text-nia-danger")}>Call time</FieldLabel>
          <div className="relative">
            <Input id="f-call" aria-invalid={callInvalid} value={call} onChange={(e) => setCall(e.target.value)} className="h-11 rounded-lg pr-10 text-sm aria-invalid:border-nia-danger md:text-sm" />
            {callInvalid && <CircleAlert aria-hidden className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-nia-danger" />}
          </div>
          {callInvalid && <FieldError className="text-small text-nia-danger">Use a time like 06:30 AM.</FieldError>}
        </Field>
      </GalleryCard>
      <GalleryCard title="2. Multiline textarea">
        <Field>
          <FieldLabel htmlFor="f-synopsis" className="text-sm font-bold">Scene synopsis & action notes</FieldLabel>
          <CountedTextarea id="f-synopsis" value={synopsis} onChange={setSynopsis} maxLength={500} />
        </Field>
      </GalleryCard>
      <GalleryCard title="3. Search input">
        <span className="text-sm font-bold">Filter script library</span>
        <SearchInput label="Filter script library" value={query} onChange={setQuery} />
      </GalleryCard>
      <GalleryCard title="4. Select / dropdown input">
        <Field>
          <FieldLabel htmlFor="f-setting" className="text-sm font-bold">Scene setting</FieldLabel>
          <Select defaultValue="kitchen">
            <SelectTrigger id="f-setting" className="h-11 w-full rounded-lg text-sm data-[size=default]:h-11"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="kitchen">INT. KITCHEN – NIGHT</SelectItem>
              <SelectItem value="pier">EXT. PIER – DAWN</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </GalleryCard>
      <GalleryCard title="5. Checkbox group">
        <FieldSet className="gap-3">
          <FieldLegend className="text-sm font-bold">Required equipment</FieldLegend>
          {[
            ["alexa", "ARRI Alexa 35 package"],
            ["primes", "Anamorphic prime lens kit"],
            ["wireless", "Wireless video transmitters"],
          ].map(([key, label]) => {
            const k = key as keyof typeof gear;
            return (
              <div key={key} className="flex items-center gap-3">
                <Checkbox id={`gear-${key}`} checked={gear[k]} onCheckedChange={(c) => setGear((g) => ({ ...g, [k]: c === true }))} />
                <Label htmlFor={`gear-${key}`} className={gear[k] ? "text-sm font-bold" : "text-sm font-normal text-muted-foreground"}>{label}</Label>
              </div>
            );
          })}
        </FieldSet>
      </GalleryCard>
      <GalleryCard title="6. Radio button group">
        <FieldSet className="gap-3">
          <FieldLegend className="text-sm font-bold">Shot priority</FieldLegend>
          <RadioGroup value={priority} onValueChange={setPriority} className="gap-3">
            {[
              ["high", "High (main action)"],
              ["medium", "Medium (B-roll / inserts)"],
              ["low", "Low (atmosphere)"],
            ].map(([value, label]) => (
              <div key={value} className="flex items-center gap-3">
                <RadioGroupItem id={`pri-${value}`} value={value} />
                <Label htmlFor={`pri-${value}`} className={priority === value ? "text-sm font-bold" : "text-sm font-normal text-muted-foreground"}>{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </FieldSet>
      </GalleryCard>
    </GallerySection>
  );
}
