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
- Brand: Obsidian `#0A0908`, Aged Gold `#8A7A52` (single accent, active states only), Geist for all text,
  sentence case. No serif and no all-caps monospace labels (Ika, 2026-10-19); the screenplay preview's
  Courier capitals are content formatting, kept until Ika decides.
- Build from `src/components/ui` (shadcn) and `src/components/nia`; new looks are variants. Keep shadcn
  focus rings and keyboard behaviour.
- Search and filters everywhere use Marketplace's look (Ika, 2026-10-20), from
  `src/components/nia/filter-bar.tsx`: `SearchField` (56px pill), `FilterChip` (40px pill; on = dark
  border, grey fill; optional count), `ChipMenu` ("Category: All ▾"), `ResultCount`.
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
- (2026-10-19) Project page follows Figma 824:23124 (cover, title, description left; Details and Behind
  the production right (Stills removed: Files & references covers it, Ika 2026-10-19); stacked on phones and tablets). Actions, overview, documents and
  activity sit in a "Manage" tab beside "Details"; Files & references full width below. Built.

- (2026-10-19) Explore shows a coming-soon screen (Ika's Claude Design "ExploreSoon") until it opens
  in February 2027; Notify me saves to `feature_waitlist`. Downloaded PDFs are real files (jsPDF, Geist),
  not the print screen; Print stays in the editor toolbar.
- (2026-10-20) Explore (coming soon at `/explore`, library preview at `/explore/preview`) is built
  exactly as Ika's Claude Design: its motion (ring that turns on its own, press-kit columns that
  scroll forever, the design's glide timings as `duration-glide/lift/strip/drift/zoom` + `ease-glide`)
  and the posters and stills she supplied (`public/explore`). Only platform formatting applies:
  Geist, theme colours, our buttons, sentence case. This overrides the no-loops rule and the poster
  licence note for Explore only. `features.exploreUnlocked` (`src/lib/features.ts`) switches
  `/explore` to the library.
- (2026-10-20) Templates below "Suggested for you" follow Ika's Claude Design "Templates": Workflows
  and Strategy & Development as pointer-scrubbed filmstrips, Production Management and Coming soon
  as ranked lists with a following preview, UGC as scrolling columns. Reusable as
  `ScrubFilmstrip`, `RankedList`, `MarqueeColumns` (`src/components/nia`). Phase pill colours are
  theme `phase-*`. Every template opens its preview pop-up.
- (2026-10-20) Explore's press-kit cards open a preview laid out like the template pop-up: the
  official video (studio or streamer's own YouTube channel, privacy-enhanced player, loaded only on
  Play), our own one-line summary, facts from Wikidata, and links out to IMDb, Rotten Tomatoes and
  Wikipedia. No scores (their terms). Data in `src/components/explore/film-details.ts`. "Open press
  kit" keeps the paid-plan rule. The same preview opens from the Explore all grid ("Open film page")
  and Top 10 director's notes ("Open" + the document); Latest projects keeps its own behaviour (Ika).
- (2026-10-20) Marketplace follows Ika's Claude Design and `design-ref/marketplace/MARKETPLACE_SPEC.md`.
  Coming soon is the design's field of product tiles held still (Ika: the panning felt clunky), with
  Explore's looping-motion exception for the amber dot. While `features.marketplaceUnlocked` is off,
  tiles show a name on hover but no price and no link (Ika 2026-10-22: nobody should think
  Marketplace is open), and every page under `/marketplace` is locked like Explore: an invite code
  on coming soon opens the store for that account (`src/app/(app)/marketplace/layout.tsx`,
  `src/lib/marketplace-access.ts`, `has_marketplace_access()`; codes only, no email invites, none
  written in the public repo; added in the SQL Editor as the migration says). `/marketplace/preview`
  redirects to `/marketplace`. Needs `20261102000000_marketplace_access.sql`. Notify me
  goes to the signed-in account's email, shown on the card; no email box (coming-soon screens are
  signed-in only). Nothing sends those emails yet. The gear rental fee follows the Plans page (renter's
  plan: 5% Free/Starter, 4% Creator, 3% Pro/Enterprise), not the spec's creator/partner split.
  Sample data in `src/features/marketplace/data.ts`. The waitlist name `marketplace` needs
  `20261029000000_marketplace_waitlist.sql` (run after the plans one). Coming soon has one button,
  Join the waitlist, then the invite code field (Ika, 2026-10-22; no List your gear early); photo
  credits open in a pop-up.

