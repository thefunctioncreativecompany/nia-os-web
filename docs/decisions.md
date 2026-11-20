# Decisions log

Every product and design decision Ika has made, dated, in the order they were made (moved out of
CLAUDE.md on 2026-11-02 so sessions start lighter; CLAUDE.md keeps a summary of the ones that
shape everyday work). Read the entry for a feature before changing it. "Not in Figma yet" marks
work still to reconcile into Figma. Entries about Marketplace, Explore's Feed and quick view, and
onboarding's Import profile and Follow creators describe features removed in the 2026-11-02 audit
(restorable from the git tag `parked-2026-11-02`).

- Brand: switch to the plan's brand (Obsidian, Aged Gold, Geist, Instrument Serif) now, even though
  Figma still shows DM Sans and `#1A1A1A`. Done in step 0.2.
- Onboarding: trim to the plan. Hide Import profile and Follow creators now (keep the code for after
  beta). "What you can do" as slides and "How did you hear" as an optional tap on the last screen wait
  until Ika updates Figma. Done in step 1.4.
- Home lives at `/home`; `/dashboard` redirects there. Done with the step 1.3 fixes.
- Auth and onboarding heroes are a fixed still per screen (`src/components/auth/hero-images.ts`), not a
  slideshow (no looping animation). Figma's image where Ika's set has it in high resolution; the
  rest are picks from her set, to be confirmed.
- Nia Blue (was gold) marks the active navbar tab (light tint) and the active Settings tab (underline).
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
- (2026-10-31) Email sign-up friction (Ika): Supabase's sign-in errors are plain guidance
  (`src/lib/auth-errors.ts`, tested) on Log in, Create account, resend, the code box and
  `/auth/error`. Logging in before confirming sends a fresh confirmation and opens Check your
  email (with the code box), instead of "Email not confirmed". Signing up with an address that
  already has an account says so (Supabase sends nothing for those). A used or expired link
  explains that school and work email can open links to scan them, and offers Log in. Check
  your email notes that school and work email can hold it. To check delivery, see Resend's
  logs (a babson.edu confirmation sent 2026-10-31 20:57 UTC was never opened).
- (2026-10-31) Beta walkthrough (a new account, sign-up to sharing, on localhost): sign-up, the
  confirmation link, onboarding, the welcome tour, a first project, a call sheet saved into it and
  an invite all work without errors. Fixed: onboarding trimmed to 7 screens; a new account was
  greeted "Welcome back" (now "Welcome" until the first project); the New project form defaulted
  the genre to Drama (now none, optional); title-case labels (Project name, Production type, Edit
  project details, Delete project, Other suggestions). Test account: a `+beta…` alias of the test
  email with the project "Night Market lookbook" (shared with test user 2).
- (2026-10-23) Welcome tour on Home (`src/components/home/welcome-tour.tsx`), after Gabriel's
  "Onboarding Experience made with Figma Motion" (Collect UI): a card over Home, the step on the
  left, a preview built from our components on the right (above on phones). Seven steps: welcome,
  Projects, Documents (the real Call Sheet miniature), Files and references, Your crew, Explore,
  "You're set" (Start a project). No Copilot until it's built. Opens by itself on the first Home
  visit after onboarding, once (`tour_pending` in the sign-in metadata, set when onboarding
  finishes and cleared when the tour opens; older accounts never get it by itself, no migration);
  "Take the tour" in the profile menu opens `/home?tour=1`. Not in Figma yet: reconcile it.
- (2026-11-01) What's new in the tour (Ika): someone who has taken the tour gets, from "Take the
  tour", what's new since their last one (`tour_seen_at` in the sign-in metadata, saved whenever the
  tour closes; no migration), the updates most relevant to their group first (production, fashion
  or creators, from their profession's onboarding sector; `src/features/whats-new/updates.ts`,
  tested), each with a button to try it; Explore's updates only with Explore access; the welcome
  tour when nothing is new. Add an entry to `UPDATES` (date, plain words, link, a weight per group)
  whenever something people can use goes live. Not in Figma yet.
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
- (2026-10-31) Search (Ika): tag search, autocorrect and suggested searches in global search
  (`src/lib/search.ts`, tested): Explore titles are found by their tags and a tag can be
  searched on its own (a `#` chip); when nothing matches, misspelt words are corrected to words
  that exist in the person's projects, documents, files, templates and Explore ("Showing results
  for … · Search for … instead"); with nothing typed, recent searches on this device
  (localStorage) then popular ones; while typing, matching tags and title completions. Phones
  and tablets open the same search full screen from the top bar's field (one column, Cancel to
  close). Not in Figma yet.
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
  "for your team". For 30 days it gets the "New" marker (`NewMarker`; no date beside it since Ika, 2026-10-31), leads Templates in
  "Just added", and is announced once on Home (closing or using it records the code in
  `templates_announced` in the sign-in metadata; no migration). The first nine (2026-10-19) are
  the starting set and never marked new. Every preview shows the for-you and for-your-team lines.
  Not in Figma yet: reconcile Just added, the Home card and the marker.
- (2026-10-31) Template mini tutorials (Ika): a 14-second Remotion animation per template, drawn
  in the browser by `@remotion/player` from the template's own content (context: stage and the
  for-your-team line; purpose: the for-you line; how to: its How to use steps beside its real
  sections filling in, then Download PDF / Save to project). Plays once, silent and muted (so
  browsers start it without a click), rests on the last frame with Watch again
  (`src/features/templates/tutorial/`). In the template preview's picture box for templates
  that work (the still miniature under reduced motion or for workflows), and above a new
  document the first time a template is opened on this device (`nia-tutorials-seen`, Got it).
  The player is its own download. Remotion is free for individuals and companies of up to 3
  people; confirm before the team grows (`acknowledgeRemotionLicense` is set). Not in Figma yet.
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
- (2026-10-31) Stand-in covers (Ika): until TMDB's licence allows posters, a title waiting for a
  cover shows a still from its official trailer (the studio's or streamer's own YouTube upload).
  Not the channel's thumbnail (often has words on it): one of the frames YouTube takes from
  inside the video, chosen by eye with where the subject is (`CHOSEN` in
  `scripts/trailer-stills.mjs`, which measures the black bars into `trailer-stills.json`).
  `/api/explore-still/<video>-<frame>/<slug>.jpg` cuts the bars and crops to the poster shape
  around the subject (only listed frames; cached a year). Title pages say "Cover: a still from
  the official trailer." 36 titles appeared this way; Carmen Jones (no trailer), Network, Do the
  Right Thing and Jurassic Park (no frames) still wait. A real poster replaces the still.
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
- (2026-11-02) Back where you left off (Ika): every "← Back to …" link is a `BackLink`
  (`src/components/nia/back-link.tsx`): when the page before is the link's page it steps back
  through history, so Next's preserved page returns as it was (scroll, rows, filters,
  Explore's shuffled order); otherwise it opens the page. The trail is the last few addresses
  in this tab, in sessionStorage (on the device only, never sent, gone when the tab closes; no
  cookie, so no consent banner is needed for it, but the privacy policy should mention it).
  The browser's own Back already restored the page (tested). Phones: Explore's Details rows
  keep the label beside the value; template cards carry the New marker on the card so names
  line up along a row.
- (2026-11-02) Explore's icon is Lucide's pinwheel (`LoaderPinwheel`; `public/app/explore.svg` on
  desktop), the closest Lucide match to the mark Ika shared, replacing the compass. A round
  button bottom left opens Explore all from any page (`ExploreAllButton`, desktop only, hidden
  on Explore all), opposite Send feedback. Explore all's switch now reads Canvas · Timeline.
  Not in Figma yet.
- (2026-11-02) Explore all Timeline + Colour (Ika's `EXPLORE_TIMELINE_SPEC.md`; plan agreed, built
  in steps, each checked and pushed): A done: release dates (Wikidata, earliest release; 254 of
  255, 172 to the day) and colour palettes (5 colours in CIELAB from trailer frames, else the
  cover; dominant colour, hue, warm/cool/neutral, black and white) by
  `node scripts/build-explore-timeline-data.mjs` into `release-dates.json` and `palettes.json`
  (rerun when titles are added). B done: `/explore/all/timeline` (not linked yet): one time
  scale from a century to an hour (`src/features/explore/timeline/scale.ts`, tested), zoom
  around the pointer (⌘/Ctrl + scroll, pinch), drag with momentum, level buttons that light up
  as you zoom, Today, Fit, paging, the playhead with its date, and the axis with the next unit
  pinned below; C done: posters at their release day (2:3, creator films at their shape),
  sized by level, stacked in up to three rows and gathered into clusters (leading title in
  front, two behind, a count; click zooms to fit them; `layout.ts`, tested); the nearest
  poster to the playhead lifts, neighbours fall off and far ones dim (an outline instead with
  reduced motion); the readout shows its format and title (click opens it); at Century, a
  chart of titles per year with each decade's leading title above. A plain click on a poster
  opens it; a drag never does. Readout is empty when no title is near the playhead (Ika: no
  "Your year in frames"). Film-history eras behind the lane (`eras.ts`: Silent 1895–1927, Studio
  1927–1960, New Hollywood 1967–1980, Blockbuster 1980–2000, Digital 2000–2013, Streaming
  2013–today): a tinted band each, the one under the playhead in Nia Blue, names with years
  above the dates. Posters shrink to fit three rows on short screens. D done: the overview strip (the whole library per year on a
  canvas; drag the window, drag its edges, click to go there), keyboard (arrows, Shift+arrows,
  + and −, 1–7, T, F, Enter, Tab walks the posters and the playhead follows), a screen-reader
  summary once the view settles ("Showing 2013 – 2028, 141 titles."), the address holds the
  view (`?from=…&to=…&focus=…`, replaced not added; a shared link opens the same view), a Zoom
  menu on phones, "Nothing here between …" with Fit, the "1 undated" count (opens the canvas),
  the TMDB credit, and the Explore all button opens the view last chosen (localStorage
  `nia-explore-all-view`). Speed: `?mock=5000` (development only) gives 5,000 made-up titles;
  measured 56 frames a second on average while zooming and dragging in headless Chrome on
  this Mac (some frames take 33 ms); posters move by transform and don't redraw. Project rules over the spec: theme colours,
  Geist, sentence case (the format above the title reads "Music video", not capitals). Next: E colour band and filter; F Colour view; G production bars (after
  Milestone 4 shoot days); H TMDB (after the licence). Not in Figma yet.
