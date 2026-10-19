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
(`motion`). Icons: Lucide only.

## Rules (short form; full text in BUILD_PLAN.md)

Product:
- AI proposes, the producer decides: AI output is a proposal card (Apply / Modify / Dismiss) with a
  gold "AI draft" marker; never change user data without Apply.
- Deep modules (Projects, Documents, People & Places, Schedule, Copilot); one primary action per screen.
- Every element serves a production job, or ask Ika. Imagery comes from the user's own work.
- Production language (project, call sheet, shoot day, crew, call time, wrap). Never: payload, token,
  manifest, asset locker, "Intelligent Core", or "workspace" except for the team account.
- Prevent mistakes (e.g. double-booking) instead of reporting them afterwards.

Design:
- Colors, fonts, radii, spacing and motion only from theme variables; no hex or pixel values in pages.
- Brand: Obsidian `#0A0908`, Aged Gold `#8A7A52` (single accent, active states only), Geist for all text,
  sentence case. No serif and no all-caps monospace labels (Ika, 2026-10-19); the screenplay preview's
  Courier capitals are content formatting, kept until Ika decides.
- Build from `src/components/ui` (shadcn) and `src/components/nia`; new looks are variants. Keep shadcn
  focus rings and keyboard behaviour.
- Motion: `fast` 150ms, `base` 250ms, `slow` 400ms, ease-out on enter, no loops, respect reduced
  motion. Only modals/panels, the saved tick, cards settling, Copilot highlights and onboarding slides animate.
- Theme tokens (`src/app/globals.css`): colors `foreground`/`primary` (Obsidian), `gold`
  (+ `gold-foreground`), Figma greys (`muted`, `muted-foreground`, `border`, `secondary`, `accent`);
  fonts `font-sans` (Geist, everything), `font-wordmark` (the "NIA" mark); `font-serif` and `font-mono`
  exist but aren't used in the interface; text sizes `text-h1` 32, `text-h2` 28, `text-h3` 24, `text-lead` 15, `text-sm` 14,
  `text-small` 13, `text-caption` 12, `text-micro` 11, `text-meta` 10, `text-tiny` 9, `text-wordmark` 22;
  shadow `shadow-elevation-2`; motion `duration-fast/base/slow`
  with `ease-out` (code animations use `src/lib/motion.ts`). Gold is under 4.5:1 on white: indicators,
  borders, tints and large text only.

Data:
- RLS on every table: users see only rows in workspaces they belong to. Soft deletes (`deleted_at`).
- Keys only in `.env.local` and Vercel → Settings → Environment Variables; never in code, chat or the browser.
- Schema changes are migration files in `supabase/migrations`, explained to Ika, then run by her in
  the Supabase SQL Editor (paste the file's contents, not its name).

## Decisions (2026-10-17)

- Brand: switch to the plan's brand (Obsidian, Aged Gold, Geist, Instrument Serif) now, even though
  Figma still shows DM Sans and `#1A1A1A`. Done in step 0.2.
- Onboarding: trim to the plan. Hide Import profile and Follow creators now (keep the code for after
  beta). "What you can do" as slides and "How did you hear" as an optional tap on the last screen wait
  until Ika updates Figma. Done in step 1.4.
- Home lives at `/home`; `/dashboard` redirects there. Done with the step 1.3 fixes.
- Auth and onboarding heroes are a fixed still per screen (`src/components/auth/hero-images.ts`), not a
  slideshow (no looping animation). Figma's image where Ika's set has it in high resolution; the
  rest are picks from her set, to be confirmed.
- Gold marks the active navbar tab (light tint) and the active Settings tab (underline).
- The bare domain sends signed-out visitors to `/login` and signed-in ones into the app.
- (2026-10-19) Fonts: Geist only. No serif (Instrument Serif) and no all-caps monospace labels in new
  work; sentence case. Older screens swept (F1).
- (2026-10-19) Templates: one view (phones lead with suggested templates, then category rows of square
  grain-gradient cards); Compact and Index retired to the component library (section 31). Gradients
  `--grain-1…12` are sampled from grainient.supply freebies and rebuilt in CSS.
- (2026-10-19) Phones and tablets: magnifying dock for navigation; top bar = round + and a search field
  with a silver-gradient rim.
- (2026-10-19) Templates use real controls instead of typing wherever a field has a shape (dates,
  times, durations, numbers, money, yes/no, choices, tags, people), saved in a standard format so
  voice-memo and document autofill can fill them later.
- (2026-10-19) Real films and series to learn from (e.g. Sinners: synopsis, credits, budget, script
  link) live in Explore, not Templates. No IMDb scraping (its terms forbid it; its datasets are
  non-commercial): Wikidata/Wikipedia first, posters only with a TMDB or IMDb licence; scripts are
  linked where the studio publishes them, never copied. "Start a project from this" is an AI proposal.
- (2026-10-19) Project page follows Figma 824:23124 (cover, title, description left; Details, Behind
  the production, Stills, References right; stacked on phones and tablets). Today's actions, overview
  and activity move to a "Manage" tab beside "Details" on the right.

## Working notes

- If something fails twice, stop, explain simply, and offer to revert to the last commit.
- Sessions: start with "Read CLAUDE.md and tell me where we left off"; end by updating Progress,
  then commit and push.
- Live site: https://nia-os-web-9ahh.vercel.app (production deploys from `main`, ~1 minute).
- Test accounts: credentials in `.env.local` as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and
  `TEST_USER2_EMAIL` / `TEST_USER2_PASSWORD`; sign in with them in headless Chrome (turn on focus
  emulation for inputs) and with supabase-js to verify access rules between accounts.
- Supabase URL Configuration: Site URL `https://nia-os-web-9ahh.vercel.app`; Redirect URLs exactly
  `https://nia-os-web-9ahh.vercel.app/**` and `http://localhost:3000/**`. Never use
  `*-nia-technologies.vercel.app` URLs (Vercel-protected, shows a login wall).
- Auth UI lives in `src/components/auth/`; Supabase logic in
  `src/components/{login,sign-up,forgot-password,update-password}-form.tsx`. Email and Google links
  land on `/auth/confirm`; failures go to `/auth/error`. Use real logo SVGs from the web.
- Anything reading the Supabase session must `await connection()` first (Supabase reads `Date.now()`),
  inside a `<Suspense>` boundary.
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
  to end locally and live. To do: trim per Decisions above.

Milestone 2 — Projects (built from Figma sections 778-2218, 872-42448, 840-26959; Ika chose to do
these before 0.5)
- [ ] 2.1 App shell. Navbar: Home and Projects live, Templates/Explore/Inbox "coming soon", search box
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
  with typed columns (T5); people fields; Invoice with totals, currency and Mark paid; Call Sheet. Next: Editorial Shoot workflow (Ika's priority). Fix list and
  open items: docs/FEEDBACK.md.

Milestone 4 — Shoot day: not started.

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
`20261025030000_project_files_tags.sql`, `20261026010000_activity_documents_files.sql`.
Not yet run (Ika): `20261025040000_document_limits_file_archive.sql`, `20261026000000_remove_pilot_clients.sql`.
