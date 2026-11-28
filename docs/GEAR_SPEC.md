# Gear: planning a shoot's kit and managing it on set

Outlined 2026-11-28 with Ika ("this is not really for marketplace feature yet, but for projects:
planning a new shoot, managing gear on set"). Built the way Cast & crew is built (Milestone 4.1):
a tab on the project page, its own page at `/projects/[id]/gear`, a list per workspace and a line
per project. Marketplace (leasing and buying gear) stays a separate, later feature and can read the
same catalogue when it comes.

**Where this stands.** The framework is in the repo and nothing is live:

| Done | File |
|---|---|
| The catalogue: 667 items in 16 departments (ShareGrid's rental categories, items from Glow Hire's catalogue, Magic Lightbox's online catalogue and B&H's "Essential gear for the working pro"; colour, size and length variants folded into one item) | `src/data/gear/catalog.json`, `src/data/gear/taxonomy.json` |
| The tables and access rules (not run) | `supabase/migrations/20261128000000_gear.sql` |
| The catalogue's data (not run; written by the script, never by hand) | `supabase/migrations/20261128010000_gear_catalog_v1.sql`, `scripts/build-gear-catalog-seed.mjs` |
| Search, reading pasted lists, departments for typed gear | `src/features/gear/catalog.ts` |
| A project's list: statuses, sources, grouping, counts, sample data | `src/features/gear/list.ts` |
| Reading a project's gear (server) | `src/features/gear/data.ts` |
| Finding gear to add, on first use (browser) | `src/features/gear/search.ts` |
| Adding, changing and removing gear (browser) | `src/features/gear/mutations.ts` |
| Tests (14) | `src/features/gear/gear.test.ts` |

Checked 2026-11-28 outside the app: the tests and type checks pass; both migrations ran twice on
Postgres 16 with stand-ins for Nia's tables (668 items loaded, nothing retired); 12 access checks
with two accounts pass (a second account can't see, add to or change another workspace's gear;
the catalogue is read-only; the person responsible must be on the project's cast & crew; one line
per kit item per project; one kit item per catalogue item per workspace; a removed line can be
added again). They still need running for real in step G1 (Standard checks).

Reviewed and fixed 2026-11-28, before G1: a line can no longer be pointed at, or moved to, another
team's kit or project; adding gear is one database call, `add_project_gear`, all or nothing, which
also lets crew invited to a project as editors add new kit (they aren't members of the team that
owns it); every change checks the database saved it (a blocked change otherwise looks saved);
search ignores punctuation; lines in a department Nia doesn't know show under Other; 21 catalogue
ids cleaned (`rode-rode-…`, `h-hnel-…`, `zeiss-carl-zeiss-…`), the unverified "Canon 14mm T2.8
(verify model)" taken out until its model is known, the Sony VCT-U14 plate moved to Tripods &
heads; each new catalogue version gets its own migration timestamp. Checked on PGlite (Postgres
17) with stand-ins for Nia's tables: 18 checks pass, including the crew, viewer and other-team cases.

No screens are built. Per CLAUDE.md, the Gear tab, the Gear page and the Add gear pop-up are
designed in Claude Design and reconciled into Figma first (the brief is at the end).

## What it is

Every shoot has a gear list: what's coming, how many, whether it's the team's own kit or a rental,
which rental house, who looks after it, and where it stands. Producers and DPs keep it today in
WhatsApp threads, notes apps, spreadsheets and the rental house's quote. Nia keeps it with the
project: built from a catalogue so nobody types "Aputure 600x Pro" twice, checked off as it's
booked, packed and returned, and there for the next shoot.

The jobs it serves, in order:

1. **Planning a shoot.** Build the list fast: search, pick from the team's own kit or the
   catalogue, or paste the list the DP sent ("2x C-stand", "Sony FX3, 1").
2. **Booking.** See what's still to book, grouped by rental house, for the quote and the pick-up run.
3. **On set.** Tick gear packed on the way out and returned at wrap, from a phone.
4. **Next time.** Everything used once is on the workspace's kit list, with who owns it and its
   serial number.

## Where it lives

- **Project → Gear tab**, right after Crew & talent (`Overview · Crew & talent · Gear · Documents ·
  References · Comments · Activity`), with its count like the other tabs. Like Crew & talent, the
  tab shows a short summary and a way in: the department counts in a row, one line of where things
  stand ("3 to book · 9 packed"), and `ViewAll` → **Manage gear** (editors) or **Open gear**
  (viewers). Empty: one line and the Add gear button for editors.
- **`/projects/[id]/gear`**, the Gear page, built like `/projects/[id]/crew`
  (`CastCrewDirectory`): `BackLink` "← Back to project" and the project's name, the title "Gear",
  the counts on the right ("14 items · 3 to book"), then filters and the list. The line in focus
  opens in the side panel (below on phones and tablets), as a person does in Cast & crew.
- **Global search** finds gear on a project by name and brand, in the Projects group (rule: search
  keeps up with the data). Step G3.
- **Documents** later: the Equipment Rental Log template fills itself from the rental lines
  (step G5), and the call sheet can list the day's key kit.

## The Gear page

- **One primary action: Add gear** (Nia Blue). Everything else is grey.
- **Filters** from `filter-bar.tsx`, in a `ChipRow`: `ChipMenu` "Department: All ▾", status chips
  (Needed, Booked, Packed, Returned, each with its count), `ChipMenu` "Source: All ▾" (Own kit,
  Rental, Borrowed, Client's). `ResultCount` when filtered.
- **The list**, grouped by department in `GEAR_DEPARTMENTS` order (prep to wrap: cameras, lenses,
  camera accessories, support, monitors, lighting, grip, power, audio, media, live production,
  atmospherics, expendables, production & unit, drones & vehicles, other), each group collapsible
  with its count, as Cast & crew's departments are. A line: the picture (the team's own photo, else
  a licensed catalogue picture, else the department's Lucide icon on grey), the name and brand,
  the quantity, the source and rental house, the person responsible (initials), and the status.
- **Status in one tap**, like Cast & crew's: a menu on the status, and Needed → Booked → Packed →
  Returned (`nextStatus`). Editors only; viewers see the badge.
- **Several at once**: select lines (or a whole department) → Mark booked / packed / returned. This
  is the on-set job: tick the van load in one go at the rental house and at wrap.
- **The side panel** (a line in focus): quantity, source, rental house, the days it's needed
  (empty: the whole shoot), who's responsible (picked from the project's cast & crew), notes;
  then the kit's own details: owner, serial number, how many the team owns, its photo. Remove
  from project (soft delete) at the bottom; the kit stays on the workspace's list.
- **Phones**: the list and status taps work one-handed; filters swipe in one line (`ChipRow`).

## Adding gear (the pop-up)

Built like Cast & crew's quick add (`quick-add-people.tsx`, Ika 2026-11-15: "just add name, role…
as a start"): a line is enough, details come later.

1. **One search field.** As they type (`findGear`, read on first use, never with the page):
   **Your kit** first (what the team has used before, with "You own 2"), then **Nia catalogue**
   (name, brand, category, and variants such as "6x6 to 20x20"). Enter on a typed name with no
   pick adds it as typed; it lands in a department from its words (`guessDepartment`).
2. **Quantity** beside each pick (1 by default).
3. **Paste a list**: one item a line, quantities either end (`parseGearLines`). Each line is
   matched to the kit, then the catalogue, and shown for a check before adding ("2 × C-Stand 40"
   from the catalogue", "Hazer → Antari HZ-400 Haze Machine?"), never added unseen.
4. **Browse**: the catalogue by department (`catalogDepartment`) for someone who doesn't know the
   names yet (the beginner and Learn audiences).
5. **Add** puts everything on the project as Needed, source Own kit when the team owns it, else
   Rental. Something already on the project gets its quantity raised, not a second line
   (`addGear` returns the names, for the toast: "Added 6. C-stand: now 6.").

## Data

Three tables, in `20261128000000_gear.sql`; the same shape and rules as `people` / `cast_crew`:

| Table | What a row is | Key fields |
|---|---|---|
| `gear_catalog` | One item of Nia's catalogue, the same for everyone | `id` (readable, never changes: `sony-fx3`), `name`, `brand` (empty for generic gear), `department`, `category`, `kind` (`branded` / `generic`), `variants`, `image_url` (licensed only), `sources`, `position`, `retired_at` |
| `gear` | One piece of kit on a workspace's list | `workspace_id`, `catalog_id` (optional), `name`, `brand`, `department` and `category` (empty: from the catalogue), `quantity_owned`, `owner`, `vendor` (the usual rental house), `serial_number`, `photo_url`, `notes`, `deleted_at` |
| `project_gear` | One line of a project's gear list | `project_id`, `gear_id`, `quantity`, `source` (`owned` / `rental` / `borrowed` / `client`), `vendor`, `needed_from`, `needed_to`, `responsible_id` (a person on the project's cast & crew), `status` (`needed` / `booked` / `packed` / `returned`), `notes`, `position`, `deleted_at` |

Who can see what: everyone signed in reads the catalogue, and only the SQL Editor changes it;
workspace members see and add to their kit list; anyone who can open a project sees its gear;
people who can edit a project change it, and add gear through `add_project_gear` (which puts new
kit on the project's team list, so invited crew can build the list too). Kit details (name, serial,
owner) are changed by the team's members only. One line per kit item per project, one kit item per
catalogue item per workspace.

Not in the tables on purpose (scope): prices, day rates and totals (budget and Marketplace come
later and may add them), orders and payments, barcodes or QR check-in, insurance values.

## The catalogue: where it comes from and how it changes

The master list is the Sheet "Nia gear database: master list v1" (claude.ai artifact, 2026-11-27):
ShareGrid's categories as the backbone, extended with Glow Hire and Magic Lightbox's groupings
(expendables, production & unit, live production, power), items merged from the four sources.

To change the catalogue: edit `src/data/gear/catalog.json` (add an item with a new readable `id`,
never change an existing id), then

```
node scripts/build-gear-catalog-seed.mjs --check   # checks ids, departments and categories
node scripts/build-gear-catalog-seed.mjs           # rewrites this version's migration, or stamps a new one
```

and paste the migration into the Supabase SQL Editor. It's safe to run again: items are added or
brought up to date by id; an item taken out of the JSON is retired (kept, so kit that points at it
still reads). A new department or category goes in `taxonomy.json` first. A bigger revision bumps
`version` in the JSON, which writes a `_v2` migration.

**Pictures.** The catalogue ships with none. The store photos in the Sheet are for identifying
items only and are not licensed for Nia. Routes, per the Sheet's Image status column: generic
items (stands, clamps, rags) are photographed or illustrated by Nia; branded items come from
manufacturers' press or partner assets, with permission; a team's own kit shows the team's own
photo (`gear.photo_url`, rule: imagery comes from the user's own work). Until a picture exists, a
line shows its department's icon. `image_url` is only ever set to a licensed picture.

## Build steps

One step at a time, as BUILD_PLAN.md says: explain it, wait for Ika's OK, build from the design
with sample data, Design check, connect Supabase, Standard checks, tick, update Progress, commit.

- [x] **G0 Framework.** The catalogue, the tables (not run), the logic and its tests (this file's
  first table). 2026-11-28.
- [ ] **G1 Tables live.** Ika runs `20261128000000_gear.sql`, then
  `20261128010000_gear_catalog_v1.sql`, in the SQL Editor. Then the 12 access checks with the two
  test accounts against Supabase (supabase-js), plus crew adding gear through `add_project_gear`,
  and `select count(*) from gear_catalog` is 667.
  Log both in CLAUDE.md's "Migrations run so far".
- [ ] **G2 Design.** Ika designs the Gear tab, the Gear page, the Add gear pop-up and the side panel
  in Claude Design (brief below), then into Figma. No code before this.
- [ ] **G3 The tab and the page.** Wire the tab (below), build `GearSection` for the tab and
  `/projects/[id]/gear` from the Figma frames with `SAMPLE` (`/dev/gear`, 404 on production, like
  `/dev/cast-crew`), then connect `listProjectGear`. Status in one tap, filters, the side panel,
  Remove. Global search finds gear. `UPDATES` entry when it's live.
- [ ] **G4 Adding gear.** The pop-up: search (kit, then catalogue), quantities, paste a list with
  the check before adding, browse by department. Select several → Mark booked / packed / returned.
  A "By rental house" view (`byVendor`) for the pick-up run.
- [ ] **G5 Documents.** The Equipment Rental Log fills its rows from the rental lines (one per
  rental house); the call sheet can carry the day's key kit. Proposals, not silent edits.
- [ ] **G6 Prevent double-booking** (needs shoot days, Milestone 4.3): own kit with
  `quantity_owned` can't be booked on two projects on the same days beyond what the team owns; the
  option is disabled with a short reason ("Both FX6s are on Sanaa Groove that day").

### Wiring the tab (G3)

Three files, all small. Note: on 2026-11-28 `project-editor.tsx`, the project page and
`projects-data.ts` had uncommitted changes from another session, so this waits until those are
committed.

1. `src/components/projects/project-tabs.tsx`: add `"gear"` to `ProjectTabId` and
   `{ id: "gear", label: "Gear" }` to `PROJECT_TABS`, after `crew`.
2. `src/app/(app)/projects/[id]/page.tsx`: read the count beside the page's other reads
   (`countProjectGear` in `features/gear/data.ts`, inside the existing `Promise.all`), pass
   `gear` in `counts`, and pass the tab's content: `gear={<GearSection … href={`/projects/${id}/gear`} />}`.
3. `src/components/projects/project-editor.tsx`: take the `gear` prop and render
   `{tab === "gear" && gear}` after the crew line.

The page itself, `src/app/(app)/projects/[id]/gear/page.tsx`, copies `crew/page.tsx`: `Suspense`,
`await connection()`, `getProject` and `createClient` together, `listProjectGear`, and the client
component with `editable={role !== "viewer"}`.

## Brief for Claude Design (G2)

Paste as is:

```
Design four pieces for Nia OS (web), in Nia's look: Geist for all text, sentence case, neutral
greys, text #1F1F1F (light) / #E6E6E6 (dark), Nia Blue (#005FB8 light, #3794FF dark) only for the
active state and the one primary button. Pills for buttons, circles for icon buttons. No serif,
no all-caps, no monospace labels. Few words: titles, no explaining lines. Match the existing
Cast & crew screens (project tab summary row, the /crew directory with departments, the profile
side panel, the quick add pop-up).

1. Project page → Gear tab (sits after "Crew & talent"). Section title "Gear", a row of department
   counts (Cameras 1 · Lenses 2 · Lighting 3 · Grip 13 …), one status line ("3 to book · 9 packed"),
   a grey "Manage gear →" pill. Empty state: "No gear yet." and an "Add gear" button.
2. Gear page (/projects/[id]/gear). Breadcrumb "← Back to project / Sanaa Groove brand film".
   Title "Gear". Right: "14 items · 3 to book". Filter row: search pill, "Department: All ▾",
   chips Needed 3 / Booked 4 / Packed 6 / Returned 0, "Source: All ▾". List grouped by
   department (collapsible, with counts). Each line: square picture or department icon on grey,
   name + brand, quantity (×4), source ("Rental · Glow Hire" / "Own kit"), the responsible
   person's initials, status pill (Needed grey, Booked blue tint, Packed green, Returned neutral).
   Selecting lines shows a bar: "3 selected · Mark booked · Mark packed · Mark returned".
   One primary button: "Add gear". Desktop with the side panel open; phone (375px) list view.
3. Side panel for a line: picture, name, brand, category; quantity stepper; source; rental house;
   days needed (from–to); responsible (from the project's crew); status; notes; then "Kit details":
   owner, serial number, how many we own, photo. "Remove from project" at the bottom, grey.
4. Add gear pop-up: one search field; results in two groups, "Your kit" (with "You own 2") and
   "Nia catalogue" (name, brand, category, variants like "6x6 to 20x20"); a quantity beside each
   pick; tabs or links for "Paste a list" (textarea, then a check step showing each line matched:
   "2 × C-Stand 40"", "Hazer → Antari HZ-400 Haze Machine?") and "Browse" (departments → items).
   Primary button "Add 6 items".

Sample data: a one-day brand film. Sony FX6 (own kit, packed); DZOFilm VESPID 35mm and 50mm
(rental, Magic Lightbox, booked); Tiffen 4x5.65 Black Pro-Mist 1/4 (rental, needed); V-Mount
Battery ×4 (own kit, packed); Secced 100mm Tripod System (own kit, packed); Atomos Ninja V
(borrowed, booked); Aputure LS 600x Pro ×2 and Light Dome II (rental, Glow Hire); C-Stand 40" ×4,
Sandbag ×8 (own kit, packed); Rag – Full Silk 8x8 (rental, needed); Sennheiser EW 100 G4 Wireless
Lav Kit ×2 (rental, booked); SD Card ×4 (own kit, packed).
```

## Open questions (for Ika, before G3)

1. **Statuses.** Needed → Booked → Packed → Returned covers own kit and rentals with four words.
   Keep, or split Packed into "Picked up" (rentals) and "Packed" (own kit)?
2. **Prices.** Leave day rates and totals out until Budget / Marketplace (as now), or add an
   optional day rate per line for the rental quote?
3. **Solo creators.** BUILD_PLAN 3.10 hides Cast & crew for solo creators. Does Gear stay for them
   (a solo shooter has a kit list too)? Suggestion: yes.
4. **Activity.** Cast & crew writes no activity rows. Should "Gear: 6 items packed" show in the
   project's Recent activity?
5. **Kit list page.** A workspace-wide "Our kit" page (everything the team owns, across projects)
   is the natural next step after G6. Later, or never?