- (2026-10-31) Explore all has a second view (Ika), hidden for now (`features.exploreQuickViewShown`
  off: no switch on the canvas, `/explore/all/quick` goes to `/explore/all`; the code stays): a
  quick view at `/explore/all/quick`
  (`LibraryQuickView`): the same library one title at a time at its true shape, with what it is,
  a line about it (study note or summary) and four tags beside it (under it on phones and
  tablets), and Open (its page, or the film pop-up). Swipe or drag left and right, arrow keys or
  the side buttons; it goes round from the last title to the first and fetches the next pictures
  ahead. A Canvas · Quick view switch (`ExploreAllViews`) sits on both views; the canvas header
  lost its title count. Not in Figma yet.
- (2026-10-31) Dark mode (Ika; light mode then matched it: neutral greys, `#1F1F1F` text, blue
  `#005FB8` accent): neutral greys like VS Code's dark theme (ground `#1F1F1F`,
  cards `#262626`, panels `#2F2F2F`, lines `#3A3A3A`, text `#E6E6E6`, muted `#A0A0A0`) and VS
  Code's blue `#3794FF` as Nia Blue in dark (the `nia-blue` token:
  active tabs, unread dots, New markers, announcement and deadline borders), as the `.dark`
  tokens in `globals.css`, status and phase colours included. Matches the device by default for everyone; Settings → General →
  Appearance (Light, Dark, Match my device) overrides it on that device (localStorage
  `nia-theme`, no migration). `src/lib/theme.ts`; the root layout's script sets it before the
  page draws. Fixed whites are now `bg-card` (the same white in light); white text on fills
  that turn light is `text-background`; the black wordmark and fixed-black icons use `dark:invert`.
  The PDF preview stays white paper, carousel captions stay dark over pictures. New work: theme
  colours only, never `bg-white`. Not in Figma yet: reconcile the dark tokens and Appearance.
- (2026-10-31) Card hover (Ika): on hover or keyboard focus the blue accent draws itself once
  round a card's edge, clockwise from the top, and stays as its border (`hover-sweep`); an icon
  tile or cover marked `group-sweep` does the same when its card is hovered (`globals.css`, one
  pass, plain blue edge under reduced motion). On project cards, template cards and tiles, Home's
  template row, Just added, My drafts, project documents, What's next, the New project and Add
  document choices, and Feed stories. Use it on new clickable cards. Not in Figma yet.
- (2026-10-31) No more Obsidian (Ika): the accent token is renamed `gold` → `nia-blue`;
  downloaded PDFs use `#1F1F1F` text with Nia Blue rules under each heading (`export.ts`);
  invitation and auth emails have a Nia Blue button and neutral greys. For Ika: paste the
  updated `supabase/email-templates/confirm-signup.html` and `reset-password.html` into
  Supabase → Authentication → Emails (Source view).
- (2026-11-01) Cast & Crew and person pages (Ika, after Apple TV's row and person page; Milestone 4
  plan agreed: one directory per workspace, call sheets live until issued, crew without accounts
  for now, start with People). `CastCrewRow` (`src/components/nia/cast-crew-row.tsx`): round
  pictures, name, role, initials until there's a picture; on creator films now (people from the
  captions' credits, cast first; companies listed apart), projects and Explore's films next.
  `/explore/person/[key]` (`src/features/explore/people.ts`): name, roles, Instagram link, Films,
  Worked with. Pictures only with consent: initials until the person claims their credit ("This is
  me", coming) and chooses Nia photo, Instagram picture or initials; film people get free Commons
  photos, credited (agreed). Films and series now have it too (2026-11-01): cast first with who
  they play, then director or creator, writers, producers, DP, editor, music, production and
  costume design, from Wikidata (`node scripts/build-explore-credits.mjs`, only new titles; `--all`
  rebuilds; run it when adding titles) into `film-credits.json` and `film-people.json`
  (`src/features/explore/film-people.ts`; person pages merge both in `people-index.ts`). 166 of
  183 titles have credits (some South African series have none on Wikidata); 2,162 people,
  1,543 with a Commons photo, which loads from upload.wikimedia.org directly (Wikimedia refuses
  our image server) and is credited (author, licence) on the person's page. Searched matches
  must share the title's name or year (`CHECKED` pins ones confirmed by hand).
- (2026-11-01) Cast & Crew standard format (Ika): every Explore row (films, series, creator films)
  uses one vocabulary and order (`src/features/explore/credit-format.ts`, tested): roles get a
  standard name and department ("DOP" → Director of Photography), and the row leads with
  director or creator, the first three billed, writer, producers and creative director, DP or
  photographer, editor, the next three billed, music, design, styling, then the rest. Only the
  top 10 reach the page; "View all N" opens the full list by department for paid plans (any
  workspace they belong to; `loadAllCredits`, a server action) and the upgrade prompt on Free
  (`credits` reason). Like the other plan limits it's open to all off the live site. Creator
  films' full credits are in the page's code already (caption data), so their paywall is a
  soft one. Not in Figma yet: View all and the full-list pop-up. Figma: frame 18 Cast & Crew directory (967:30543) is the project
  screen for step 1; 921:2510 is the scene breakdowns (4.6). Not in Figma yet: the row, person page.
- (2026-10-31) Sourcing creator films (Ika: strictly creator content): `node --env-file=.env.local
  scripts/find-creator-films.mjs` writes proposals to `scripts/out/creator-candidates.json` from
  Vimeo Staff Picks (public feed + Vimeo oEmbed, no key) and, once `YOUTUBE_API_KEY` is in
  `.env.local`, YouTube search (Data API v3, embeddable videos only). It drops trailers, clips,
  episodes, reviews and interviews, studio/streamer/network channels, and anything under 30 s or
  over 25 min, and guesses each type. Instagram can't be searched without Meta's approved app.
  Ika approves each before it's written up (credits, summary, 15–20 tags). Before Vimeo or
  YouTube creator films can join Explore, creator pages need to play them (today: Instagram).
- (2026-10-31) Creator films Instagram won't play (Ika): `embeds: false` in `creators.ts` shows the
  cover with Watch on Instagram instead of Instagram's "may be broken" player (No Scene Girls'
  strap bodysuit, `Deub31ivOv-`); `sensitive: true` adds a sensitive-content screen (blurred
  cover, "Sensitive content", why). `node scripts/check-instagram-embeds.mjs` tests every
  film's player; run it when adding creator films.
- (2026-10-31) Top 10 on Explore (Ika) replaces Top 10 director's notes (the notes don't exist
  yet; `DirectorsNotes` stays unused): the titles and films people open, save and add to
  projects most in the last 30 days, ranked again on every visit (`src/features/explore/top.ts`,
  tested: each opener once, opens in the last week twice, a save 3, an addition to a project 5;
  Explore's essentials fill the rest). Rows are rank, title, and type and year; the cover shows
  beside the pointer on hover, as the director's notes did. Totals come from `explore_top()` (returns counts per title
  only, never who; Explore access needed; `20261108000000_explore_top.sql`, run 2026-10-31). The page doesn't wait for it: only the section has a placeholder.
- (2026-10-31) By studio on Explore (Ika approved the category): a chip per studio with its
  titles on Explore (`StudioStrip`, `src/features/explore/studios.ts`, worked out on the
  server). The studio catalogue (`studio-catalogue.json`, 312 titles: each studio's most notable
  films and series from Wikidata, by Wikipedia language editions; Paramount, Universal and Focus
  (NBCUniversal), Columbia, Warner Bros., Disney, 20th Century, MGM, Netflix (originals only),
  Lionsgate, A24, Neon) is rebuilt by `node scripts/build-studio-catalogue.mjs`. The update run,
  `node scripts/explore-update.mjs`, marks what's on Explore and writes the next batch of 10
  that can be shown now (free Commons poster, checked by eye; rejected posters listed in the
  script) to `scripts/out/next-batch.json` for find-title-assets, measure-explore-covers and
  build-press-kits. 23 on Explore, ~280 wait for posters (TMDB licence). Not in Figma yet.
- (2026-10-31) Explore Feed (Ika), hidden for now (`features.exploreFeedShown` off: no tabs on
  Explore, `/explore/feed` goes to Explore; the code stays): `/explore/feed`, beside Library in Explore's tabs
  (`ExploreTabs`, gold underline), built from the approved prototype (the dev prototype is
  retired): top stories on the Carousel, a chip per topic that has stories, the ranked list and
  the open story (what it means for you, numbers, a date to act on, points, a table, Read on
  the source). Stories in `src/features/explore/feed.ts`, written in Nia's words, linked and
  never copied; Ika approves each one before it's added (Copilot drafts them later). Ranking:
  0.45 relevance + 0.35 impact + 0.2 source reliability, softened 30-day half-life; relevance is
  the story's reach, lifted halfway to 1 when it's about a production type in the reader's
  projects (read once in the browser). Four stories (Greenslate ×2, Deadline from its headline
  only, Breakthrough Ventures); Business Insider Africa's Laditan story waits until its facts
  can be read by hand (no placeholders: the test fails on them). No migration yet; a stories
  table comes when stories arrive weekly. Behind Explore's early access. Not in Figma yet.
