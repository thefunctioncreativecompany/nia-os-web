@AGENTS.md

# Nia OS (web)

Nia OS is an AI-enabled content production operating system for creative professionals: projects,
documents (call sheets, shot lists, scripts), people and places, schedule, and an AI Copilot that
proposes and never acts on its own.

**How we build: follow [BUILD_PLAN.md](BUILD_PLAN.md) exactly.** One unchecked step at a time, top
to bottom. Explain the plan in plain English and wait for Ika's OK, build from Figma with sample data,
run the Design check, connect Supabase, run the Standard checks, then tick the box, update Progress
below, commit, push and stop. Ika is new to coding: explain simply, no unexplained jargon.
Design thinking behind the rules: [docs/design-program.md](docs/design-program.md).

Figma (source of truth): file `jaF49U0T0DQ5lNB6h4wJvp` (Nia Technologies Inc.), developer handoff
board node `796-7730`. Anything missing from Figma gets designed in Claude Design and reconciled into
Figma first, never invented in code.

## Stack

Next.js 16 (App Router, Cache Components, partial prefetching) + TypeScript + Tailwind 4 + shadcn/ui
(radix-nova), Supabase (Postgres, Auth, Storage, Realtime), Vercel, GitHub. Motion via Framer Motion
(`framer-motion`; import from it, not `motion/react`, which drags the whole library into every
page; write `m.div`, not `motion.div`: `MotionProvider` loads the features after the page).
Icons: Lucide only.

## Rules (short form; full text in BUILD_PLAN.md)

Product:
- Priority (Ika, 2026-10-21): optimise creative operations and production management for users
  and teams. When choosing what to build or how, favour what makes planning, making and
  managing a production faster and clearer; Explore and Marketplace serve that work.
- AI proposes, the producer decides: AI output is a proposal card (Apply / Modify / Dismiss) with a
  gold "AI draft" marker; never change user data without Apply.
- Deep modules (Projects, Documents, People & Places, Schedule, Copilot); one primary action per screen.
- Every element serves a production job, or ask Ika. Imagery comes from the user's own work.
- Production language (project, call sheet, shoot day, crew, call time, wrap). Never: payload, token,
  manifest, asset locker, "Intelligent Core", or "workspace" except for the team account.
- Prevent mistakes (e.g. double-booking) instead of reporting them afterwards.

Design:
- Colors, fonts, radii, spacing and motion only from theme variables; no hex or pixel values in pages.
- Brand (Ika, 2026-10-31): neutral greys with text `#1F1F1F` (light) / `#E6E6E6` (dark) and VS Code's
  Nia Blue as the single accent, active states only (`#005FB8` light, `#3794FF` dark; token
  `nia-blue`, e.g. `bg-nia-blue`, `border-nia-blue/50`). No Obsidian `#0A0908` or Aged Gold
  anywhere: interface, PDFs and emails (Ika, 2026-10-31). Geist for all text,
  sentence case. No serif and no all-caps monospace labels (Ika, 2026-10-19); the screenplay preview's
  Courier capitals are content formatting, kept until Ika decides.
- Build from `src/components/ui` (shadcn) and `src/components/nia`; new looks are variants. Keep shadcn
  focus rings and keyboard behaviour.
- Search and filters everywhere use Marketplace's look (Ika, 2026-10-20), from
  `src/components/nia/filter-bar.tsx`: `SearchField` (56px pill), `FilterChip` (40px pill; on = dark
  border, grey fill; optional count), `ChipMenu` ("Category: All ▾"), `ResultCount`; chip and menu rows go in `ChipRow` (one line to swipe on phones and tablets, wrapping on
  wide screens; Ika, 2026-10-31).
- Headings (Ika, 2026-11-10, one standard, from Explore): a page title is
  `text-h2 font-semibold tracking-tight text-foreground`; a section heading is
  `text-subtitle font-semibold text-foreground`. No `font-extrabold` or `text-display` titles.
- Buttons (Ika, 2026-11-11): every button is a pill and every icon button a circle (built into
  `Button`; no `rounded-md/lg` overrides). Primary (default) buttons carry a soft Nia Blue halo, stronger on hover.
  "View all" and other go-to links are `ViewAll`
  (`src/components/nia/view-all.tsx`): an outline pill with an arrow, no counts.
