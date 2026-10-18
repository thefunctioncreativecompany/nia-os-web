"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import bts from "@/assets/hero/03-sinners-bts-camera.png";
import church from "@/assets/hero/01-sinners-bts-church.png";
import crane from "@/assets/hero/04-sinners-bts-crane.png";
import backrooms from "@/assets/hero/06-backrooms.webp";
import fitting from "@/assets/hero/10-studio-fitting.jpg";
import showroom from "@/assets/hero/11-showroom.jpg";
import team from "@/assets/hero/12-studio-team.jpg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetLibrary } from "@/components/nia/asset-library";
import { ColorPicker } from "@/components/nia/color-picker";
import { DatePickerDialog } from "@/components/nia/date-picker-dialog";
import { DurationPicker } from "@/components/nia/duration-picker";
import { ExpandableRow } from "@/components/nia/expandable-row";
import { Filmstrip } from "@/components/nia/filmstrip";
import { ChatThread, InboxItem, MentionCard, NotificationGroup, NotificationItem, Timeline } from "@/components/nia/inbox";
import { Lightbox, type LightboxImage } from "@/components/nia/lightbox";
import { PeoplePicker } from "@/components/nia/people-picker";
import { PhotoGrid } from "@/components/nia/photo-grid";
import { StatusBadge } from "@/components/nia/status-badge";
import { StoryboardGrid } from "@/components/nia/storyboard-grid";
import { TimeSlots } from "@/components/nia/time-slots";
import { TimeWheel, type TimeValue } from "@/components/nia/time-wheel";
import { GalleryCard, GallerySection } from "../_gallery";

// Fixed "today" so the prerendered calendar doesn't read the clock.
const SAMPLE_TODAY = new Date(2026, 9, 1);