- (2026-11-02) Audit (Ika: "delete and minimise non-essentials"): removed unused code (19 files:
  shadcn sidebar, item, kbd, toggle, toggle-group; old arc button, switch, expanding search and
  plan comparison; generate, open-tabs, the proposal-card stub, director's notes), the parked
  features (Marketplace, Explore Feed, Latest projects, Explore all quick view, onboarding Import
  profile and Follow creators) with their switches, styles, pictures and the Carousel and tilt
  card only they used, the date-fns package, the old project fields (director, writers, stars),
  Next's starter pictures and the timeline's "undated" chip. Old addresses redirect. Git tag
  `parked-2026-11-02` holds everything removed. Kept on purpose: interface sounds and the canvas
  ambience. The Marketplace and Feed database tables stay until a migration drops them.
- (2026-11-02) The Explore all timeline is a desktop view on paid plans (Ika): phones and tablets
  show "The timeline is on desktop" and no Canvas · Timeline switch; Free sees "The timeline
  comes with paid plans" with See plans (`TimelineLocked`). Paid checks share `hasPaidAccess()`
  (`src/lib/plan-server.ts`; a paid plan on any workspace they belong to; open to all off the
  live site), also used by Cast & Crew's View all.
- (2026-11-08) The Explore all timeline is open to everyone in the beta (Ika): the paid-plan
  check and its "comes with paid plans" note are gone; it stays a desktop view (phones and
  tablets keep "The timeline is on desktop"). Cast & Crew's View all still checks the plan.
- (2026-11-08) Desktop navbar, steps N1–N3 (Ika: "go ahead with navbar build", with the Claude
  Design boards N1 frosted and N3 dark as the reference; Figma reconcile still to do): a 4rem
  frosted bar (`glass-bar`, 80% instead of the design's 62%/55% for contrast over covers) that
  stays at the top, a soft blur under it once the page scrolls (`nav-edge`), tabs at 13px with
  icons, the search as a 38rem pill in the middle with a round +, the avatar alone on the right
  (no name, no chevron). `--nav-h`/`--nav-offset` carry the height to every full-height and
  sticky part. Phones and tablets unchanged. Back out: `pre-navbar-2026-11` tag.
- (2026-11-08) Explore covers from the official trailer's own cover image (Ika): where a title has no
  poster, its cover is the trailer's YouTube cover image when the poster crop is clean (no burned-in
  "CLASSIC TRAILER", Fandango or "OFFICIAL TRAILER" badges, logos or titles in it); the rest keep a
  frame chosen by eye (`CHOSEN` in scripts/trailer-stills.mjs, frame "cover"). Those covers stay
  poster-shaped in Recently added's mosaic. The ~280 studio-catalogue titles waiting on TMDB get the
  same treatment, title by title.
- (2026-11-08) Explore cards keep their picture's shape, like creators' films (Ika): a title with a
  poster stands tall; one shown by a trailer still or trailer cover image lies wide, uncropped
  (`titleCover` in made-in-africa.ts), in every row (cells widen by `--span`), Top 10, the canvas,
  the timeline and search. When a poster arrives it turns tall by itself. View all pages are
  masonry columns. Trailer cover images are used only where the whole image is clean (no burned-in
  "TRAILER", "HD", titles or logos); the rest show a frame chosen by eye.
- (2026-11-08) Recently added removed from Explore for now (Ika: "not working great"): the section,
  its View all page (`/explore/recent` redirects to Explore), the drifting columns and the mosaic
  are in git tag `parked-2026-11-08-recently-added`. Titles keep their `added` day for when it
  returns (and for telling people about new titles). Logged as a future build.
- (2026-11-09) Nia resizes its own pictures (Ika): Vercel's image allowance on the Hobby plan ran
  out on 2026-11-08 and every picture it hadn't resized before (new creator films, the timeline's
  posters, new uploads) came back "402". A custom next/image loader (`src/lib/image-loader.ts`)
  sends them to `src/app/api/img`, which resizes to the asked width as WebP and lets Vercel's
  network keep each answer for a year. It only fetches Nia's own files, public Supabase
  storage, YouTube thumbnails and Wikimedia Commons. Back to Vercel's resizer (e.g. on Pro): remove
  `loader`/`loaderFile` from next.config.ts.
- (2026-11-08) Explore's order (Ika): Explore all, then Top 10 on Explore, then Recently added
  (15 titles, the rest on View all at `/explore/recent`, newest first with the day each was
  added; `GALLERY_SIZE` in `recent.ts`), then By category. Top 10 left By category.
- (2026-11-08) Top 10 on Explore is laid out like the Top 10 press kits (Ika): one still row, 1 to
  10 left to right, arrows at the edges; each card at its film's shape with the rank top right
  (the cover on hover is gone).