- Grids fill row by row from the left: no CSS masonry `columns-*` anywhere (Ika, 2026-11-11: the
  gaps they leave are "very bad UX").
- Rows (Ika, 2026-11-11): a row shows at most ten things (`ROW_MAX` in `src/lib/rows.ts`); the
  rest sit behind `ViewAll`.
- Few words (Ika, 2026-11-10): creatives are visual, so a section gets a title and no explaining
  line; cards lead with a picture and a name. Add a sentence only where someone would be stuck
  without it.
- Motion: `fast` 150ms, `base` 250ms, `slow` 400ms, ease-out on enter, no loops, respect reduced
  motion. Only modals/panels, the saved tick, cards settling, the card hover sweep, workflow covers
  (steps arriving once, the line drawing on hover; Ika, 2026-11-10), Copilot highlights and
  onboarding slides animate.
- Theme tokens (`src/app/globals.css`): colors `foreground`/`primary` (near-black), `nia-blue`
  (the accent, + `nia-blue-foreground`), neutral greys (`muted`, `muted-foreground`, `border`, `secondary`, `accent`);
  fonts `font-sans` (Geist, everything), `font-wordmark` (the "NIA" mark); `font-serif` and `font-mono`
  exist but aren't used in the interface; text sizes `text-h1` 32, `text-h2` 28, `text-h3` 24, `text-lead` 15, `text-sm` 14,
  `text-small` 13, `text-caption` 12, `text-micro` 11, `text-meta` 10, `text-tiny` 9, `text-wordmark` 22;
  shadow `shadow-elevation-2`; motion `duration-fast/base/slow`
  with `ease-out` (code animations use `src/lib/motion.ts`). Nia Blue is for indicators,
  borders and tints.

