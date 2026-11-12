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