- (2026-11-08) Creator films from YouTube (Ika's list): `platform: "youtube"` in `creators.ts`
  (code = the video id, `account` = the channel id, `channel` = its name). They play in YouTube's
  privacy-enhanced player (youtube-nocookie, on Play only), the page says "Plays from YouTube" and
  credits come from the video's description. Seven added (Maglera Doe Boy's Mzansi: The Movie,
  God Is Power and POVO; Leaders of the Wav's Drop Mic episodes 1, 2, 3 and 5). The embed checker
  skips them. Bugonia (Focus Features' trailer) is a studio feature, so it joins Explore as a title
  instead. 24 Instagram creator films added the same day; Strong Black Lead's A Different World
  clip held back (a streamer's clip, not creator content).
- (2026-11-08) Navbar decisions (NAVBAR_BUILD.md §3, Ika: "as recommended"): 1. N1, the frosted
  bar (the component keeps `variant: "bar" | "floating"`, only the bar ships). 2. Tab icons stay.
  3. One "Try" idea per page visit, no timer. 4. Colour, picture and voice search buttons left
  out until a step builds them. 5. ⌘K stays, its label goes, the field's tooltip says it.
  6. No name beside the avatar on desktop. 7. The existing search window, opening under the
  bar, its empty state led by "Try, for your work"; no second search. 8. The adjusted glass and
  text values in NAVBAR_SPEC §6 (80% glass, `foreground/80` tabs, dark text on the blue tint).
  9. Ika puts N1 (light, dark, search open) into Figma; node IDs go in NAVBAR_BUILD.md N0.
- (2026-11-10) Official posters during the private beta (Ika: "strictly in private beta, no
  revenue, no clients charged; give the full experience"): Explore uses TMDB's free,
  non-commercial API (`TMDB_API_KEY` in `.env.local`) for official posters, credited as before
  (`TmdbCredit`), every source in `cover-sources.json`. Before Nia charges anyone: the TMDB
  commercial licence, or swap the covers from that list. Never posters copied from unofficial
  sites. First run: 74 posters for the titles on trailer stills and the 11 hidden (Network,
  Jurassic Park, Martin, Monk…); Muhammad Ali: The People's Champ (TMDB has a book cover) and The
  College Dropout Video Anthology (none) keep their trailer stills. `find-title-assets.mjs`
  searches TMDB's TV shows for series and documentaries, and `--posters` fetches posters only.
  Cover looks: a title's black and white comes from its trailer palette (before 1968), or from
  trailer and poster agreeing (after): Casablanca, Citizen Kane and 27 other classics now read
  black and white; Network and Get Out stay colour.
- (2026-11-10) By studio picks studios by logo (Ika: "round profile pictures with the company/network
  logos", bigger, on a white plate): 80px round buttons, each studio's official logo from TMDB
  (`public/explore/studios/<id>.png`, sources in `studio-logos.json`) on `logo-plate` (white in
  light mode, `#f2f2f2` in dark), the chosen one ringed like an "on" chip; a line under the row
  names the studio, its owner when different, and how many titles are on Explore. A studio
  without a logo falls back to its word chip. Not in Figma yet.
- (2026-11-10, later) By studio moves out of By category to just under Top 10, with no show/hide
  heading (Ika): logos half as wide as a Top 10 card, each opening the studio's View all
  (`/explore/studio/[id]`: logo, name, owner, every title in masonry columns; "← Back to Explore").
  The in-place chips and title row are gone. `logo-ink` names a studio without a logo on its plate.
- (2026-11-10) Explore's tagger and the studio-catalogue batches (Ika: "add the rest", "automated
  AI tagging"; Claude Code does the tagging, no API cost). `scripts/suggest-tags.mts` drafts each
  new title from TMDB (genres, keywords, director, countries, IMDb id) through fixed rules into
  Nia's tag list only; the hand pass adds camera, light and how it was made; the tag test keeps
  15 to 20 per title. Collections stay the existing ones: Hollywood films to Modern classics,
  1960 to 1979 to New Hollywood, series to Drama and limited series or Sitcoms, films made
  outside Hollywood to Explore all. Batch 1 (25): Avatar, Squid Game, Gladiator, Parasite,
  Oppenheimer, Stranger Things… `explore-update.mjs` offers every catalogue title when the TMDB
  key is set. ICP groups (Ika): content creators, filmmakers, photographers, small production
  studios; Nia is "the production office".
- (2026-11-10) "New" comes back to Explore as a tag, not a section (Ika): on the Explore all
  canvas, anything added in the last seven days carries a small Nia Blue "New" tag, top left
  (`isNewOn`, from each title's and creator film's `added` day; today is read in the browser).
- (2026-11-10) Navbar N4, "Try" ideas (Ika: "build out the rest"): the desktop search field says
  Try “Call sheet”, one idea per page from the section's list, recent searches and (with Explore
  access) Explore's tags (`src/features/navbar/try-ideas.ts`, tested); no timer. The search
  window's suggestions lead with the same idea and the two projects worked on last. Explore
  access reaches the bar with the user menu (`ExploreAccessFlag`), so nothing new loads.
- (2026-11-10) Priorities (Ika): build the remaining templates and guided workflows first
  (Alvin's feedback, B3), "what will lead to greater value and retention". Explore titles ship
  2 to 3 at a time, each complete with its press kit, not in batches of 25 to 45. Batch 4 (60)
  was stopped before anything was added; 175 catalogue titles wait. Also asked the same day and
  not started: Explore as the landing page before sign-up (B1), search by colour and by type,
  five demo accounts (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`).
- (2026-11-10) Sign-in trouble, "Your connection isn't private": app.niatechnologies.co serves a
  valid certificate on every address. The bare niatechnologies.co is broken: GoDaddy DNS has
  three A records for it (two GoDaddy, one Vercel) and Vercel has no certificate for it. Ika to
  fix in Vercel → Domains and GoDaddy DNS.
- (2026-11-10) Onboarding shows only what's live (Ika: "remove any steps that are not yet
  active"): "What you can do on Nia" (it promised an AI assistant, timelines and storyboards) and
  "Invite team members" on the workspace step (emails were stored, never sent) are removed; git
  tag `parked-2026-11-10-onboarding`. Five screens, "Step N of 4"; the workspace step, saved or
  skipped, marks onboarding complete (`completeOnboarding`). Stored invites are left untouched.
- (2026-11-10) The rest of the templates, built by who they're for (Ika: "build the rest of the
  templates as planned, then 3 workflows for each ICP": content creators, filmmakers,
  photographers, small production studios). Each in-design template gets its sections and typed
  controls written as a definition (`scripts/templates/<set>.json`), brought live by
  `scripts/add-templates.mjs` (schema, manifest, help text), then READY and LAUNCHES. They use the
  editor's standard layout and the flat icon card, so no new design. Groups stay the four that
  exist. First set, photography: Photo Brief, Shot List (Photo), Usage License (plain-language,
  with "have a lawyer check" in its questions), Event Brief, Pull Sheet. Waiting: Contact Sheet,
  Storyboard, Casting Deck (picture storage); Lighting Plot, Set Drawing (drawings).
- (2026-11-10) Workflows, "Start from a goal" (Ika: three for each ICP, cards from existing
  components; FEEDBACK B3): twelve goals (`src/features/workflows/workflows.ts`, tested: working
  templates only, three to five documents, so the free plan's limit holds). Home and Templates
  show the person's own group first (from their profession), with chips for the other three. A
  card opens a dialog for the project's name; Create makes the project (its production type and
  description set) with a blank draft of each document, then opens it (`start.ts`, as the signed-in
  person, so database rules apply). Built from FilterChip, the card look with the hover sweep,
  and Dialog. The manifest's Editorial Shoot (T01) stays parked: "Shoot a fashion editorial"
  covers it. Not in Figma yet.
- (2026-11-10) Templates takes Explore's page layout (Ika: "more closely mimic the layout of
  Explore", same contents and functions): full width with Explore's gutters (`px-4 md:px-7.5`),
  the page title at `text-h2 font-semibold tracking-tight`, section headings at
  `text-subtitle font-semibold` (they were `text-display font-extrabold` and
  `text-lg font-extrabold` in a centred `max-w-7xl` column). The platform check found four title
  styles and three section-heading styles; Home, Projects, Settings, Activity and Plans still
  use their own, waiting for Ika's call on one standard.
- (2026-11-10) Home cut down (Ika: "there's too much on the home page now"): the greeting, the
  new-template card (once), Start from a goal, Recent projects and the latest five lines of
  Activity. Removed: Start from a template (the Templates tab and the goals cover it), Upcoming
  schedule (always empty until the schedule is built) and Quick actions (the + in the bar, the
  Templates tab, and files on each project). Git tag `parked-2026-11-10-home`. The new-template
  card no longer lists For you / For your team; that shows in the preview only.
- (2026-11-10) One heading standard, from Explore (Ika: "do a platform wide check" for
  inconsistent hierarchy and boldness): page titles `text-h2 font-semibold tracking-tight`,
  section headings `text-subtitle font-semibold`, applied to Home, Projects, Collections,
  Settings, Plans, Activity, Cast & crew, the project page, the share page and Explore's title
  pages (they were bold or extra-bold at four sizes). Written into CLAUDE.md's Design rules.
  Still different: side gutters (Explore and Templates `md:px-7.5`; Home, Projects and Settings
  `md:px-15`), and small card headings.
- (2026-11-10) From browsing to making (Ika: "direct users to actually creating projects as they
  explore, without disrupting browsing"): "Add to project" on every Explore title starts with a
  "New project" row; naming it creates the project (the title's kind of production) with the
  title as its first reference. The person stays on the page; the toast offers Open.
- (2026-11-10) Explore open to everyone signed in, no invite code for now (Ika: "remove the
  creativity2026 for all users for now, you can still leave the welcome page for first users"):
  `features.exploreUnlocked` is on; a first visit shows the ring-of-posters screen once as a
  welcome with one button, remembered on the account (`explore_welcomed`). The database side is
  `20261110000000_explore_open.sql` (has_explore_access() says yes to anyone signed in), for Ika
  to run: until then people without an invite can browse but not save titles or add them to
  projects. The invite list and codes are kept; switching the flag off restores the code screen.
- (2026-11-10) Few words (Ika: "creatives usually hate reading… it should never feel too much"):
  a section gets a title and no explaining line. Workflows is titled "Workflows" (not "Start from
  a goal" with a sentence) and its cards are big picture cards with the goal's name only, like
  Strategy & Development's. Removed: Home's "What would you like to create today?", the line
  under Suggested for you, "Hover a column to pause". Rule added to CLAUDE.md. The Editorial
  Shoot flow designed in October (the manifest's T01, hidden since only working templates show)
  is back as the photographers' "Editorial shoot" workflow: brief, pull sheet, shot list, crew
  contacts, call sheet.
- (2026-11-10) Workflows are off Home for now (Ika); they stay on the Templates page.
- (2026-11-10) By cast & crew on Explore, under By studio (Ika): round pictures (Commons photo or
  initials) of people credited on three or more things on Explore, most credits first, the top
  40 in one row (333 qualify today); each opens their person page. `featuredPeople()` in
  people-index.ts.
- (2026-11-10) Workflow covers move a little (Ika: "slightly animated… to imply they're workflows
  and not static templates"): a cover shows the workflow's documents as steps on a line, in
  order. The steps arrive one after another when the card appears; on hover or focus the line
  draws across and each step lifts in turn. No loops; reduced motion shows it still. Added to
  CLAUDE.md's list of what may animate.
- (2026-11-10, later) By cast & crew shows the first fifteen and "View all" (Ika: "different sized
  bubble-like approach"): `/explore/people` shows everyone credited on three or more things as
  round bubbles in five sizes by number of credits (3, 4, 5, 6 to 7, 8 or more), big and small
  mixed in a steady order, every third a little lower so it doesn't read as a grid. A bubble
  opens the person's page; the name shows on hover and to screen readers.
- (2026-11-11) Cast & crew View all is equal circles with name and role, most credits first (Ika: "the bubble feature is not great, just keep it as equal circles").
- (2026-11-11) Explore title pages lose the "Film · 2023 · 3 h · United States" line above the title (Details beside it says the same) and the press kit loses its "5 videos · 6 reviews · 2 articles" counts, in the section heading and the Top 10 preview (Ika: redundant, unnecessary).
- (2026-11-11) One look for buttons and View all (Ika: "view all buttons are inconsistent… some
  are pill shaped, some not"; platform check from Explore, then Templates and Home). Found five
  View all styles (outline pill, pill with a count, bold text, grey text with "→", grey
  underlined text) and buttons split between pills and small rounded rectangles. Now: `ViewAll`
  everywhere (Explore's categories, Made in Africa, Creators, cast & crew, a title's Cast & Crew,
  Home's projects and Activity, a project's cast & crew), and every `Button` size is a pill, every
  icon button a circle; joined button groups keep their shape. Rule in CLAUDE.md.
- (2026-11-11) By studio sorted for consistency, with more studios and independents (Ika: Netflix
  titles in Made in Africa weren't under Netflix; "add more studios including independent studios…
  a recently loved and requested feature"). A title is now under a studio when TMDB lists the
  studio among its production companies or networks, or its platform names it
  (`scripts/build-explore-studios.mjs` writes `title-studios.json`), as well as through the
  Wikidata catalogue. 45 studios in `studios.json` (was 12): the majors, plus Marvel, Lucasfilm,
  New Line, DreamWorks, Amblin, Miramax, United Artists, RKO, Working Title, StudioCanal and
  independents (Heyday, Syncopy, American Zoetrope, Element Pictures, Urucu Media, Gambit Films,
  Quizzical Pictures, Burnt Onion, Cinekap, Les Films du Bal, Beluga Tree, ARTE, Canal+,
  Showmax…). 231 of 312 titles sit under at least one; Netflix has 28. Logos from TMDB
  (`scripts/fetch-studio-logos.mjs`), each checked on the white plate. Studios with the most
  titles come first. A studio's page is a grid that fills from the left (masonry columns spread
  two posters apart).
- (2026-11-11) Ten per row, the rest behind View all (Ika: "as a general rule of thumb"):
  `ROW_MAX` in `src/lib/rows.ts`. By studio (new `/explore/studios` page), By cast & crew, Made
  in Africa, Creators, Hollywood Classics and Greatest TV (ten spread through their release
  order, so the row still reads as history) and Templates' Just added. Rule in CLAUDE.md.
- (2026-11-11) Cast & crew View all is grouped by role (Ika: "organize by sub-categories/role
  specifics"): Directors, Actors, Writers, Producers, Directors of photography, Editors, Music,
  Production designers, Costume designers, More roles; a chip narrows the page to one group.
- (2026-11-11) Search keeps up with the data (Ika: "every time we make changes to the platform's
  databases, improve the search functionality to consider those changes"). Global search now also
  finds Explore's 45 studios and 333 cast & crew (each opening its page), finds titles by their
  studio ("Netflix", "A24"), and finds the twelve workflows by goal, documents and group (opening
  the workflow's dialog on Templates, `?workflow=`). `features/explore/search-index.ts`, loaded
  when search first opens. Standing rule in CLAUDE.md.
- (2026-11-11) Primary buttons carry a soft Nia Blue halo (a 3px ring at 20% and a faint blue shadow, the ring at 35% on hover; none when disabled), so the main action on each screen stands out (Ika: "a light blue highlight on primary CTAs to improve actionability"). One change in `Button`'s default variant.
- (2026-11-11) Holiday classics, and seasons built into Explore (Ika: "a category for holiday
  specials/christmas classics… include 15… an example of how the platform should evolve with the
  context of the times, world events, major holidays, and should be built into the platform";
  "feel free to add animations like Polar Express"). New category with two collections, Christmas
  films (13) and Holiday specials (2): It's a Wonderful Life, Miracle on 34th Street, White
  Christmas, A Christmas Story, Home Alone, Home Alone 2, The Nightmare Before Christmas, Love
  Actually, Elf, The Polar Express, The Holiday, Klaus, Jingle Jangle; A Charlie Brown Christmas
  and How the Grinch Stole Christmas! (1966). Four already on Explore moved in. All 15 have press
  kits (checked: remake, sequel, stage-show and parody videos removed). A category can carry a
  `season` (MM-DD to MM-DD, `seasonOf`): in season it leads By category, out of season it isn't
  listed (its page still works). Holiday classics runs 1 November to 6 January. Other moments
  (Black History Month, Africa Day, Halloween, Heritage Day…) get a category with a season once
  Ika approves each. Search finds titles by their collection and category ("Christmas").
- (2026-11-11) No masonry anywhere (Ika: "ensure these gaps do not occur anywhere on the platform,
  very bad UX"): category View all pages, the creators gallery, a project's Files and photo grids
  are grids that fill row by row from the left. Rule in CLAUDE.md.
- (2026-11-11) Explore builds paused (Ika). 175 studio-catalogue titles wait; the ~110 titles from batches 1–3 still need press kits. Resume with those press kits first.
- (2026-11-11) Spaces (Ika: projects and templates "feel document-like, not an intuitive operating
  system"; the feature is called "Spaces"). First iteration designed in Claude Design, "Nia Spaces"
  (https://claude.ai/artifact/8ozwkrEkd8F6HogkAS7YGQ), six screens from existing components: Space
  overview (side menu, Next up, Needs you with one-tap fixes, phase steps, progress ring), Schedule
  (shoot days and looks as drag-to-reorder cards, calendar and call-time pickers, clash stopped
  before saving, Undo toast), Cast & crew (people picker from people you've worked with, role
  chips, one-tap status, radio-card rates, switches), Documents as outputs (call sheet filled from
  the Space, missing-item chips, section switches, send), Start a Space (goal as radio cards,
  calendar days, crew picked), On set on a phone (swipe to check in, shift all calls, Wrap). No
  node, mind-map or canvas workflows (Ika: too steep; for advanced versions later). Waiting for
  Ika's review before anything is built.
- (2026-11-11) Barbie (2023) added to Explore as a one-title exception to the pause, for Hermosa Marca's "The constraints of womanhood" brief (America Ferrera's monologue). Complete: poster, Warner Bros. trailer, tags, cast and crew, palette, studios (Warner Bros., Heyday), checked press kit.
- (2026-11-11) Hermosa Marca's "The constraints of womanhood" (Canva, 14 pages) set up as a
  project in test account 2 (`c23cd1bb-…`): a photo series in four chapters; a filled Photo Brief
  (concept, deliverables, quotes to clear, deck images as mood only) and Shot List (Photo) with the
  chapters and closing portrait as looks; Barbie added as a reference. Ika's two features from it
  are logged as BR1 (paste a brief, get a Space) and BR2 (Nia spots the reference) and designed as
  screens 7 and 8 on the Spaces canvas.
- (2026-11-11) More than one account on a device (Ika: "signing in or up with a new account, and
  switching between accounts, without destroying anything"). The profile menu lists the other
  accounts used here (one tap to switch) and "Add another account", which keeps the current one
  signed in and opens the login page as "Add an account" (sign-up works the same way). The login
  page offers "Continue" for each saved account. Accounts wait in this browser only, each with its
  refresh token kept current as Supabase rotates it (`src/lib/accounts.ts`); switching never signs
  anything out on the server. Log out now ends only this account on this device (it ended every
  device before). Tested with both test accounts: add, switch both ways, log out, continue.
- (2026-11-11, later) Accounts sit in one section of the profile menu, after Ika's reference: "Accounts", the signed-in account ticked, the others on this device (picture or initial) to switch to, then Add another account; not separate menu rows. Built into the menu component (`accounts` prop).
- (2026-11-11) Spaces, round 2 (Ika: "at least 15 iterations, then implement each micro UI element
  into what is currently Projects"): 16 more prototypes on the Spaces canvas (9–24), one
  interaction each, named after the existing component it uses: Space switcher, Space cards,
  phase in one tap, Needs you swipe/done/undo, edit in place with undo, shoot days on a calendar,
  call-time wheel and shift all, location radio cards with map, shots drag/multi-select/bulk bar,
  who's on the day (avatar multi-select), budget ring and steppers, references grid you reorder,
  versions and restore, do-it-from-search, first-run setup checklist, the Space on a phone.
  Proposed order into Projects (smallest change, most daily use first): 13 edit in place + undo,
  12 Needs you, 11 phase, 10 Space cards, 9 switcher, 23 setup checklist, 17 shots, 20 references
  grid, 21 versions, 22 search actions; 14, 15, 16, 18 and 19 wait for shoot days, locations and
  budget data (Milestone 4).
- (2026-11-11) Free plan: a project can be shared with up to 3 people (was 1; Ika). `FREE_LIMITS.collaboratorsPerProject`; the Plans page, the upgrade prompt and the share dialog follow it. Enforced in the app on the live site only, as before (no database rule for this limit).
- (2026-11-11) Share link permissions (Ika: "enable permissions on shared links (view, request to
  edit)"). With the link on, the owner picks what people with it can do: View, or View and ask to
  edit (two cards in Share project). On the shared page, "Ask to edit" (signed out: log in first,
  then back to the page) sends the owner a notification; the owner's Share project lists the
  requests with Let them edit / Decline. Approving adds them as Can edit (the free plan's 3-person
  limit applies) and tells them. Nothing changes until the owner approves. Database:
  `20261111000000_link_access_requests.sql` (its own tables, changed only through functions; Ika
  to run; run 2026-11-11).
- (2026-11-11, later) The shared page (Ika): Crew & talent as round profiles, as on the project
  page (`PersonTile`, not links for visitors); the project's Explore references as a row under it
  (Instagram links stay private); "Open project" in the top right corner replaces Ask to edit.
  With access it opens the project; signed out it logs in and comes back; otherwise it asks the
  owner, to view, or to edit when the link takes edit requests. After an approval the button opens
  the project when the tab comes back into view. Owners see "Asks to view / to edit" and Let them
  in / Let them edit. Headings follow the one standard.
- (2026-11-11, later) Reference stills on the shared page (Ika: "reference stills too, together with
  explore references"): a project's images tagged Reference join its Explore titles in one
  References row, newest first, ten at most (the count shows them all); each keeps its shape and
  opens full size. Only Reference stills; every other file stays private. The store isn't opened
  to visitors (that would let anyone list every shared project's stills): the database checks the
  link (`shared_project_reference_items`, `20261111010000_shared_reference_stills.sql`), then the
  server opens each still with an hour-long link using the secret key (`SUPABASE_SECRET_KEY`,
  `src/lib/supabase/admin.ts`). Without the migration or the key, the titles show alone.
- (2026-11-11, later) Comments (Ika, after YouTube's): on a project, under its cover and description
  (left column), for everyone on it, viewers included; under Explore titles and films, for anyone
  signed in. "Add a comment…" grows as you write (Cancel / Comment; Cmd+Enter sends); newest first;
  replies one level deep behind "N replies"; authors edit (marked "edited") and remove their own; a
  project's owner can remove any on it. Removed comments with replies stay as "Comment removed".
  The owner hears about new comments on their project, and people about replies to theirs. No likes
  or dislikes (Explore keeps no scores). Loads when the section nears the screen. Database:
  `20261112000000_comments.sql` (one `comments` table reached only through functions; a pause
  after 20 comments in 5 minutes). Run 2026-11-11. On Explore titles and films too, comments sit
  under the description (Ika). Home's new-templates card is gone (Ika, 2026-11-11; git tag
  parked-2026-11-11-new-templates-notice); new templates keep their tag on Templates.
- (2026-11-12) Project page layout: variation 2, "Cover hero with section tabs", from the project page
  board in Claude Design (Ika chose it; same contents, new layout). The cover runs across the page
  with the title on it (still editable) over type · stage · shoot dates; Adjust and Change cover
  stay in its corner. Under it, section links (Overview, Details, Crew & talent, Behind the
  Production, Comments, Files, References) stay below the top bar as you scroll, jump to their
  section (opening Details first when needed) and mark the one you're reading
  (`project-section-nav.tsx`). Everything else is where it was.
- (2026-11-12, later) Variation 2 built as drawn (Ika: "implement as is, build in features that don't
  yet exist"). The cover runs edge to edge under the top bar with Back to Projects, the title,
  type · stage · shoot dates, Edit details and Share project on it. Real tabs under it, each with
  its count and kept in the address (`?tab=comments`; arrow keys move between them;
  `project-tabs.tsx`): Overview (description, final assets, Notes, three reference stills with
  View all, and the details in a card, every value still editable), Crew & talent, Documents (the
  full list), References (Files & references, then Explore references and suggestions), Comments,
  Activity (recent activity, the project overview, Delete project for the owner). The Details |
  Manage switch is gone; its parts live in those tabs. Comment notifications open the Comments
  tab (`projectNoteHref`). Behind the Production's pills are gone (Documents has the full list).
- (2026-11-11) Product analytics: PostHog (`src/components/analytics.tsx`, in the root layout). It
  loads after the page shows, runs only when `NEXT_PUBLIC_POSTHOG_KEY` is set, records page views
  on route changes, and knows signed-in people by account id only (no name or email).
- (2026-11-12) Main buttons are Nia Blue (Ika: "Nia blue should be the background color of main
  CTAs (like View All, add to project, share etc)"). The default `Button` is filled `nia-blue`
  (white text in light mode, near-black in dark mode, both readable) with its soft halo; `ViewAll`,
  Add to project (Explore) and Share project (now a full-width button at the top of Project
  actions) use it. Outline, secondary and ghost buttons are unchanged.
- (2026-11-12) One page edge and the last off-standard titles (Ika, from the UI/UX audit, FEEDBACK UX7,
  UX10, UX11; she chose Explore's 30px over 60px): a theme token `--spacing-page` (1.875rem) gives
  `md:px-page`, used by every page, the navbar on tablets, and the bleed rows (`md:-mx-page`,
  `md:scroll-px-page`); Plans and Activity no longer sit in a centred column. Titles: the document
  header (Filming Notice and every template), person pages, Privacy ("Privacy policy"), check-email
  and onboarding moved to `text-h2 font-semibold tracking-tight`, and Explore, project and reference
  titles stay that size on phones. The project title is a real `<h1>` (`EditableText heading`):
  screen readers hear "Behind the Lens, edit title", where the old `display: contents` wrapper and
  the button's label gave "Edit title". `SegmentedControl` (Details/Manage, Plans' Monthly/Annual,
  project files) is a pill like every button. Left as they are: the Explore welcome card's big
  "Explore" (a splash, not a page title) and the timeline's full-screen canvas.
- (2026-11-12) Settings show only what works (Ika, FEEDBACK UX1: "Remove them"). General lost Email
  and Push notifications, Weekly digest, Default view, Language, Time zone, Auto-save interval and
  Version history; Profile lost the AI assistant card (name, traits, communication style, AI
  suggestions) and the Apple row under linked accounts (Apple sign-in is off in Supabase). None of
  them was read anywhere. General is now Workspace (name, its own Save), Appearance and Sound.
  The code is in git tag `parked-2026-11-12-settings`; the database columns (`user_settings`,
  `profiles.assistant_*`, `ai_suggestions`) stay, so each returns when it works: Time zone with the
  schedule, notifications with Inbox, the assistant with the Copilot.
- (2026-11-12) Project cover on computers (Ika: the cover hero blows up low-resolution covers; "keep a
  smaller thumbnail, similar to explore projects"): from 1024px the cover is a rounded 19:10 thumbnail
  the size of an Explore title's trailer, with type · stage · dates, the title, Edit details and Share
  project beside it; the Overview below uses Explore's column split. Phones and tablets keep the
  full-width cover until they get their own design (Ika: no phone or tablet changes while A/B testing).
- (2026-11-12) Buttons, one set (Ika: "fix ui button inconsistencies"): page actions 44px (the default),
  40px inside toolbars (Add person), 32px inside cards and on hover (Use template, now the standard
  button). Explore's Save, Add to project and outside links went from 40 to 44px to match the project
  page; Settings' Save and Profile's Connect lost their own sizes; Home's Recent projects View all sits
  beside the heading like every other. Read-only values drop the hover padding so Details lines up.
- (2026-11-12) Minimalism wins (Ika: "crucial"), first pass (FEEDBACK UX8, UX9): no explaining line
  under Cast & crew, Activity, Collections, Settings (per-tab subtitles gone), a template's editor,
  the empty Projects page, Log in or Create account; Plans says only "Paid plans open soon: pick one to
  save your place." Kept: lines people need (errors, check your email, reset password rules, Privacy's
  date, 404, the timeline's phone note, onboarding help) and Explore's curated category text. Names
  stored in Title Case show in sentence case through `sentenceCase` (stages, production types, genres,
  template groups, Explore types and badges; "Behind the production"). Template documents' own field
  labels ("Production Company") are document content, left for a templates pass.
- (2026-11-13) Templates cleaned up (Ika: "go ahead with templates clean up first", minimalism wins): the
  page is the title, search, category chips, Workflows, your drafts, then every template once, by
  category, all in the one list form (icon, name, phase, what it's for) that Production management
  already used. Gone: Just added, the large featured row and its arrows, Suggested for you (and its
  phone row), and the filmstrip and scrolling-column sections (whose looping columns showed
  templates twice); git tag `parked-2026-11-13-templates`. Desktop went from 210 controls and
  4,894px to 50 and 4,037px; phone from 5,956px to 4,573px. What's opened, used and searched is
  still recorded for New project and Add document. No "New" marker in the list (Ika: names stay
  whole; 28 of 37 were new); `launches.ts` keeps the dates and search results keep the marker.
- (2026-11-14) Templates: two categories as carousels (Ika: "change some of the templates sections to be
  carousels not lists, but with same information"). Strategy & development and UGC & social content are
  `ScrollRow` carousels of cards with the list's four facts (icon, name, phase, what it's for); a
  carousel shows `ROW_MAX` (ten) and View all opens the whole category as the list in place.
  Production management & operations stays a list (paperwork people find by name). Phone page
  4,573px to 3,539px.
- (2026-11-14) Template cards back to the earlier look in the carousels (Ika: "revert to the previous card
  design"): a large picture tile, then name, phase and what it's for, no border.
- (2026-11-15) Templates order (Ika: "move ugc templates and production management templates to above
  workflows … for production management, only display first 5-6 and rest in view all"): UGC & social
  content, then Production management & operations (first six, View all opens the rest in place),
  then Workflows, your drafts, Strategy & development and coming soon (`TOP_GROUPS`, `LIST_LIMIT`
  in `category-sections.tsx`).
- (2026-11-14) A/B: a right panel for previews on computers (Ika: "a/b test a right panel open for
  artifacts/documents/template preview", after Claude's artifacts panel). A template's preview docks
  on the right (`PreviewPanel`, width `--preview-panel-w`); the page leaves room for it
  (`in-data-[preview-panel=open]`), so the list stays in reach and another template swaps in.
  `features.previewPanel`; `?layout=popup` shows the old pop-up to compare. Phones and tablets
  keep the pop-up until they get their own design.
- (2026-11-14) A/B: the right panel on Projects too (Ika: "apply same to projects … including shoot day").
  On computers a project card opens `ProjectPanel` (`?project=…`, Back closes it): the cover at
  Explore-trailer size, type · stage, title, last edit, Open project (the one main action), the shoot
  first (`shootCountdown`: "In 6 days", "Shoot day 2 of 3", "Wrapped 4 days ago", with the dates),
  the description, then only the details that hold something. Previous / next and arrow keys step
  through the grid; Cmd-click still opens the page in a new tab. The panel frame is shared
  (`src/components/nia/side-panel.tsx`, `SidePanel` + `PrevNext`) by templates and projects.
  `?layout=popup`, phones and tablets go straight to the project page. Shared with you is unchanged.
- (2026-11-14) Template preview: only About this template shows; How to use and each question fold out,
  FAQ style (Ika). shadcn Accordion added (`src/components/ui/accordion.tsx`, no animation under
  reduced motion). Related templates stay visible as cards.
- (2026-11-14, later) Template preview, folded further (Ika: "about this template, description, tags,
  everything else under FAQ"): the title, Use this template and the picture lead; then the description,
  the tags and About this template show. What it does for you and your team, How to use, each question
  and Related templates are fold-out rows, all closed.
- (2026-11-14) Template tutorials slower, with a voice-over that starts off (Ika: "reduce speed of tutorial
  video to legible speed, add voice over using eleven labs (default sound off, but sound on/off icon")).
  Each scene is timed to its text (about 0.2s a word as it lights up, a step every 3.5s, then time to
  read; about 30s in all, was 14s) and stretches to fit its voice clip. Voices are made once by
  `scripts/make-tutorial-voices.mjs` (ElevenLabs "Sarah", the template's own words, three clips per
  template, in `public/tutorial-voice`, lengths in `tutorial/voices.json`); a speaker button appears
  only when a template has them, sound off by default, played beside the muted player in step with
  its frames. None made yet: the account is on ElevenLabs' free plan (no commercial use, 2,912
  characters left; all 37 need about 16,840).
- (2026-11-14) Workflow covers: the step icons are sized to the card (container units, up to 48px) so
  five steps always fit, beside the preview panel too.
- (2026-11-14) One blue button per screen (Ika: "only one main blue button per screen, and strictly on high
  value actions (for example vs code has one sign in button, blue, and the rest are grey"). Replaces
  2026-11-12's blue View all. Blue stays on: Share project (project page), Add person (Cast & crew), Use
  this template (preview), Save to project (template editor), Add to project (Explore title), Open
  project (project panel), Save (Settings). Grey now: View all everywhere, Email (crew profile), Use
  template on cards, and the Plans buttons until Ika picks one plan to feature. Checked page by page:
  no screen has more than one.
- (2026-11-14) Portfolios beta, slice 1 (Ika: "build portfolios beta without the prototype files, only allow
  access on test accounts so i can test it myself first"; PORTFOLIOS_BUILD.md, cut down). Access:
  `features.portfoliosBeta` and the emails in `PORTFOLIOS_BETA_EMAILS` (.env.local; add to Vercel for the
  live site), checked on the server; nobody else sees the tab or the pages. Data:
  `20261114000000_portfolios.sql` (portfolios, portfolio_projects; workspace members only), for Ika to
  run. Projects › Portfolios (Beta): New portfolio, then cards (a picture and a name). The editor:
  Sequence (projects with final assets, in order: up, down, remove, Add), Look (Grid, Rows or Slides;
  white or black; the cover from the work's pictures), Details (title, your name, the link, Unpublish,
  Delete); every change saves as made; Publish is the one blue button, Preview opens the page. The
  public page `/p/[slug]` (no Nia bar, not indexed): the cover fills the screen, then each project's
  final pictures and films whole (Grid: square cells with the piece fitted; Rows: full width; Slides:
  one at a time, arrow keys), a lightbox in Grid, "Made with NIA". Unpublished pages open only for the
  workspace, marked Preview; files are signed for an hour on the server, final assets of the
  portfolio's own projects only. Not in this slice: upload as you build, the welcome, framing the cover,
  more galleries, custom colours, client links, passcodes, favourites, tracking, link previews,
  Pixieset import and your page on Explore.
- (2026-11-14) Supabase egress (free plan, 5 GB a month) was used up: 5.09 GB, from about 94 MB of project
  pictures downloaded again on every visit (originals in grids, a fresh signed link each time, and many
  automated test runs). Ika stays on the free plan. Fixes: uploads make a smaller copy of each picture
  (1,600px, JPEG, `thumb_path`, made in the browser) used by Files, References, the viewer and Portfolios,
  originals only to download; private file links come from `src/lib/file-links.ts`, the same link for
  about 45 minutes so browsers reuse pictures (files read through the person's own rules, a share
  link's check or a published portfolio's first). `scripts/make-image-previews.mjs` makes copies for
  the 60 older pictures (about 94 MB of egress, once). Test runs block pictures from now on.
- (2026-11-14) Explore › Creators (and Collections) in justified rows: every card in a row the same height and
  as wide as its film's shape, each row filling the width, nothing cropped (a tall reel beside wide
  films had left big gaps in the 4-column grid). Creator films credited to a YouTube channel id show the
  channel's name instead ("@UCYod…" → "Leaders of the Wav"). Still to do: the Dior × A24 still has a
  light frame in the picture itself; it needs a new still (Explore data, paused).
- (2026-11-14) Tagging several files at once (Ika: "select a range or set as final assets"): in a project's
  Files, Select (editors) lets you tick files, Shift-click ticks every file between, Select all; a bar
  offers Set as final (its one blue button) and Tag as… for the rest; one update for all, with Undo.
  Portfolios' own email list (local) now includes Ika's account as well as the two test accounts.
- (2026-11-14) Portfolios, slice 2: the editor's steps are underlined tabs like the project page's (Ika: "use
  navbar style like the projects feature"; `src/components/nia/section-tabs.tsx`, with the Sequence
  count). Sequence gains New work (upload as you build, PORTFOLIOS_BUILD.md §1a): Files make one project
  (named after the portfolio unless named), a Folder makes one project per folder inside it; each is a
  Wrapped project with the uploads filed as final assets (small copies made), put on the page; plan
  limits apply as for any new project.
- (2026-11-15) Portfolios, slice 3: the look and sharing. Look gains any background colour (a picker beside
  White and Black) and framing the cover (`cover-framer.tsx`: a phone and a large screen side by side,
  drag or arrow keys to move the picture, Zoom 1 to 3, Reset; the public page and the link preview use
  it). Sequence gains Order on each project (`piece-order.tsx`: pieces earlier or later, saved on the
  files as `position`, so every portfolio shows the same order). Link previews (PORTFOLIOS_BUILD.md P8):
  `/p/[slug]/opengraph-image` draws the cover as framed with the title and name, and the page title is
  the portfolio's; anything unpublished gets the plain NIA card. Needs
  `20261115000000_portfolios_look.sql` (cover_frame, project_files.position); until it's run the pages
  work and framing and order stay at their defaults. The shared Slider takes `thumbLabel` so the handle
  has a name for screen readers.
- (2026-11-15) Cast & crew: quick add (Ika: "adding each crew member with full details each time may be
  time consuming and some of those details may not yet be confirmed … just add name, role, profile
  picture as a start and or add by @ / email for existing users and pre-filling information").
  Add people is one line: Who (name, @username or email) and Role. Suggestions as you type: people
  already in the workspace first, with their last role, then Nia accounts (`find_people`); picking
  a Nia account links it (`people.user_id`), so their photo and name come from their profile, and
  their profession fills the role. Everyone starts Pending; cast or crew and the department follow
  from the role. Paste a list (one per line, name and role, an email anywhere; no role is "TBC").
  The pop-up stays open for the next person. More details opens the full form with what was typed.
  Nobody is duplicated: an existing person is reused (picked, the same Nia account, the same email,
  or the one person in the workspace with exactly that name) and never overwritten; someone already
  on the project is named in a message. Photos: only a Nia account's own photo for now, initials
  otherwise (no uploading someone else's photo). Also fixed: "Editor" was filed under Camera &
  lighting (the DIT rule matched "e-dit-or"); DIT and set now match whole words.
  (`quick-add-people.tsx`, `quickAdd` in `mutations.ts`, `parsePeople` in `directory.ts`.)
- (2026-11-15) Shot lists start from pictures (Ika: "some teams may only have references for shot list, not
  elaborate camera angles and extra details … less overwhelming for beginners and experienced
  teams"). Both shot lists (D06 Shotlist, G16 Shot List (Photo)) get a Reference picture column
  next to Description. Add from pictures (the project's own, references first, or from the
  computer) or drop pictures on the table: each picture fills an empty row, then adds one. A picture
  is a project file tagged Reference (it shows in the project's Files); the cell keeps its id, and
  links come from the server's cached links (`picture-actions.ts`, the smaller copy). Pictures
  need the document to be in a project; until then the cell offers Save to project.
  More detail: table columns marked `detail` (Shotlist: I/E, Type, Angle, Move; Photo: Set-up /
  Look, Framing, Orientation, Light, Talent / Product, Priority) wait for the More detail pill in
  the toolbar. Their answers are kept when it's off; a blue dot says some are filled in. It's
  remembered per template on the device, and starts on for a document that already has detail
  answers. Downloads follow what's shown; the PDF draws the pictures in their cells, Word,
  Markdown and text say "Picture". (`pictures.tsx`, `more-detail.ts`, `shownColumns` in
  `sections.ts`, `export.ts`.)
- (2026-11-15) Shot lists as a carousel (Ika: "change shot list from table to carousel"). Both shot
  lists' tables have `layout: "carousel"`: each shot is a card in a row that scrolls (`ScrollRow`):
  "Shot 01", the reference picture large, Description, then the detail fields with More detail on
  and "Got it" (photo). The row ends with an Add shot tile, and the toolbar's Add row reads "Add
  shot". Every shot is in the row (a document, not a browse row, so no ten-item limit). Printing
  lays the cards out in rows; the PDF and other downloads stay a table.
- (2026-11-15) Reference cards, the general case (Ika: "portrait size cards (similar to what's on
  explore), with summary detail of the shot below, editable, and reorderable. Horizontal images
  stay full size with height of portrait image … the general case even for other templates that
  include adding reference like media assets"). Every table with a picture column now shows as
  cards (`card-row.tsx`), not only the shot lists. A card is 13rem wide at Explore's poster shape
  (268:373); a landscape picture keeps its own shape at the same height, so its card is wider
  (uncropped); on phones a card stops at 85% of the screen. Below the picture, Explore-style (no
  box): the number, then the row's fields to edit in place. Reorder by dragging the handle beside
  the number, or Move earlier / later (shown on hover and focus, always on touch screens); each
  move is its own Undo step. The add button names the item ("Add shot"; from the table's number
  column). The carousel's arrows can sit where a row asks (`ScrollRow arrowTop`), here at the
  middle of the pictures.
- (2026-11-15) The project's references as cards (Ika: "same with references section on overview").
  The Overview's References (the reference pictures) is now the template cards' row
  (`reference-cards.tsx`, sizes from `poster-cards.ts`): poster-shaped, a wider picture whole at the
  same height, its name and a note under each, drag or Move earlier / later (saved on
  `project_files.position`, as final assets are), ten with View all. The References tab's Explore
  titles and Instagram posts keep Explore's cards and get the same handle, Move and Remove, and a note
  (`project_references.position` and `note`). Drag and Move are shared (`drag-reorder.tsx`).
  Migration `20261118000000_project_references_arrange.sql`; notes and arranging stay hidden until
  their columns exist.
- (2026-11-15) Text formatting, step 1: the project page (Ika: "build text formatting features (ie bold,
  italics, bulleting, numbering, italicize, add link etc) wherever there's text inputs (excluding … date
  pickers and other non text input areas)"; she chose formatting that shows while typing, project page
  first). Long text only; names, titles, dates, numbers, emails and lists to paste stay plain. Tiptap
  3.32.2 (pinned) with its Markdown extension: bold, italic, bullet and numbered lists, links (web and
  email only), ⌘B / ⌘I / ⌘K, "- " and "1. " start lists. Stored as Markdown in the same columns, so
  earlier plain text reads the same and nothing migrates. The editor loads only when someone starts
  editing (`rich-text-editor.tsx`, next/dynamic); everywhere else the text is drawn by `rich-text.tsx`
  as React elements (never HTML from the text). Clean text (`plainText`) for link previews, search,
  cards and notifications. Done: a project's Description and Notes, the New project and Edit details
  forms, comments, the share page and the side panel. Next: templates (text sections, letters,
  downloads), then people, references and settings.
- (2026-11-15) Key milestones on a project (Ika: "add a key milestones tab under notes on projects, where
  users/teams can add key milestones/objectives and actions, with a date picker … for now i want to be
  able to just add action items from meetings, discussions etc"; later a fuller project management view
  with views, databases, Kanban and boards). A section under Notes on the Overview
  (`project-milestones.tsx`): one line to add an Action or a Milestone, its words and an optional date
  (Enter adds and keeps the line ready). Open items by date, overdue in red, milestones flagged; tick
  to fold under Done; edit words in place (Escape cancels) and change the date. Editors change them,
  viewers read (database rules too). Table `project_milestones` (kind, title, due_on, done_at,
  position), removed through `remove_project_milestone`;
  `20261119000000_project_milestones.sql`. Not in global search yet (its file has another session's
  edits open): add it there next.
- (2026-11-18) Meetings (docs/MEETINGS_SPEC.md): Google's own tools (Calendar, Meet, Gemini notes)
  rather than Granola, whose API only reads notes made in Granola's app and needs its Business plan.
  Meetings live under Documents → Meetings and open in the right panel like the template preview;
  notes from any notetaker can be uploaded or pasted. Step 1 is built from existing parts and
  reconciled into Figma afterwards; meetings are for project editors only (notes are often
  personal); everything is free in the beta; the "AI draft" marker becomes a Nia Blue tint chip
  (gold is banned). Not in Figma yet.
- (2026-11-18) Meetings move to Overview, under the Details card (were under Documents). Step 2
  (Claude's suggested changes) stays built but off: no `ANTHROPIC_API_KEY` while nothing is paid
  for; the Changes tab shows it as not yet.
- (2026-11-18) Genres: one list for the whole platform (`GENRE_GROUPS` in `src/lib/projects.ts`),
  61 genres in six groups (Film and TV; Documentary and factual; Brand and commercial; Fashion,
  beauty and lifestyle; Music and performance; Creator and social), from fashion films and branded
  content to studio genres; every earlier genre kept. Picked with one multi-select (search, the
  groups, up to 5) in Details and the new project form, not a wall of pills. Not in Figma yet.
- (2026-11-18) Covers settle in (Ika: more visual life in Explore, calm in the flow screens; VE1 in
  FEEDBACK.md). A cover waits 6% larger inside its frame and, once its picture is loaded and
  decoded, eases back (`SettleImage`, `cover-settle` / `cover-arrive` in globals.css); a picture
  that arrives after the page is ready also fades in. Explore's cards, galleries and Explore all use
  Explore's glide timing (600ms, `ease-glide`); project cards on Home and Projects the standard
  400ms ease-out. Explore all settles only the view you arrive at (tiles panned to after 2 seconds
  just appear). Once per picture, clipped by its frame, off under reduced motion. First version
  was jerky (Ika, 2026-11-19): covers already on screen jumped up before settling and the motion
  started before the picture could be drawn; fixed by waiting enlarged from the server, starting
  after `decode()`, and animating `transform` (measured: 60 frames a second, none dropped).
- (2026-11-19) Meetings step 3, Schedule a Google Meet (Ika: "go with step 3"; docs/MEETINGS_SPEC.md).
  Nia's own Google connection, separate from signing in with Google, asking for two permissions only
  (`calendar.events.owned`, `calendar.freebusy`) so Nia can't read anyone's other events. The refresh key
  is encrypted with `GOOGLE_TOKEN_KEY` and kept in `google_connections`, which only the server reads
  (`20261122000000_google_calendar.sql`, run). The meeting is saved before Google is asked, so the
  database's editors-only rule decides who can book; a failed booking removes it again. Who's busy is
  shown before booking ("Book anyway"), not reported after. Changes made later in Google Calendar aren't
  followed yet. Built from existing parts (dialog, date and time fields, multi-select, recipient
  input); not in Figma yet.
- (2026-11-18) Portfolios show only the workspace's own work (platform audit, PA1–PA3 in
  FEEDBACK.md; Ika: "go"). A project goes on a portfolio only if it's in the portfolio's workspace,
  and the cover comes only from that work; being shared on someone else's project (even as Can
  edit) isn't enough, since publishing makes it public. Enforced in the database
  (`20261123000000_portfolios_own_work.sql`) and again on the public page and its link preview
  (`src/features/portfolios/data.ts`), which also show only portfolios made by someone on
  `PORTFOLIOS_BETA_EMAILS` while Portfolios is in beta.
- (2026-11-19) Trailers play on hover in Explore's rows (VE2 in FEEDBACK.md; Ika: the poster opens
  into the wide trailer and the other covers move aside, with sound, one at a time). Resting on a
  poster ~450ms widens its cell to a 16:9 frame at the same height (`--span` animated, registered
  from code because the CSS build drops its `@property`); the trailer's still fades in, then
  YouTube's privacy-enhanced player, sized to the final frame from the start so it never resizes
  (Safari showed white gaps when it did). Sound: it starts muted (always allowed), then turns the
  sound on; if the browser pauses it for that (no click on the page yet, Safari), it goes back to
  muted and keeps playing. Moving to the next card hands over in 150ms: one shrinks as the other
  grows at the same pace, so the card under the pointer stays under it and the rest of the row
  stays still (measured: no frame off target); leaving waits 250ms, then the player fades and the
  frame closes. Near the right edge it grows to the left (the row scrolls along) and scrolls back on
  close. Native pointer listeners: React's leave event didn't arrive once the player was in the
  card. YouTube's Required Minimum Functionality: playback starts only once the player shows, one
  at a time, nothing drawn over it, at least 200 × 200 (about 615 × 346 on a desktop). Their
  rule against mouseovers applies to hovering their player; here the hover is on Nia's card before
  the player exists. Desktop pointers only, off under reduced motion and a data saver.
- (2026-11-19) Home: a "Get started with" row under the welcome (Ika, after Notion's row): New
  project, Meeting, Explore, Collection, Templates, as grey pills (one line to swipe on phones).
  Brings quick ways in back to Home after the 2026-11-10 cut, as one row, not a section. Meeting
  asks which project (only ones you can edit), then opens its Google Meet booking, or adding notes
  until Google Calendar is set up (`?schedule=1`, `?notes=1`). Not in Figma yet. Home's Recent
  projects drops the dashed New project tile (one way to do each thing) and shows five projects;
  the Projects page keeps it.
- (2026-11-19) Explore search (Ika: "search bar and filters linked to production detail tagging for
  easier searching, structure similar to templates search"; "consider the user feedback"). On the
  Explore page under Explore all: a search box with the top five as you type (Best match first,
  with the production details it matched), four filter menus (Look, Camera, Setting, Mood; the
  other tag groups are found by typing), and results in place of the rows (Best match, then Also
  relevant, in the film gallery), with Clear. Searches titles, who made them, their cast and crew
  (loaded from the server on first use, about 96 KB; Ika's "zendaya" found nothing before),
  studios, festivals, collection, type, year, country and every production tag; a tag or a
  person named in full is one match ("tom holland" is his films, not any Tom and any Holland);
  everyday words reach their tag ("35mm" is Shot on film). In the address (?q=, ?look=…), so Back
  undoes each step and searches can be shared. Each menu offers only what fits the search and the
  other choices (prevent dead ends). The person's taste (role, opens, saves) breaks ties (B6).
  Loads on first use. A tag under Production notes now opens these results across all of Explore
  (Alvin, FB7), so the View all pages' `?tag=` handling was removed. Files:
  `src/features/explore/search{,-data}.ts`, `src/components/explore/explore-search.tsx`.
- (2026-11-19) Hover trailers on every row of titles on Explore (Ika: "add same animation to other
  titles on explore home"): Top 10 and Creators as well as Best of 2026 and the categories, through
  one `TrailerCell` for any Explore item (`hoverVideoId` in items.ts: a title's main trailer, a
  press-kit film's official video, a creator's film on YouTube; Instagram films and portrait films
  don't play, the latter being narrower than YouTube's 200px). A landscape card plays at its own
  shape; a poster opens to 16:9. The Top 10 rank and the "Short film" label hide while it plays
  (nothing may cover YouTube's player). Sound (Ika: "why are the trailers not playing with sound"):
  browsers allow sound only after the person has clicked on the page; hovering never counts.
  Chrome then plays it with sound; Safari blocks sound in an embedded player unless the site is
  set to "Allow All Auto-Play" (Safari › Settings for This Website), so there it stays muted.
  The player is now asked to report back until it answers (it could miss the first request, so
  the sound was never turned on), and the captions YouTube adds to a muted start are removed once
  the sound is on.
- (2026-11-19) Security: Next.js 16.4.2 → 16.4.6 (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8:
  "use cache" results could leak across root params; moderate) with eslint-config-next to match,
  and `npm audit fix` without --force: shadcn's CLI moved to its newer MCP packages (body-parser's
  denial of service gone with express) and vitest 3.2.7. Still open, dev tools only: vitest/tinypool
  (critical, fixed only in vitest 4, a major upgrade) and five moderate ones. None are in the
  live site. 187 tests pass.
- (2026-11-19) The navbar's +: a small menu under the button (Blank project, From template, as grey
  pills like Get started with), not the full Create new project pop-up. From template opens
  Templates. Phones and tablets too. Other New project buttons keep the pop-up for now.
- (2026-11-19) Explore search finds names (Ika: "display crew/cast profile when searching their
  name"; "Best match … could be executed better"). People, studios and festivals are results in
  their own right (list as you type, a People row, Best match). Best match only when one stands
  out (name-search.ts `pickBest`): an exact title anywhere in the list, else a name that's the
  whole search with no equal, else a clear leader; otherwise none.
- (2026-11-19) Project page cover backdrop (VE3; Ika: "now the project page cover backdrop"): on
  computers, a soft wash of the cover behind the header, from under the frosted top bar to the
  tabs, fading out at the bottom (blur, 35% in light, 25% in dark). It uses the thumbnail's own
  picture and sizes, so the browser reuses it: no second download from Supabase. Phones and
  tablets keep their full-width cover. Built without a Figma frame; add to the Figma reconcile.
- (2026-11-19) Explore home differs on each visit (VE4; Ika: "randomize what's displayed on
  explore home on each load"): `pick` (src/lib/shuffle.ts) chooses each row's ten from the visit's
  seed (`seedFor` per row) and keeps them in the row's own order, so Best of 2026 shows ten of its
  hundred in rank order and the classics still read as history. By studio, By cast & crew (from
  everyone with three or more credits) and By festival show a different ten too. `spread`
  (rows.ts) is gone with it. Top 10 keeps its ranking.
- (2026-11-19) Best of 2026 becomes the year's top 100 (Ika: "top 100"): build-best-of-2026.mjs
  reads more of TMDB (six pages by popularity and by gross, four of critics' favourites) and keeps
  100. The 20 already on Explore stay live; 80 wait in `toAdd` for the full pipeline.
- (2026-11-19) Best of 2026, batch 4 of the top 100 (ranks 16–30 not yet on Explore): Ramayana:
  Rise of a Legend, Godzilla Minus Zero, 12 12 12, Insidious: Out of the Further, Hope, The End of
  Oak Street, Scary Movie, Marshals, Clayface, Wild Horse Nine; 30 of 100 live. YouTube refuses
  this Mac's command-line connections (youtube-nocookie.com answers), so trailers now come from
  TMDB's list of each title's official videos (`scripts/tmdb-trailers.mjs`, which also corrects an
  IMDb id when Wikipedia's search found another film: 12 12 12 had matched 12 Monkeys) and are
  checked through the privacy-enhanced player (`scripts/check-trailers.mjs`: embeddable, and the
  posting channel; an age-restricted one falls back to the next official trailer). Posters checked
  on a contact sheet (`scripts/contact-sheet.mjs`). Press kits: reviews from Wikipedia, corrected
  by hand (verdicts that didn't match the critic, sentences copied from another review, broken
  outlet names), and filled from edited publications where fewer than two; press videos wait for
  YouTube search to work again. Also: the "Awards and festivals" tag came from any recognition
  line, so box-office figures counted as awards; it now needs an award, prize or festival named.
- (2026-11-19) Best of 2026, batch 5: Supergirl, The Mandalorian and Grogu, Street Fighter, Coyote
  vs. Acme, Mortal Kombat II, You Can See Everything, Colony, Ebenezer, Nocturne, Wildwood; 40 of
  100 live. Press kits corrected by hand as before (box-office reports and a filmmakers' tribute
  taken out of reviews, verdicts matched to what each critic wrote); Supergirl and Nocturne filled
  from edited publications. You Can See Everything has no box-office line: TMDB's $91 million for
  a documentary looked unreliable. check-trailers.mjs now reads escaped characters in titles.
- (2026-11-19) Meeting notes, easier to act on (Ika: formatting of uploaded documents off, easier
  changes to meeting points, an easier way to send action items to milestones, start a new project
  when a meeting has none). PDFs are laid out again from where their text sits (`pdf-layout.ts`);
  headings are real sections ("### ", shown by rich-text.tsx, made by the editor's Section heading
  for meeting notes only). The summary is always open for typing (no click-to-edit) and saves a
  moment after typing stops. Action items are found without the AI (points under action headings)
  and sent to Key milestones in one go, or any point by its flag; same words are never added twice.
  Starting a project for a meeting lives in Home's Meeting picker (built by another session the same
  day), not a second way in from the + menu (one way to do each thing). A just-added meeting opens on
  its notes while suggestions are off.
- (2026-11-19) Best of 2026, batch 6: Masters of the Universe, The Drama, Lee Cronin's The Mummy,
  Forgotten Island, Scream 7, The Sheep Detectives, Send Help, Lanterns, Carrie, Jailer 2; 50 of
  100 live. Press kits corrected by hand (an opinion piece, streaming news, a soundtrack list and
  box-office reports taken out of reviews); The Mummy and Lanterns filled from edited
  publications. check-trailers.mjs reads quotes inside titles ("Wuthering Heights").
- (2026-11-19) Project Overview tidied (Ika): Details drops Looks and Agency (the data stays) and
  gets the production type, picked in place ("Type"); References run across the whole page under
  both columns instead of stopping halfway, with the linked references (Explore titles, Instagram
  posts) first and pictures filling the row to ten; Key milestones show the first five open ones,
  the rest behind "N more". The Looks field (NumberField) is gone with it.