export function AdvancedPickersSection() {
  const [date, setDate] = useState<Date | undefined>(SAMPLE_TODAY);
  const [time, setTime] = useState<TimeValue>({ hour: 6, minute: 0, period: "AM" });
  const [slot, setSlot] = useState<string | null>("0830");
  const [color, setColor] = useState("#FF5D6F");
  const [duration, setDuration] = useState(150);
  const [crew, setCrew] = useState(["maya", "elias"]);

  return (
    <GallerySection
      id="advanced-pickers"
      number={16}
      title="Pickers: Advanced"
      figma="957-21800"
      description="Date in a dialog with Confirm, a scrolling time dial, time slots, colour, duration and people. <DatePickerDialog>, <TimeWheel>, <TimeSlots>, <ColorPicker>, <DurationPicker>, <PeoplePicker>."
    >
      <GalleryCard title="1. Date picker dialog" description="Nothing changes until Confirm.">
        <DatePickerDialog value={date} onChange={setDate} title="Shoot date" today={SAMPLE_TODAY}>
          <Button variant="outline" size="md" className="w-fit">
            <CalendarDays />
            {date ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Pick a shoot date"}
          </Button>
        </DatePickerDialog>
      </GalleryCard>

      <GalleryCard title="2. Dial / scroll picker" description="Same as Section 10.3: <TimeWheel>.">
        <TimeWheel value={time} onChange={setTime} />
      </GalleryCard>

      <GalleryCard title="3. Time slot picker" description="Free and booked slots.">
        <TimeSlots
          label="Call time"
          value={slot}
          onChange={setSlot}
          slots={[
            { value: "0600", label: "06:00 AM" },
            { value: "0630", label: "06:30 AM", booked: true },
            { value: "0700", label: "07:00 AM" },
            { value: "0730", label: "07:30 AM" },
            { value: "0800", label: "08:00 AM" },
            { value: "0830", label: "08:30 AM" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="4. Colour picker" description="Drag, use arrow keys, or type a hex value.">
        <ColorPicker label="Practical light colour" value={color} onChange={setColor} />
      </GalleryCard>

      <GalleryCard title="5. Duration picker" description="Scene length in hours and minutes.">
        <DurationPicker value={duration} onChange={setDuration} />
      </GalleryCard>

      <GalleryCard title="6. People picker" description="Search and tick crew to assign.">
        <PeoplePicker
          label="Crew"
          selected={crew}
          onChange={setCrew}
          people={[
            { id: "maya", name: "Maya Alvarez", role: "DP" },
            { id: "elias", name: "Elias Miller", role: "Director" },
            { id: "sarah", name: "Sarah Connor", role: "Producer" },
          ]}
        />
      </GalleryCard>
    </GallerySection>
  );
}

const STILLS: LightboxImage[] = [
  { src: bts, alt: "Camera operator on set", title: "Camera setup" },
  { src: showroom, alt: "Showroom interior", title: "Reference location scout" },
  { src: crane, alt: "Crane shot rig", title: "Crane rig" },
  { src: fitting, alt: "Wardrobe fitting in the studio", title: "Wardrobe fitting" },
  { src: church, alt: "Crew outside a church", title: "Church exterior" },
  { src: team, alt: "Production team in the studio", title: "Studio team" },
];

export function MediaSection() {
  const [frame, setFrame] = useState<string | null>("s2");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(1);

  return (
    <GallerySection
      id="media"
      number={17}
      title="Gallery / Media Grid"
      figma="957-21956"
      description="Stills, scene strips, storyboards, project files and a full-screen viewer. <PhotoGrid>, <Filmstrip>, <StoryboardGrid>, <AssetLibrary>, <Lightbox>."
    >
      <GalleryCard title="1. Photo grid" description="Masonry; click a still to view it.">
        <PhotoGrid images={STILLS} />
      </GalleryCard>

      <GalleryCard title="2. Filmstrip" description="Scenes in order; scrolls sideways.">
        <Filmstrip
          label="Scenes"
          selected={frame}
          onSelect={setFrame}
          frames={[
            { id: "s1", src: bts, label: "Scene 1" },
            { id: "s2", src: church, label: "Scene 2" },
            { id: "s3", src: backrooms, label: "Scene 3" },
            { id: "s4", src: crane, label: "Scene 4" },
            { id: "s5", src: showroom, label: "Scene 5" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="3. Storyboard grid" description="Frames with shot codes.">
        <StoryboardGrid
          frames={[
            { id: "f1", src: church, code: "S1.F1", caption: "Wide on the church" },
            { id: "f2", src: crane, code: "S1.F2", caption: "Crane down to crowd" },
            { id: "f3", src: bts, code: "S1.F3", caption: "Close-up on dial" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="4. Asset library" description="Grid or list.">
        <AssetLibrary
          assets={[
            { id: "a1", name: "Preview_04.jpg", size: "800 KB", kind: "image" },
            { id: "a2", name: "call-sheet-v3.pdf", size: "8.1 MB", kind: "document" },
            { id: "a3", name: "Kitchen_take2.mov", size: "1.2 GB", kind: "video" },
            { id: "a4", name: "Lookbook.pdf", size: "24 MB", kind: "document" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="5. Lightbox" description="Dark full-screen viewer; arrow keys step through." wide>
        <Button variant="outline" size="md" className="w-fit" onClick={() => setOpen(true)}>Open viewer</Button>
        <Lightbox images={STILLS} index={index} onIndexChange={setIndex} open={open} onOpenChange={setOpen} />
      </GalleryCard>
    </GallerySection>
  );
}

const CREW_ROWS = [
  { id: "elias", name: "Elias Miller", role: "Director", title: "Director / Executive Producer" },
  { id: "maya", name: "Maya Alvarez", role: "DP", title: "Director of Photography" },
];

export function TablesSection() {
  const [checked, setChecked] = useState<string[]>([]);

  return (
    <GallerySection
      id="tables"
      number={18}
      title="Tables"
      figma="957-22068"
      description="Scenes, schedules and crew in rows: standard, compact, with actions, expandable and status. <Table>, <ExpandableRow>, <StatusBadge>."
    >
      <GalleryCard title="1. Standard data table" wide>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Scene</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cast</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold">SCENE 04</TableCell>
              <TableCell className="text-muted-foreground">Shoreline Seafood Kitchen initial intro</TableCell>
              <TableCell className="text-muted-foreground">Elias, Maya</TableCell>
              <TableCell className="text-muted-foreground">INT. KITCHEN - NIGHT</TableCell>
              <TableCell><StatusBadge status="confirmed">Ready</StatusBadge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">SCENE 12</TableCell>
              <TableCell className="text-muted-foreground">Exterior dawn car transition sequence</TableCell>
              <TableCell className="text-muted-foreground">Sarah, Pilot</TableCell>
              <TableCell className="text-muted-foreground">EXT. HIGHWAY - DAWN</TableCell>
              <TableCell><StatusBadge status="pending" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </GalleryCard>

      <GalleryCard title="2. Compact table" description="Dense rows for schedules." wide>
        <Table className="text-small">
          <TableBody>
            {[
              ["05:00 AM", "Crew Call / Camera Prep", "Camera", "45m"],
              ["05:45 AM", "Lighting setup breakfast diner scene", "Grip/Electric", "30m"],
              ["06:15 AM", "Block and Rehearse Scene 4", "Director/Cast", "20m"],
            ].map(([time, task, dept, length]) => (
              <TableRow key={time}>
                <TableCell className="w-28 py-2 font-bold">{time}</TableCell>
                <TableCell className="py-2">{task}</TableCell>
                <TableCell className="py-2 text-muted-foreground">{dept}</TableCell>
                <TableCell className="w-16 py-2 text-muted-foreground">{length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GalleryCard>

      <GalleryCard title="3. Table with actions" description="Select rows; edit or remove each." wide>
        <Table>
          <TableBody>
            {CREW_ROWS.map((row) => (
              <TableRow key={row.id} data-state={checked.includes(row.id) ? "selected" : undefined}>
                <TableCell className="w-10">
                  <Checkbox
                    aria-label={`Select ${row.name}`}
                    checked={checked.includes(row.id)}
                    onCheckedChange={(on) => setChecked((c) => (on ? [...c, row.id] : c.filter((x) => x !== row.id)))}
                  />
                </TableCell>
                <TableCell className="font-bold">{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell className="text-muted-foreground">{row.title}</TableCell>
                <TableCell className="w-20">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.name}`} onClick={() => toast(`Editing ${row.name}`)}><Pencil /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${row.name}`} className="text-nia-danger hover:text-nia-danger" onClick={() => toast(`${row.name} removed`)}><Trash2 /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GalleryCard>

      <GalleryCard title="4. Expandable table" description="Open a row for its details." wide>
        <Table>
          <TableBody>
            <ExpandableRow
              label="Scene 04 details"
              defaultOpen
              colSpan={3}
              cells={[<span key="s" className="font-bold">SCENE 04</span>, "Shoreline Seafood Kitchen sequence"]}
            >
              <p>Detailed food prep tracking and interior neon lighting alignment.</p>
              <p className="mt-1">Steadicam rig, anamorphic lenses, fog machine (low density).</p>
            </ExpandableRow>
            <ExpandableRow
              label="Scene 12 details"
              colSpan={3}
              cells={[<span key="s" className="font-bold">SCENE 12</span>, "Exterior dawn car transition"]}
            >
              <p>Picture car on a low loader; golden-hour window of 40 minutes.</p>
            </ExpandableRow>
          </TableBody>
        </Table>
      </GalleryCard>

      <GalleryCard title="5. Status table" wide>
        <Table>
          <TableBody>
            {[
              { id: "S4", name: "Kitchen Shoot", status: "confirmed" as const, label: "On Set" },
              { id: "S5", name: "Exterior transition", status: "on-hold" as const },
              { id: "S6", name: "Wrap procedures", status: "wrapped" as const },
            ].map((row) => (
              <TableRow key={row.id}>
                <TableCell className="w-16 font-bold">{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell className="w-32 text-right">
                  <StatusBadge status={row.status}>{row.label}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GalleryCard>
    </GallerySection>
  );
}

export function InboxSection() {
  const [unread, setUnread] = useState(true);

  return (
    <GallerySection
      id="inbox"
      number={19}
      title="Inbox / Notifications List"
      figma="957-22182"
      description="Messages, the activity log, grouped notifications, a channel preview and mentions. <InboxItem>, <Timeline>, <NotificationGroup>, <ChatThread>, <MentionCard>."
    >
      <GalleryCard title="1. Inbox list">
        <ul className="flex flex-col gap-2.5">
          <li><InboxItem sender="Maya Alvarez" preview="Call sheet update verified for Friday" time="10m ago" unread /></li>
          <li><InboxItem sender="Elias Miller" preview="Review the Scene 4 camera path" time="2h ago" /></li>
        </ul>
      </GalleryCard>

      <GalleryCard title="2. Activity feed">
        <Timeline
          entries={[
            { id: "1", text: "Updated the call sheet timeline", object: "CallSheet_D12.pdf", time: "12m ago" },
            { id: "2", text: "Finalized Scene 4 camera rig specs", object: "Scene-04-Metadata", time: "1h ago" },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="3. Notification center" description="Grouped by day.">
        <NotificationGroup
          label="Today"
          action={
            <button
              type="button"
              disabled={!unread}
              onClick={() => setUnread(false)}
              className="rounded-sm text-small font-bold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 disabled:font-normal disabled:text-muted-foreground disabled:no-underline"
            >
              {unread ? "Mark all read" : "All read"}
            </button>
          }
        >
          <NotificationItem title="Overlapping schedule" description="Day 12 transport clashes with the Scene 4 call time." />
        </NotificationGroup>
      </GalleryCard>

      <GalleryCard title="4. Chat / thread preview">
        <ChatThread
          channel="Scene 4 Crew Channel"
          online
          messages={[
            { id: "1", author: "Maya", text: "Steadicam is ready for the kitchen run." },
            { id: "2", author: "You", text: "Confirmed. Clear path set.", mine: true },
          ]}
        />
      </GalleryCard>

      <GalleryCard title="5. Mention feed">
        <MentionCard
          title="Mentioned in Scene 4 Notes"
          time="4m ago"
          quote={<>“Please coordinate with <strong className="font-bold text-foreground">@Maya</strong> to check the lens limits before 05:00 AM.”</>}
          action={<a href="#inbox" className="w-fit rounded-sm text-small font-bold text-foreground hover:underline">Go to scene notes</a>}
        />
      </GalleryCard>
    </GallerySection>
  );
}