Data:
- RLS on every table: users see only rows in workspaces they belong to. Soft deletes (`deleted_at`).
- Keys only in `.env.local` and Vercel → Settings → Environment Variables; never in code, chat or the browser.
- Schema changes are migration files in `supabase/migrations`, explained to Ika, then run by her in
  the Supabase SQL Editor (paste the file's contents, not its name).

## Decisions that shape everyday work

The full, dated log is [docs/decisions.md](docs/decisions.md): read a feature's entry before
changing it. The master list of what's shipped, open, fed back and planned is
[docs/FEEDBACK.md](docs/FEEDBACK.md): log new feedback there first, study it, then build one item at a time. Weekly summaries and side-project notes: [docs/progress-log.md](docs/progress-log.md).

- Look: neutral greys, Nia Blue for active states only, dark mode follows the device (Settings →
  General → Appearance overrides it), Geist in sentence case, theme tokens only. Card hover
  sweep (`hover-sweep`) on clickable cards.
- Anything that doesn't work yet is greyed out with a `NotYet` note saying when it opens.
- "← Back to …" links are `BackLink` (they step back when that's where you came from).
- When something people can use goes live, add it to `UPDATES`
  (`src/features/whats-new/updates.ts`) and, for a template, to `launches.ts`.
- Plan limits apply on the live site only (`src/lib/plans.ts`); paid-only things check the plan
  on the server.
- Templates: only working ones are in `catalog`; build the rest in Ika's priority order.
- Explore is curation, not distribution: open to everyone signed in since 2026-11-10 (no invite
  code for now; `features.exploreUnlocked`, a welcome screen on the first visit), seasonal categories
  lead By category in their season (`season` in made-in-africa.json, `seasonOf`; Holiday classics 1 Nov–6 Jan), link and never copy, no review scores, credit TMDB, Wikidata and
  Commons. Only titles with a cover show. Every new title gets a press kit, cast and crew, a
  release date and a palette (the scripts in `scripts/`), committed without asking. Never invent
  an Explore category.
- Explore all: Canvas or Timeline (`/explore/all/timeline`, built step by step from
  `EXPLORE_TIMELINE_SPEC.md`); the timeline is desktop only and open to everyone in the
  beta (Ika, 2026-11-08; phones and tablets get a note). A round button
  bottom left opens Explore all from anywhere on desktop.
- Cast & crew: one directory per workspace (`people`, `cast_crew`); Explore rows use one standard
  format (`credit-format.ts`), top 10 free, the full list on paid plans.
- Pictures of people only with consent: initials by default; Commons photos for film people,
  credited.
- Delete and minimise non-essentials: removed features live in git tags (`parked-2026-11-02`),
  not behind switches.

## Working notes

- If something fails twice, stop, explain simply, and offer to revert to the last commit.
- Sessions: start with "Read CLAUDE.md and tell me where we left off"; end by updating Progress,
  then commit and push.
- Live site: https://app.niatechnologies.co (GoDaddy CNAME `app` → Vercel project nia-os-web-9ahh; the old
  https://nia-os-web-9ahh.vercel.app still works). Production deploys from `main`, ~1 minute.
- Test accounts: credentials in `.env.local` as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and
  `TEST_USER2_EMAIL` / `TEST_USER2_PASSWORD`; sign in with them in headless Chrome (turn on focus
  emulation for inputs) and with supabase-js to verify access rules between accounts.
- Supabase URL Configuration: Site URL `https://app.niatechnologies.co`; Redirect URLs
  `https://app.niatechnologies.co/**`, `https://nia-os-web-9ahh.vercel.app/**` and `http://localhost:3000/**`. Never use
  `*-nia-technologies.vercel.app` URLs (Vercel-protected, shows a login wall).
- Auth UI lives in `src/components/auth/`; Supabase logic in
  `src/components/{login,sign-up,forgot-password,update-password}-form.tsx`. Email and Google links
  land on `/auth/confirm`; failures go to `/auth/error`. Use real logo SVGs from the web.
- Anything reading the Supabase session must `await connection()` first (Supabase reads `Date.now()`),
  inside a `<Suspense>` boundary.
- On the server, get the signed-in person from `getSession()` (`src/lib/supabase/session.ts`): one
  client per page and a local token check (no trip to Supabase). Use `getUser()` only where its extra
  data or a fresh check matters (Settings identities, the invite email). In the browser use
  `currentUser()` (`src/lib/supabase/current-user.ts`), not `getUser()`.
- Search keeps up with the data (Ika, 2026-11-11): whenever something new can be found on the
  platform (a kind of page, a studio, a person, a workflow, a field), add it to global search in the
  same change (`global-search.tsx`; Explore's extras come from `features/explore/search-index.ts`).
- Load data a control needs on first use, not on every page load (the navbar search loads on hover,
  tap or focus). Run independent queries together (`Promise.all`), and join instead of chaining.
- If the dev server serves stale CSS or route types, stop it, `rm -rf .next`, and restart.
- Auth emails send through Resend (custom SMTP in Supabase → Authentication → Emails, sender
  `no-reply@niatechnologies.co`, API key `nia-os-supabase-auth`). Templates live in
  `supabase/email-templates/`; paste changes into Supabase (Source view), never the SQL Editor.
- Always import `cn` from `@/lib/utils` (it knows the named text sizes). After `npx shadcn add`,
  change the new file's `import { cn } from "cn"` to `@/lib/utils`.
- Install shadcn components with `yes n | npx shadcn@latest add <name>` so it never overwrites the
  restyled files.
- Build screens from the component gallery first (`/dev/components`, run locally). `<Calendar>` reads
  the clock: pass `today` on prerendered pages. `<CommandDialog>` needs a `<Command>` inside.
- Looping motion is allowed only for "still working" indicators (spinner, loading dots), and they stop
  under reduced motion.

## Progress

Milestone 0 — Foundations
- [x] 0.1 CLAUDE.md (this file), BUILD_PLAN.md and docs/design-program.md added.
- [x] 0.2 Theme. Obsidian, Aged Gold, Geist + Instrument Serif, named text sizes from the Figma text
  styles, motion tokens and reduced-motion handling. Radius (sm 6 / md 8 / lg 12 / xl 16 / 2xl 22) and
  the 4px spacing grid unchanged. Other raw pixel values (widths, heights) still get cleaned up as each
  screen is next touched.
- [x] 0.3 Base components. All plan components installed (plus slider, switch, textarea, skeleton,
  toggle). Button size `pill` (44px, rounded-full, bold) is the default; `compact` is the old 32px.
  Badge variants `confirmed / pending / on-hold / wrapped / cancelled` use `status-*` theme colors
  from Figma (Pending and Wrapped text darkened for contrast).
- [x] 0.4 Nia components in `src/components/nia`, built from what Figma shows: Navbar (+ UserMenu),
  StatusBadge, EmptyState (optional illustration slot), DocumentHeader (+ DocumentPreviewHeader,
  DownloadPdfButton; title in Geist bold since F1), ProjectCard (default + compact, 19:10 cover,
  hover lift), TemplateCard (default + compact), ProposalCard (Apply Changes / Modify),
  SavedIndicator (tick animation via `motion`). Waiting on Figma (Ika designs in Claude Design, then
  added before the step that needs it): ProjectCard production-type chip, next shoot date and
  no-cover gradient (by 2.2; until then a plain grey block); SavedIndicator "Saving…" state (by 2.3);
  TemplateCard miniature preview (by 3.3); ProposalCard Dismiss + gold "AI draft" marker (by 5.3).
  Also: Figma's projects grid tile says "New Workspace"; per production language it should be
  "New project" (2.2).
- [x] 0.5 Component gallery at `/dev/components` (404 on production): the whole nOS Design System,
  sections 1–30 (Figma 957-19992 … 957-22790, variations 1181:11320, project modals 957:22891), built
  on shadcn and restyled. Section files in `src/app/dev/components/_sections/`; new Nia components in
  `src/components/nia/` (pickers, lists, media, tables, inbox, charts, map, panels, export, preview,
  cast & crew, templates). Added shadcn chart (Recharts) and hover-card; `--chart-1/2/3` are ink
  `#1A1A1A`, teal `#0B7A75`, rust `#92400E`. Notes: the map is a schematic plan (no street-map
  service yet); the variations' green buttons and purple accents are drawn in Nia black/gold per the
  brand decision; the Calendar range fills the days between the ends (Figma marks only the ends).
- [x] 0.6 Connect services. Supabase URLs and Vercel env vars verified; live site loads.

Milestone 1 — Accounts
- [x] 1.1 AuthLayout, Log in, Sign up. Hero is a crossfading slideshow of Ika's images.
- [x] 1.2 Password recovery: forgot password, check your email (opens the user's web inbox), new password.
- [ ] 1.3 Make auth real. Working: email/password, Google, password reset, `profiles`,
  `user_settings`, `workspaces`, `workspace_members`, `workspace_invites` with RLS; new users →
  onboarding (proxy), returning users → `/home` (`/dashboard` redirects), logged-out → `/login`,
  the bare domain routes by sign-in state. Each account gets "My workspace" on its first project
  (`my_workspace_id()`), not at sign-up. Projects soft-delete (`deleted_at`).
- [ ] 1.4 Onboarding. Built as all 9 Figma screens under `/onboarding/*`, saving each step, tested end
  to end locally and live. Trimmed 2026-10-31 (beta walkthrough): Import your profile and Follow
  creators are out of the flow (`features.onboardingExtrasShown`, pages redirect), so 7 screens to
  Home ("Step N of 6"). Trimmed again 2026-11-10 (Ika: nothing that isn't active): "What you can do
  on Nia" and inviting team members are out (tag `parked-2026-11-10-onboarding`), so 5 screens
  and "Step N of 4"; the workspace step finishes onboarding. Still to do: How did you hear as an optional tap on the last screen, and
  What you can do as slides (wait for Figma).

Milestone 2 — Projects (built from Figma sections 778-2218, 872-42448, 840-26959; Ika chose to do
these before 0.5)
- [x] 2.1 App shell. Navbar: Home and Projects live, Templates/Explore/Inbox "coming soon", search box
  searches project titles, + opens New Project, profile menu (Settings, Log out). Tabs sit in a
  Suspense boundary (the active tab depends on the address).
- [ ] 2.2 Projects list + New Project. Done: `/projects` grid + empty state, search (`?q=`), Create New
  Project dialog (Blank; From Template disabled), New Blank Project form (name, description, cover,
  genre, production type). To do: sort (not in Figma), ProjectCard type chip / next shoot date /
  no-cover gradient (not in Figma), Explore and template rows (later milestones).
- [ ] 2.3 Project page. Done: `/projects/[id]` with inline-edited title, description, Production Info
  (auto-save + SavedIndicator), cover change, Edit Project Details (type, stage), Share (invite by
  email as Can view / Can edit, change role, remove, view-only link at `/share/[token]`), Delete
  (soft, owner only), Project Overview, Recent Activity. Viewers get a read-only page. To do:
  Documents list (Milestone 3), Team Members section, Export (3.4), References (2.4). Invites are
  stored and auto-accepted on sign-up, and emailed through Resend (`RESEND_API_KEY`). The page
  updates live when collaborators change it; Home shows Updates (notifications).
- [ ] 2.4 Reference board. Not started.
- [ ] 2.5 Home. Done: `/home` welcome, template row (coming soon), Recent Projects, Recent Activity,
  Upcoming Schedule (empty state), Quick Actions (New Project; Browse Templates / Import Files coming
  soon). No stat cards (Ika's call). To do: Next shoot hero + Needs you (need Figma, Milestone 4),
  "Complete your profile" card.
- Tested with two accounts: 32 database checks (access, sharing, roles, link, invites, storage, soft
  delete) and a browser run of create → edit → refresh → share → link → viewer → delete.

Milestone 3 — Documents
- [ ] 3.1 Template gallery. Built from TEMPLATES_BUILD.md steps 1–6: 63 templates, search with suggestions,
  filters, preview pop-up (`?preview=` link), Suggested for you (learns from `template_events`). Step 7, the
  template engine (TEMPLATE_ENGINE.md §8): part 1 done, the Filming Notice opens at `/templates/D07`
  with autosave, Undo/Redo and downloads (PDF, Word, Markdown, .txt); part 2 done, six table templates
  with typed columns (T5); people fields; Invoice with totals, currency and Mark paid; Call Sheet. 2026-11-10: the in-design templates are being built by ICP
  (`scripts/add-templates.mjs`, definitions in `scripts/templates/`): photography done (34 work), then creators,
  filmmakers and small studios; then three workflows per ICP. Fix list and
  open items: docs/FEEDBACK.md.

- [x] 3.4 PDF export (print layout; Download PDF, Word, Markdown, .txt) and 3.7 Batch C (Continuity Log,
  Shot Logging Sheet, Equipment Rental Log, Filming Notice, Invoice) done. Also working: Crew Contact
  List, Shotlist, 3-Column AV Script, Call Sheet. Still open: 1.3 (Fix 1 email check), 1.4 (onboarding
  trim), 2.2 (sort), 2.3 (Team Members), 2.4 (file detail panel), 2.5 (Next shoot, Complete your
  profile), 3.1 (Editorial Shoot launcher). Audit 2026-10-19 and its fixes: docs/FEEDBACK.md (A1–A14).

Future builds (agreed with Ika, build later; need designs first)
- Project cards: a no-cover look, production-type chip and stage badge, hover lift.
- Home: Next shoot, Complete your profile / set up your workspace (W1).
- Projects: Team Members (2.3), References gallery (R1).
- Templates: Editorial Shoot launcher (3.1, Fix 13); then "What's next" can follow its steps.
- Explore weekly import (Ika, 2026-10-23, left for later): new and trending films and series from
  TMDB (trending lists, by streamer and studio: Netflix, Hulu, Paramount+, Peacock/NBC, Skydance,
  A24, Neon…; official trailers), never the streamers' own sites. Genres and types matched to
  Nia's lists; each title arrives as a proposal with a Nia-written summary for Ika to approve.
  Needs Explore reading from Supabase first (`20261030000000_explore_made_in_africa.sql` + seed),
  a `TMDB_API_KEY`, and the TMDB commercial licence (plus a JustWatch credit) before launch.
- Explore: Recently added, rethought (removed 2026-11-08, tag `parked-2026-11-08-recently-added`):
  a row that works with posters and wide trailer stills together.
- Vercel: sign the CLI in as the nia-technologies account (it's on a personal one), then
  disconnect the extra projects (`nia-os-web`, `nia-os-web-s5dn`) that build every commit.

Next week (from 2026-11-02, in order; agree each with Ika first)
1. Ika: run `20261107000000_security_function_access.sql`, turn on leaked password protection
   (Supabase → Authentication → Passwords), paste the two email templates into Supabase.
2. Beta pilot: invite the three ICP groups (5–8 each, a real shoot in 2–4 weeks), move them to
   Pro by hand (Cast & Crew View all, no limits), Explore code, read `feedback_review` weekly.
3. Milestone 4: link people to Nia accounts in the Cast & crew form, then step 2 Locations,
   then shoot days and the schedule.
4. Figma reconcile (growing): welcome tour and What's new, Send feedback, global search,
   project Details, Cast & crew directory, Explore Cast & Crew row and View all, person pages,
   dark mode tokens, card hover.
5. Explore: rerun cast & crew and press kits as titles are added; the 17 titles with no
   credits; the 289 studio-catalogue titles (posters from TMDB's free API during the private beta; commercial licence before charging).
6. Small: genre pills "More genres" fold; Nia photos in the project page's crew row.

Milestone 4 — Shoot day (plan agreed 2026-11-01: People → Locations → Shoot days & schedule →
documents fill themselves → Shoot Day screen → Home goes live; one directory per workspace; call
sheets live until issued; crew without accounts for now)
- [ ] 4.1 People. Built: `/projects/[id]/crew` from Figma frame 18 (967:30543) in Nia's look
  (`CastCrewDirectory`, `src/features/crew/directory.ts`, tested): cast table, crew by department
  (collapsible), List/Grid, Department and Status filters, the profile panel (contact, agent,
  union, bio, this week's availability, notes; Email). Reads the project's Crew & talent list
  (with Nia photos) until the tables exist; sample production at `/dev/cast-crew` for the design
  check. Reads `people` and `cast_crew` (`20261109000000_people.sql`, run 2026-11-01; every
  Crew & talent list copied in; `src/features/crew/data.ts`). Editors add people (pop-up, Figma
  967:31635), edit profiles (drawer, 967:31816; Remove from project is a soft delete) and change
  a status in one tap (967:31997) (`person-form.tsx`, `mutations.ts`); someone with the same
  email in the workspace is reused, not duplicated. Viewers read only (database rules too). The
  project page's Crew & talent is now a round row with "Manage cast & crew"; each change rewrites
  `projects.crew` so the share link stays in step. Tested on localhost (add, edit, status,
  remove; a viewer can't write). To do: link a person to their Nia account (the old "pick
  someone on Nia" is gone from the form), Nia photos in the project row, people's own pages.

Navbar (NAVBAR_BUILD.md): N0 decisions logged, Figma frames pending (built from the Claude
Design boards meanwhile, Ika 2026-11-08). N1–N3 done 2026-11-08: on desktop a 4rem frosted bar
(`glass-bar`, `nav-edge` blur strip) that stays at the top, tabs left, search pill and round +
in the middle, avatar right; phones unchanged. Next: N4 "Try" ideas, N5 gallery and fallbacks.

Milestone 5 — Copilot: not started.

Milestone 6 — Share & launch
- [ ] 6.3 Essential settings. Partly built: Settings → Profile (incl. AI assistant style and
  suggestions) and General save to Supabase; other tabs disabled. A Notifications design draft
  exists in Claude Design.
- [ ] Everything else not started.

Migrations run so far: `20261018000000_profiles_settings_workspaces.sql`,
`20261019000000_onboarding.sql`, `20261019010000_avatar_cleanup.sql`, `20261020000000_projects.sql`,
`20261021000000_templates.sql`, `20261021010000_documents_soft_delete.sql`, `20261022000000_notifications.sql`,
`20261023000000_projects_realtime.sql`, `20261024000000_find_people.sql`, `20261025000000_documents_project_check.sql`,
`20261025010000_project_files.sql`, `20261025020000_project_files_remove.sql`,
`20261025030000_project_files_tags.sql`, `20261026010000_activity_documents_files.sql`,
`20261026020000_link_shared_projects.sql`, `20261025040000_document_limits_file_archive.sql`,
`20261026030000_document_rules_wording.sql`, `20261026000000_remove_pilot_clients.sql`,
`20261027000000_feature_waitlist.sql`, `20261031000000_collections_references.sql`, `20261031010000_collections_remove.sql`,
`20261101000000_explore_access.sql`, `20261102000000_marketplace_access.sql`, `20261104000000_project_instagram_references.sql`,
`20261105000000_feedback.sql`, `20261105010000_more_production_types.sql`,
`20261106000000_project_details_crew.sql`; also `20261028000000_plans.sql`,
`20261029000000_marketplace_waitlist.sql` and `20261103000000_explore_views.sql` (found run,
2026-10-28); `20261107000000_security_function_access.sql`, `20261108000000_explore_top.sql` and
`20261109000000_people.sql`. Not run: `20261111000000_link_access_requests.sql` (until it is, share links stay view-only), `20261110000000_explore_open.sql` (until it is, only invited people can save titles or add them to projects), `20261030000000_explore_made_in_africa.sql` (Explore reads
sample data).
