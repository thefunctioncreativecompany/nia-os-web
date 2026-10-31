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
  and projects share one vocabulary; title pages end with "You may also like" (by shared tags, `similarItems` in `match.ts`).
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
  invite, an email on `explore_invites`, or an invite code (kept only in the SQL Editor, never in this public repo; stored as a sha256
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
- (2026-10-23) Marketplace is hidden for now (`features.marketplaceShown` off): no navbar or dock
  tab, every `/marketplace` address goes to Home (next.config.ts), and Plans drops the
  marketplace line and gear rental fees. The code stays; flip the switch to bring it back.
- (2026-10-23) Welcome tour on Home (`src/components/home/welcome-tour.tsx`), after Gabriel's
  "Onboarding Experience made with Figma Motion" (Collect UI): a card over Home, the step on the
  left, a preview built from our components on the right (above on phones). Seven steps: welcome,
  Projects, Documents (the real Call Sheet miniature), Files and references, Your crew, Explore,
  "You're set" (Start a project). No Copilot until it's built. Opens by itself on the first Home
  visit after onboarding, once (`tour_pending` in the sign-in metadata, set when onboarding
  finishes and cleared when the tour opens; older accounts never get it by itself, no migration);
  "Take the tour" in the profile menu opens `/home?tour=1`. Not in Figma yet: reconcile it.
- (2026-10-23) MVP pilot feedback (`src/components/nia/feedback.tsx`, `src/lib/product-events.ts`):
  "Send feedback" (profile menu, and a Feedback button bottom-right on wide screens) saves a note,
  its kind, the page and an optional screenshot to `feedback`; the key jobs (project created,
  document created or downloaded, crew invited, file uploaded, reference added) go to
  `product_events`; the first project, download and invite each ask one thumbs up/down question,
  once. Read it in the SQL Editor: `select * from feedback_review` (with name and profession).
  Needs `20261105000000_feedback.sql`. Not in Figma yet.
- (2026-10-23) Project details (Ika): Details are shoot dates (a range, with the number of shoot
  days), client, agency, deliverables (count × what · frame shape), due date, duration (not for
  stills), genres, a few by type (`typeDetails`: logline for film and series; usage for brand
  work; looks and publication for photo shoots, editorials and lookbooks), budget (own table
  `project_budgets`, owner and editors only) and notes. Director, writers and stars moved into
  Crew & talent (`crew`, people by role, `src/components/projects/project-details.tsx`); the old
  columns stay unused. The share link shows the same, never the budget. Needs
  `20261106000000_project_details_crew.sql`. Not in Figma yet.
- (2026-10-23) Global search on desktop (`src/components/nia/global-search.tsx`): the navbar field
  or ⌘K / Ctrl K opens one window for projects, documents, files, templates and Explore (with
  early access): a filter chip per kind with its count, results grouped by kind (recent ones
  when nothing is typed), arrow keys and Enter, and a live preview of the result in focus
  (cover, document or template miniature, file picture). Its own download, fetched on hover or
  focus; lists kept two minutes; previews fetch once each. Phones and tablets keep the field.
  Not in Figma yet.
- (2026-10-23) New project form: the heading shows the name as it's typed; Instagram links can be
  added there and become references when the project is created. More genres (free text) and
  production types (database rule: needs `20261105010000_more_production_types.sql` before the
  new types can be saved).
- (2026-10-28) Templates show only the ones that fully work (Ika): 9 of 63 (Call Sheet, Crew
  Contact List, Invoice, Shotlist, Filming Notice, Equipment Rental Log, 3-Column AV Script,
  Continuity Log, Shot Logging Sheet). `catalog` (`src/features/templates/catalog.ts`) is the
  working ones only, so Templates, Home, search, From Template and "What's next" follow; the
  other 54 stay in the manifest and are built one per session. When one is built, add it to
  `src/features/templates/launches.ts` with the day it goes live and what it does "for you" and
  "for your team". For 30 days it gets the gold "New" marker (`NewMarker`), leads Templates in
  "Just added", and is announced once on Home (closing or using it records the code in
  `templates_announced` in the sign-in metadata; no migration). The first nine (2026-10-19) are
  the starting set and never marked new. Every preview shows the for-you and for-your-team lines.
  Not in Figma yet: reconcile Just added, the Home card and the marker.
- (2026-10-28) Explore tags (Ika): every title and creator film has 15 to 20 tags from one fixed
  list (`src/features/explore/tags.ts`: look, camera, setting, subject, mood, how it was made,
  made for, frame and origin). Hand-written ones are in `tag-data.ts`; the cover's look is measured
  by `node scripts/measure-explore-covers.mjs` (re-run after adding covers) into
  `cover-looks.json`; frame, region, decade, crew size and awards are worked out from the data.
  New Explore items need tags (the test fails without them). Search matches tags; each film's
  page has Production notes (tags by group, each opening View all with `?tag=`), plus Crew
  credited, Camera and spec-ad rows on creator films. Matching (`match.ts`): a project's
  suggestions score its type, genres, deliverables' frames, the words in its title, description,
  logline, usage and notes, its references' tags, and the person's taste, and show the two
  strongest reasons on each card. Taste (`taste.ts`) comes from what they open, save and add to
  projects, plus their profession; View all pages have a "For you" sort. No migration. Not in
  Figma yet: Production notes, the reason line on cards, the tag chip.
- (2026-10-28) "Recently added on Explore" (Ika): whatever joined Explore in the last 7 days,
  newest first, each card saying the day it was added. Since 2026-10-29 it is Explore's top
  gallery (the drifting poster columns under "Explore all ›", `ExploreLibrary`), its heading
  alone (Ika, 2026-10-30: no count or explaining line there or on By category's headings); when nothing is that new it shows the latest 20 additions
  (`galleryForToday` in `recent.ts`). The separate row under By category is gone. A title or creator film joins it when
  given an `added` day (`made-in-africa.json`, `creators.ts`; `src/features/explore/recent.ts`).
  First four: The Heart Is a Muscle and Gangster's Paradise: Jerusalema (Made in Africa, now 52),
  Nickel Boys and Capernaum (Explore all), with official trailers and TMDB posters. Atlantique
  was already there as Atlantics. The 53 creator films from the same day have no `added` day.
  Explore's Latest projects row is hidden (`features.exploreLatestShown`) until it works.
- (2026-10-28) Press kits as a source of information (Ika): the Top 10 press kits gather the
  press tour on video (official trailer first, then interviews and featurettes from the studio,
  streamer, festival or a major outlet, then established critics' video reviews), "What critics
  said" (a spread of reviews from edited publications, praise and criticism alike, each with our
  one-word read: Positive, Mixed or Critical; linked, never copied, no scores) and Context
  articles, plus Box office (Box Office Mojo, cinema releases) and Where to watch (JustWatch).
  Choosing a video plays it in the main player. Data in `src/components/explore/press-coverage.ts`;
  `node scripts/find-press-videos.mjs "<search>"` lists YouTube results with verified channels and
  whether each may be embedded. Some publications (Guardian, NYT, Vulture, New Yorker) couldn't be
  searched from here; add them by hand. Fixed: Scream's trailer was the 2022 film's (now
  Miramax's 1996 one); Obsession now has Netflix's official trailer. Next: press kits for the
  other titles. Not in Figma yet: Press tour, What critics said, Context.
- (2026-10-28) Explore fixes (Ika): "By category ›" opens `/explore/categories`, every category
  under a heading that shows or hides it (Show all / Hide all). Each press-kit film has its own
  page, `/explore/film/<id>` (`FilmView`, sharing `PressKitBody` with the pop-up), with Save and
  Add to project (saved as `film-<id>`, so films join collections and project references like
  any Explore title). The pop-up's "Open press kit" / "Open film page" now open it; director's
  notes documents stay greyed until documents open. The "4 new" pill on Recently added is gone.
- (2026-10-28) Press kits for all of Explore (Ika): every title and film except creator films
  has one, shown on title pages between Videos and You may also like, on film pages (now laid
  out like a project page: video, title, Save / Add to project and summary left; Details and
  Behind the production right; press kit full width below) and summarised beside the pop-up's
  Open press kit button. 60 kits in `src/features/explore/press-kits.json` (92 videos, 214
  reviews, 81 articles), built by `scripts/build-press-kits.mjs` (Wikipedia reception, official
  YouTube uploads, Wikidata) plus searched reviews, checked by hand, applied with
  `scripts/apply-press-kits.mjs`. Process and gaps: `docs/press-kits.md`. Run it for every new
  Explore title.
- (2026-10-28) Security review. Fixed: security headers on every page (no framing by other
  sites, nosniff, referrer policy, camera/mic/location off); invitation emails only link to
  Nia's own addresses; the Explore invite code taken out of the repo (it's public). For Ika:
  run `20261107000000_security_function_access.sql`; turn on leaked password protection
  (Supabase → Authentication → Passwords); replace the Explore invite code in the SQL Editor
  (the old one is in git history); update the privacy policy. Full notes were given in the
  session, not kept in this public repo.
- (2026-10-29) Hollywood Classics (Ika): a new Explore category of 30 films, 1939 to 1979, in
  two collections (The studio era, New Hollywood), shown in release order, each with a "what to
  study" note, official trailers (Carmen Jones has none
  yet) and tags. 15 posters are public-domain ones from Wikimedia Commons; the other 15 show the
  typographic cover until a `TMDB_API_KEY` is added (`scripts/find-title-assets.mjs` then
  fetches them through TMDB's API; TMDB's website must not be scraped). By category now sits on
  the Explore page itself: each category under a heading that shows or hides it, Show all /
  Hide all; `/explore/categories` redirects there. Title pages' "You may also like" draws from
  the title's own category.
- (2026-10-29) "Pair with" is no longer shown anywhere (Ika): it comes back as a proper
  side-by-side compare feature. The `pair_with` data stays in `made-in-africa.json` for it.
- (2026-10-29) Explore shows only titles with a cover (Ika). Waiting (data, tags and press kits
  kept; `waitingForCover` in `made-in-africa.ts`): Children of Blood and Bone (out January
  2027) and 15 Hollywood Classics (Citizen Kane, The Maltese Falcon, Sunset Boulevard, On the
  Waterfront, Carmen Jones, West Side Story, In the Heat of the Night, The Graduate, 2001, The
  Godfather, Jaws, Taxi Driver, Network, Star Wars, Apocalypse Now). Plan: add `TMDB_API_KEY`
  to `.env.local`, run `node scripts/find-title-assets.mjs` on them (it fills only what's
  missing), check each poster, add them to `cover-sources.json`; each title then appears on
  Explore by itself, in the Recently added gallery from its `added` day.
- (2026-10-29) Hollywood Classics grows (Ika): 20 studio films with Black and POC leads
  (collection "Black and POC leads": Ride Along, The Matrix, Coming to America, Coming 2
  America, The Karate Kid 2010, The Pursuit of Happyness, Do the Right Thing, Boyz n the Hood,
  Malcolm X, Training Day, Ray, Dreamgirls, Bad Boys, Waiting to Exhale, Crouching Tiger,
  Get Out, Black Panther, Moonlight, Hidden Figures, Crazy Rich Asians) and "Modern classics"
  plus Rocky and The Godfather Part II. Essentials: the films people in the industry reference
  (27, `essential` in `made-in-africa.json`), each with "Why you should know it" on its page
  and an Essentials filter on View all. Hollywood Classics has View all
  (`/explore/hollywood-classics`, the same page as Made in Africa's, `categoryViews`). All 30
  new films wait for covers (TMDB API), as do 15 earlier classics; their press-kit drafts are
  in `scripts/out/press-kit-drafts-classics-waiting.json` (not in git: rebuild with
  `build-press-kits.mjs` if lost). 15 visible classics have checked press kits.
- (2026-10-30) Explore seed list (Ika's `nia_explore_seed.csv`: 2026 festival discoveries, Empire's
  100 best films, Hollywood eras, a colour-and-light canon, Variety's 100 greatest TV shows) is
  added in batches of 10, each committed and pushed. Ika's rules: no new category without asking;
  approved new categories Festival discoveries 2026 and Greatest TV (not built until a title in
  them has a poster); films made outside Hollywood join Hollywood Classics; only titles with a
  free poster are added until a `TMDB_API_KEY` exists (Wikimedia Commons, by Wikidata or named
  in the list, `commons` in `find-title-assets.mjs`). The studio era collection now reads 1927 to
  1959. Batch 1 (Gone with the Wind, Double Indemnity, Rear Window, North by Northwest, It
  Happened One Night, The Grapes of Wrath, Mildred Pierce, Sunrise, Ben-Hur, Paths of Glory):
  six essentials; Sunrise has no official trailer; press kits checked by hand (Ben-Hur's and
  Mildred Pierce's videos were the remakes', removed). Batch 2 (12 Angry Men, City Lights, Footlight
  Parade, Out of the Past, Rebecca, Seven Samurai, I Am a Fugitive from a Chain Gang, The Ox-Bow
  Incident, The Shop Around the Corner, Trouble in Paradise): no official trailer for Rebecca (the
  only one found was Netflix's 2020 remake), Out of the Past (Warner's official clip instead), I Am
  a Fugitive or The Ox-Bow Incident; Dr. Strangelove left out (Commons has only a newspaper-style
  ad). That uses up every seed title with a free poster: none of the 100 TV shows or 2026
  festival films has one, so the other ~200 wait for the TMDB key. Batch 3 (Ika: Black American films; the 20
  modern ones from 2026-10-29 wait for TMDB posters): classic Black-led films with free posters
  in Black and POC leads, now described as running from The Emperor Jones to Black Panther:
  Stormy Weather, Cabin in the Sky, The Emperor Jones, Porgy and Bess, A Raisin in the Sun,
  Imitation of Life (1934), Lilies of the Field, The Blood of Jesus, Native Son (1951) and The
  Joe Louis Story; three essentials. Left out by eye: Hallelujah (Commons' poster is a Soviet
  film's), Body and Soul (a newspaper ad), Edge of the City (a small landscape card). No official
  trailer for Stormy Weather, Porgy and Bess, The Blood of Jesus or The Joe Louis Story. Then six of
  the hidden classics found real posters on Commons that Wikidata doesn't link: Citizen Kane, The
  Maltese Falcon, Sunset Boulevard, On the Waterfront, West Side Story and Jaws (shown from
  2026-10-30; their saved press-kit drafts checked and applied; West Side Story's had Spielberg's
  2021 trailers). The Graduate's Commons file is a newspaper ad, so it still waits. TMDB's key
  form asks personal or commercial: Nia is commercial (Ika chose commercial), so the rest wait for
  TMDB's commercial terms. Batch 4 (2026-10-31, studio-era classics with free posters): The General,
  Modern Times, King Kong, Frankenstein, His Girl Friday, Stagecoach, Notorious, Touch of Evil,
  High Noon and The Night of the Hunter; five essentials. Press kits needed heavy cleaning
  (Frankenstein's videos were Netflix's 2025 film and Young Frankenstein; High Noon's "reviews"
  were book pages; polls and lists moved from reviews to articles). Batch 5: Bride of Frankenstein, Laura, Gilda,
  The African Queen, The Adventures of Robin Hood, Bringing Up Baby, Mr. Smith Goes to Washington,
  The Best Years of Our Lives, An American in Paris and Top Hat; two essentials; no official
  trailer for Gilda or Top Hat (Laura's videos about other Lauras and An American in Paris's
  Broadway clips removed).
- (2026-10-30) Templates are built in order of how likely producers are to use them (Ika): 1
  Production Budget, 2 the creator templates (GRWM, Day in My Life, Product Review…, which the
  editor already handles), 3 Script Breakdown, Content Production Guideline and Press Junket
  Brief (one new section type each), 4 Storyboard and Casting Deck, 5 the 31 designs not made yet.
  Call Sheet – Detailed waits: it is the Call Sheet built section by section (needs Add section).
  Production Budget (D02) done, from Figma 796:9836: a `budget` section type
  (`src/features/templates/engine/budget-view.tsx`, data rules in `sections.ts`): Above the Line,
  Below the Line and Additional as tables (Category, Description, Rate, Units, Subtotal worked
  out, each group's subtotal and its share of the budget), then a summary with a contingency
  slider (0 to 25%, 10% to start) and the total, in the overview's currency; downloads list each
  group and the summary. Overview fields have real controls (type, currency, start and wrap
  dates, producer, line producer). D02 is in `launches.ts` (New for 30 days). The 13 creator
  templates done the same day (GRWM, Explainer Video, Day in My Life, Tutorial, Storytime, Product
  Review, Haul / Unboxing, Skit, Recipe, Workout, Room Tour, Q&A, Challenge / Trend): platform and
  format are choices, post date and time pickers, durations with units, numbers for servings, sets,
  reps, calories and rating, a person for who plays each character, Product Review's price in a
  chosen currency. Four repeated the posting fields in a second section (a slip in the design
  data); the copy was removed. Then Script Breakdown, Content Production Guideline and Press
  Junket Brief, with two new section types: `checklist` (`checklist-view.tsx`, Figma 932:9008:
  groups of tick boxes whose items can be reworded, added and removed; downloads list each item
  and whether it's done) and `categories` (Figma 840:28209: a written answer per category in a
  box with a neutral stripe; Figma's eleven stripe colours aren't theme colours, and its labels
  are in sentence case per the font rule; the AI Suggest button waits for Copilot). Then Series Bible,
  Call Sheet – Detailed (every section shown; Add section isn't built) and Talent Roster Report
  (a `metrics` section: each number in a card, in large type). 29 templates work now. Waiting:
  Storyboard and Casting Deck (pictures inside a document: where they're stored is Ika's call,
  since a document needn't belong to a project) and the 31 templates with no design yet.
  Just added redone (Ika: the big two-column cards were hard to read and showed only three of
  twenty): one scrolling row of compact cards for every new template, newest first, each with
  its name, stage and for-you line; the whole card opens the preview (both value lines and Use
  this template). Home's announcement names three others, then "and N more" to Templates.
- (2026-10-31) Explore all has a second view (Ika): a quick view at `/explore/all/quick`
  (`LibraryQuickView`): the same library one title at a time at its true shape, with what it is,
  a line about it (study note or summary) and four tags beside it (under it on phones and
  tablets), and Open (its page, or the film pop-up). Swipe or drag left and right, arrow keys or
  the side buttons; it goes round from the last title to the first and fetches the next pictures
  ahead. A Canvas · Quick view switch (`ExploreAllViews`) sits on both views; the canvas header
  lost its title count. Not in Figma yet.
- (2026-10-31) Dark mode (Ika): option A "Obsidian" from the dark-mode canvas in Claude Design
  (ground `#0A0908`, surfaces `#151311`/`#1F1C19`, lines `#2B2825`, text `#F3F0E9`, muted
  `#A19C91`, gold lifted to `#B5A272`), as the `.dark` tokens in `globals.css`, status and phase
  colours included. Matches the device by default for everyone; Settings → General →
  Appearance (Light, Dark, Match my device) overrides it on that device (localStorage
  `nia-theme`, no migration). `src/lib/theme.ts`; the root layout's script sets it before the
  page draws. Fixed whites are now `bg-card` (the same white in light); white text on fills that
  turn light is `text-background`; the black wordmark and fixed-black icons use `dark:invert`.
  The PDF preview stays white paper, carousel captions stay dark over pictures. New work: theme
  colours only, never `bg-white`. Not in Figma yet: reconcile the dark tokens and Appearance.

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
  actions greyed out.
- [x] Second audit (2026-10-23). Live, signed in: server ~20 ms; main content in 0.7–0.9 s on
  desktop and 0.8–1.3 s on a phone over 4G; database advisors show only notes. Every signed-in
  page now sends 18–46 KB less: animations import `framer-motion` (not `motion/react`) as `m.*`
  inside `MotionProvider` (77 → 50 KB on every page; the rest is the spring engine the navbar
  search and buttons call directly); pop-up calendars load on first open
  (`src/components/nia/lazy-calendar.tsx`); the project page's References and Inspiration come in
  their own download; Home's upload box and template preview load on demand; the editor's first
  PDF preview waits until the page is idle. Left for later: ten unindexed foreign keys and two
  `project_files` read rules (fine at today's size); `/projects/[id]#references` doesn't scroll
  to References (already so before this audit).

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
- [x] Instagram links as project references (Ika, 2026-10-22): editors paste a post or reel link
  under References on an open project; Nia reads the post's public page (account, date, caption,
  full-size cover with black bars measured off, as done by hand for Explore's creators) into a
  draft to check (title, type, note, credits to remove), then saves it beside the Explore titles.
  Private to the project (owner and invited people; cover in the private `project-files` folder),
  no Explore invite needed, duplicates caught before Instagram is asked. Each opens a page like a
  creator film's at `/projects/[id]/references/[refId]`. Code: `src/lib/instagram*.ts`,
  `add-instagram-reference.tsx`, `instagram-reference-{card,view}.tsx`. Migration
  `20261104000000_project_instagram_references.sql` (run). To do: the New project form's field;
  check the player in normal Chrome; check Instagram answers Vercel's servers once live (if not,
  Meta's oEmbed API); reconcile the paste field, draft pop-up and reference page into Figma.

Explore: creator film shapes and order (Ika, 2026-10-22)
- [x] 53 more creator films from Ika's list (2026-10-28): 72 in all, read from each post's
  public page and written up by hand (titles, summaries, credits); they use the newer types
  (Fashion Film, Campaign, Social Content, Editorial, Lookbook). To check in normal Chrome: the
  three `/p/` posts play (CLKPHqopjJn, DR5FZaLiWM1, DcKR_wJnAe3).
- [x] Made in Africa sits above Creators on Explore.
- [x] Films show at their true frame shape everywhere (Ika: shape is how filmmakers judge work;
  never a 4:3 in 9:16 or the reverse). `aspect` in `creators.ts` is the picture's shape without
  black bars (vertical reels 9:16; `frame` for a landscape film posted on bars, e.g. adidas
  Originals 1.55:1). `src/lib/aspect-ratios.ts` lists the standard shapes and names any
  picture's shape (`recognizeAspect`, within 2%); film pages show it as "Frame". Rows size cards
  by shape (`cardSpan`); grids of films are a masonry gallery (`FilmGallery`, Ika's Claude Design
  "Creators · Explore: masonry gallery (no gaps)") with type and frame tags; the Explore all
  canvas is a masonry too (Ika, 2026-10-23): each tile at its film's shape, posters at the
  poster shape (`LibraryCanvas`). The player hides Instagram's
  54 px header; Instagram's player crops vertical reels to 4:5, so their play window is 4:5.
  Next: record width, height and shape when files are uploaded (needs a `project_files`
  migration) and show uploads at their shape.
- [x] New order on each visit (Ika, 2026-10-22): Explore's Made in Africa and Creators rows and
  both View all pages are shuffled by a per-request seed (`src/lib/shuffle.ts`, picked after
  `connection()`, so server and browser agree). Explore's top grid keeps its "Most popular" sort.
  "Recently viewed" in both View all pages' Sort brings back what this person opened, newest
  first, on any device (`explore_views`, `src/features/explore/views.ts`; recorded when a title or
  creator film page opens).

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
- The link preview video lives on branch `link-preview-draft`, left out until Ika picks a direction.
- Collections: `20261031000000_collections_references.sql` run (2026-10-21); run
  `20261031010000_collections_remove.sql` run; `20261101000000_explore_access.sql` and
  `20261102000000_marketplace_access.sql` (then add a code) to run.

Queued fixes (2026-10-21, done): share link that's off says "This link is off"; project page
loads its cover cropper, calendar and Add document dialog only when used (604 → 570 KB); the
document editor's sticky section outline, pill toolbar with Print in the one download menu, and
"What's next" (from each template's `related` links; no workflow steps exist yet); calendar range
band and today's gold dot.

Old prototypes (Ika, 2026-10-22): the earlier "nOS" versions (single-file React apps Apr–Aug 2026,
a Figma Make export, May change sets) are gathered in `~/Downloads/Nia Technologies/Old prototypes`
with a README index. They aren't a source for this app's code or design; assess them later for
features worth keeping (AI-filled production frameworks, Crew roster, Contacts and Events), each
designed first and built to the current rules.

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
- Vercel: sign the CLI in as the nia-technologies account (it's on a personal one), then
  disconnect the extra projects (`nia-os-web`, `nia-os-web-s5dn`) that build every commit.

Week of 2026-10-19 (done, live; summary for Ika)
- Speed: a second performance audit; every signed-in page sends 18–46 KB less (animations via
  `framer-motion` + `MotionProvider`, pop-ups and calendars load on first use). Live, signed in:
  server ~20 ms, main content in 0.7–1.3 s on desktop and a phone over 4G. Final check
  2026-10-24: Home 405 KB, Projects 413, project page 433, editor 439, Explore 389, Login 300
  (compressed JavaScript); the welcome tour now downloads only when it opens.
- Product: Marketplace hidden; welcome tour for new accounts; New project form (live heading,
  Instagram links, more genres and types); global search on desktop; project Details for
  production (shoot dates, client, agency, deliverables, due date, budget, notes, by type) and
  Crew & talent; Explore all as a masonry of true frame shapes.
- Beta: pilot feedback (Send feedback, job tracking in `product_events`, one-tap questions);
  read it with `select * from feedback_review` in the SQL Editor.
- Fixes: a Vercel build failure (feedback outside Suspense) and Explore's shuffled pages in local
  dev; the Mac's disk filled up (caches cleared; keep an eye on free space).

Next week (from 2026-10-26, in order; agree each with Ika first)
1. Beta pilot setup: invite 3 ICP groups (producers and production managers; photographers and
   fashion or editorial creatives; creators and brand content), 5–8 people each, with a real
   shoot in the next 2–4 weeks. Move testers to Pro by hand, give them the Explore code, read
   `feedback_review` and the `product_events` funnel weekly, close the loop with testers.
2. Security before more testers: a migration revoking `anon` execute on internal helper and
   trigger functions (`can_edit_project`, `can_view_project`, `is_project_owner`,
   `is_workspace_*`, `handle_new_user`, `projects_before_write`/`after_write`,
   `accept_project_invites`; keep `shared_project`), and turn on leaked password protection
   (Supabase → Authentication → Passwords).
3. Milestone 4, "enter it once": shoot days, crew and locations on the project feed the call
   sheet, shot list, crew list and invoice (Details and Crew & talent are the start). Plan it
   for Ika's OK first; designs in Figma.
4. Then Home that knows the phase (prep: what's missing; shoot day: the call sheet; after wrap:
   final assets, invoices) and double-booking warnings for crew and locations.
5. Figma reconcile: welcome tour, Send feedback and the one-tap question, global search, project
   Details and Crew & talent, New project's Instagram field.
6. Vercel tidy-up (above): the CLI on the nia-technologies account, disconnect the two extra
   projects, set deployment retention.
7. Small: phones' search (global search is desktop only), the genre pills on Details are long
   now (24): consider a "More genres" fold.

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
`20261027000000_feature_waitlist.sql`, `20261031000000_collections_references.sql`, `20261031010000_collections_remove.sql`,
`20261101000000_explore_access.sql`, `20261102000000_marketplace_access.sql`, `20261104000000_project_instagram_references.sql`,
`20261105000000_feedback.sql`, `20261105010000_more_production_types.sql`,
`20261106000000_project_details_crew.sql`; also `20261028000000_plans.sql`,
`20261029000000_marketplace_waitlist.sql` and `20261103000000_explore_views.sql` (found run,
2026-10-28). Not run: `20261030000000_explore_made_in_africa.sql` (Explore reads sample data).