- (2026-10-21) Explore changes (Ika): Top 10 press kits is one still row, 1 to 10 left to right,
  scrolled by hand or with edge arrows (`ScrollRow`), no longer five self-scrolling columns.
  Made in Africa on Explore is a still row of equal cards like the press kits, without numbers
  (`TitleCard` in `ScrollRow`); Templates' strips keep pointer scrubbing. Explore all lists each
  film once. View all has Genre, Country, Year (one year or a span), Type and Sort (Relevance,
  Title, Newest, Oldest, Country), using the projects' `GENRES` and `PRODUCTION_TYPES` so Explore
  and projects share one vocabulary; title pages end with "You may also like" (`similarTo`).
  "Explore all" opens `/explore/all`: the whole library (`src/features/explore/library.ts`, each
  title once; user projects join later) on a canvas that goes on in every direction, posters as
  close as the Explore all grid (`LibraryCanvas`: drag with a glide, scroll, arrow keys; only
  what's in view is drawn). Titles open their page (back link to Explore all), Explore's films
  their pop-up.
  TMDB is credited wherever its posters and genres show (`TmdbCredit`: educational, beta
  testing, no revenue). Explore curates others' work for inspiration; Nia doesn't distribute it.
  Made in Africa covers are the official posters in high resolution (TMDB originals up to 1600
  wide, plus Ika's four); sources in `src/features/explore/cover-sources.json` for the TMDB
  licence Explore needs before launch. Trailers show YouTube's thumbnails through our image server.
- (2026-10-21) Explore is for creators as much as filmmakers (Ika): a Creators category
  (`src/features/explore/creators.ts`) of commercials, fashion films, music videos and shorts
  from Instagram, under By category (after Made in Africa) and on Explore all, each with a page at
  `/explore/creator/[code]` (Instagram's player on Play, full production credits from the post's
  caption, handles as posted, Nia-written summaries). Types use the projects' list, so a
  Commercial or Music Video project's inspiration leads with them. Credited as beta/educational
  use; before launch, use Meta's oEmbed API (needs a Meta app) instead of reading public pages.
- (2026-10-21) Explore is early access (Ika): every `/explore` page is gated by `has_explore_access()`
  (`src/app/(app)/explore/layout.tsx`, `src/lib/explore-access.ts`): a confirmed Supabase email
  invite, an email on `explore_invites`, or an invite code (CREATIVITY2026; stored as a sha256
  fingerprint in `explore_codes`, 10 wrong tries an hour). Others get coming soon with the code
  field. Saving to collections and adding project references need it too (database rules).
  `/explore/preview` redirects to `/explore`. Needs `20261101000000_explore_access.sql`.
- (2026-10-21) Anything that doesn't work yet is greyed out with a `NotYet` note saying when it opens
  (`src/components/nia/not-yet.tsx`), never active with a "nothing happened" message: Marketplace's
  Pay, Publish listing, fleet request and the lister dashboard's Accept / Decline / pause; Explore's
  Open press kit / film page (this drops the free-plan upgrade prompt there, to confirm with Ika) and
  Latest projects. Remove the `disabled` and the note when the feature opens.
- (2026-10-22) Log in and Create account lead with "Continue with Google", then "or", then the
  email fields (`src/components/auth/auth-form.tsx`), to encourage Google sign-ins. Figma's auth
  screens still show email first; update them to match. Email sign-up tested end to end (Resend
  email arrives in Gmail, link confirms and signs in).

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
  to end locally and live. To do: trim per Decisions above.

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
  with typed columns (T5); people fields; Invoice with totals, currency and Mark paid; Call Sheet. Next: Editorial Shoot workflow (Ika's priority). Fix list and
  open items: docs/FEEDBACK.md.

- [x] 3.4 PDF export (print layout; Download PDF, Word, Markdown, .txt) and 3.7 Batch C (Continuity Log,
  Shot Logging Sheet, Equipment Rental Log, Filming Notice, Invoice) done. Also working: Crew Contact
  List, Shotlist, 3-Column AV Script, Call Sheet. Still open: 1.3 (Fix 1 email check), 1.4 (onboarding
  trim), 2.2 (sort), 2.3 (Team Members), 2.4 (file detail panel), 2.5 (Next shoot, Complete your
  profile), 3.1 (Editorial Shoot launcher). Audit 2026-10-19 and its fixes: docs/FEEDBACK.md (A1–A14).

Marketplace (from Ika's Claude Design and `design-ref/marketplace/MARKETPLACE_SPEC.md`; not in BUILD_PLAN)
- [x] Built on sample data (`src/features/marketplace/`), behind `features.marketplaceUnlocked` (off):
  coming soon at `/marketplace` (still field, waitlist, Preview Marketplace), and the store at
  `/marketplace/preview`: home (filters, Latest gear, Logistics & fleet, Digital products),
  `/marketplace/listing/[id]`, `/marketplace/checkout` (payments UI only), `/marketplace/list`,
  `/marketplace/fleet/[id]`, `/marketplace/dashboard`. Fees in `fees.ts` (tested). To do: Supabase
  tables for listings, bookings and requests; payments (Stripe); My rentals; messages to listers;
  run `20261029000000_marketplace_waitlist.sql`.

Explore, Made in Africa (Ika's build guide, 2026-10-21)
- [x] Built on sample data (`src/features/explore/made-in-africa.json` + `.ts`, in the shapes
  `src/lib/explore.ts` returns): the first 15 titles as the "05 · Filmstrip scrub" strip under By
  category (`ScrubFilmstrip look="reel"`), View all at `/explore/made-in-africa` (search, a chip per
  collection), and a page per title at `/explore/title/[slug]` laid out like the project page
  (trailer where the cover sits, season pills with `?season=`, Details, Behind the Production,
  Videos; back link to Explore, or to View all with `?from=all`). All 50 covers in
  `public/explore/made-in-africa` (36 at 1200+ wide; 14 have nothing larger in English on TMDB).
  To do: synopses;
  run `20261030000000_explore_made_in_africa.sql` and the seed script (needs
  `SUPABASE_SERVICE_ROLE_KEY`), then read from Supabase; the quick-view pop-up for these titles.

Performance audit (2026-10-21)
- [x] Login 96/100 on phones in Lighthouse, ahead of StudioBinder, Frame.io, Milanote, Notion, Canva,
  Figma and Airtable. Fixed: local sign-in check on the server, browser session reads, search loads on
  first use, one-request plan lookups, parallel template-editor queries, unused fonts not preloaded,
  theme library removed, tooltips only in the app, Explore's first poster fetched first, non-working
  actions greyed out. Next: the navbar's menu and search pull in the animation library (~77 KB) on
  every signed-in page; move them to `LazyMotion` as its own step.

Projects × Explore (Ika, 2026-10-21)
- [x] Projects: find and sort (search, a chip per stage with counts, Type and Genre in the shared
  lists, Sort: last edited, newest, title, shoot date; `?q=` fills the search) and Projects ·
  Collections tabs (`ProjectsBrowser`, `ProjectsTabs`). Finishes 2.2's sort.
- [x] Collections at `/projects/collections`: titles saved from Explore in named collections (Save
  on title pages and suggestions; a first save makes "Saved"), each with Add to project. Project
  pages show References from Explore and Inspiration for this project (titles matched to its
  genres and type, one tap to add). Needs `20261031000000_collections_references.sql` (until run,
  these say they aren't switched on). Helpers in `src/features/explore/saves.ts`.
- [x] Document editor: a live preview of the PDF you'll download (`LivePreview`), redrawn a moment
  after each change, in place of the template's description.

Explore: creator film shapes and order (Ika, 2026-10-22)
- [x] Made in Africa sits above Creators on Explore.
- [x] Creator films keep their shape (`aspect` in `creators.ts`: landscape as measured, vertical
  4:5). Rows give landscape films wider cards as tall as the posters beside them (`cardSpan`);
  grids (`shape="poster"`, Collections) and the Explore all canvas show the whole frame on a
  blurred fill (`FramedStill`). The film page's player takes the film's shape and hides
  Instagram's 54 px header (measured: the film runs full width right below it).

Sound and films (Ika, 2026-10-22)
- [x] Interface sounds, made once with ElevenLabs (`scripts/make-sounds.mjs`, files in
  `public/sounds`) and played by `src/lib/sounds.ts`: a soft chime with every success toast, a
  low tone with every error toast and refused upload, a quiet tick on the main tabs (as the press
  starts). On by default at low volume; Settings → General → Sound turns them off on this device
  (localStorage, no database). Explore all's canvas has a quiet screening-room ambience with its
  own on/off button. An opening swoosh was tried and removed (Ika). The ElevenLabs key is in
  `.env.local` for scripts only: the app never calls ElevenLabs, so Vercel doesn't need it.
- [x] Product films in `video/` (Remotion, its own packages): Made in Africa, and Projects and
  templates (`npm run render:demo`), made from real screenshots of the flow (new project →
  project page → Call Sheet → save to project → Files & references) with an ElevenLabs
  voice-over (`src/narration.json`, `npm run narrate`; George on eleven_v4). Films render to
  `video/out` (not committed). Play them in QuickTime or a browser: VS Code's preview has no AAC
  sound.

Future fixes (2026-10-22, from the sound and film session)
- The Sound card in Settings → General isn't in Figma: design it in Claude Design and reconcile.
- Listen to the sounds and the ambience on real speakers (volumes were set by measurement);
  remake any with `node --env-file=.env.local scripts/make-sounds.mjs <name>`.
- Phone dock: the tick plays when the finger lifts (the dock chooses on lift), not on press.
- Projects and templates film: the navbar shows the test account's name "Test Crew" (rename it,
  then re-capture), and the genre reads Drama (the form's default) for a photo shoot. Capture
  scripts are in `video/scripts/capture/` (need `puppeteer-core`); empty the clean test account
  first.
- Test data from the film: "Studio lookbook" projects on both test accounts (the second has a
  call sheet and three stills); soft-delete when no longer needed.
- Creator films: check a playing vertical film in normal Chrome (headless Chrome showed
  Instagram's "View more on Instagram" bar at every size).
- ElevenLabs plan: check it allows commercial use before publishing the films.

Next session (Ika, 2026-10-21, asked for, not started)
- A full-screen "By category" view (from the "By category ›" heading): every category, each
  under a heading that shows or hides it.
- The link preview video lives on branch `link-preview-draft`, left out until Ika picks a direction.
- Collections: `20261031000000_collections_references.sql` run (2026-10-21); run
  `20261031010000_collections_remove.sql` run; `20261101000000_explore_access.sql` and
  `20261102000000_marketplace_access.sql` (then add a code) to run.

Queued fixes (2026-10-21, done): share link that's off says "This link is off"; project page
loads its cover cropper, calendar and Add document dialog only when used (604 → 570 KB); the
document editor's sticky section outline, pill toolbar with Print in the one download menu, and
"What's next" (from each template's `related` links; no workflow steps exist yet); calendar range
band and today's gold dot.

Future builds (agreed with Ika, build later; need designs first)
- Project cards: a no-cover look, production-type chip and stage badge, hover lift.
- Home: Next shoot, Complete your profile / set up your workspace (W1).
- Projects: Team Members (2.3), References gallery (R1).
- Templates: Editorial Shoot launcher (3.1, Fix 13); then "What's next" can follow its steps.

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
`20261025030000_project_files_tags.sql`, `20261026010000_activity_documents_files.sql`,
`20261026020000_link_shared_projects.sql`, `20261025040000_document_limits_file_archive.sql`,
`20261026030000_document_rules_wording.sql`, `20261026000000_remove_pilot_clients.sql`,
`20261027000000_feature_waitlist.sql`, `20261031000000_collections_references.sql`, `20261031010000_collections_remove.sql`.
