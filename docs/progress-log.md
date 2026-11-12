# Progress log

Detailed notes on work outside BUILD_PLAN's steps and the weekly summaries for Ika (moved out of
CLAUDE.md on 2026-11-02). CLAUDE.md keeps the milestone checklist and what's next.

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
- [x] Third audit (2026-11-11). Each page's own compressed JavaScript, read from the build's
  manifests (what the page needs to open, not pages fetched in advance), before → after:
  Login 295, Home 402, Projects 394, project page 412, editor 444, Templates 414 (all flat or
  smaller since 2026-10-24); Explore 554 → 488 (was 389 in October), a title page 559 → 493,
  Explore all 526 → 461, Explore cast & crew 454 → 393, Studios 432 → 372. Fixed: pages no longer
  carry every title's press kit (173 kits, ~65 KB): title and film pages get their own from the
  server and the press-kit pop-up fetches its one when it opens (`loadPress`); pages that only link
  back to Explore no longer import its whole title list (`features/explore/paths.ts`, ~60 KB).
  Checked: global search's Explore list (studios, cast & crew) is 18 KB, loaded on first open.
  Left for later: Explore pages still carry the title list (59 KB) and tag data in the browser
  (moving title cards' data to the server is a bigger change); the editor's PDF preview (125 KB)
  and first-use tutorial player (106 KB) already load after the page; Home shares a 16 KB piece
  with Templates that holds the workflows list.

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

Week of 2026-10-26 (done; summary for Ika)
- Look: dark mode and a matching light mode (neutral greys, Nia Blue accent, follows the device),
  the card hover sweep, phones and tablets cleaned up (chips on one swipeable line).
- Sign-up: plain-language sign-in errors, a fresh confirmation when logging in unconfirmed, the
  beta walkthrough fixes (7 onboarding screens, "Welcome" for new accounts, no default genre).
- Search: tags, autocorrect and suggested searches; full screen on phones.
- Templates: 29 working (Production Budget, 13 creator templates, Script Breakdown and more),
  Just added, and a 14-second tutorial per template.
- Explore: Hollywood Classics (5 seed batches), stand-in covers from official trailers, By
  studio (312-title catalogue and the update run), Top 10 from what people open, save and add,
  sensitive-content screen, creator-film sourcing from Vimeo and YouTube for review, Cast &
  Crew on every title (Wikidata, Commons photos, one standard format, top 10 free, View all
  on paid plans) and a page per person.
- Projects: Cast & crew directory (Milestone 4, step 1): add, edit, confirm, remove.
- Tour: what's new since your last tour, most relevant to your kind of work first.
- Speed: Home 65 → 86 in Lighthouse (layout shift fixed), AVIF posters.
- Audit (2026-11-02): every deploy since 2026-11-01 09:44 (fab0372) failed on Vercel: one
  caption credit listed ~45 names on one line, so its "person" page address was too long to
  build. Fixed (each name its own person, addresses capped at 80 characters, tested); the
  production build now passes locally. Lesson: check the deploy after every push
  (`gh api repos/thefunctioncreativecompany/nia-os-web/commits/main/status`). Database: no
  errors; still open from last week: `20261107000000_security_function_access.sql` isn't run
  (anon can still call internal functions) and leaked password protection is off. 12 accounts
  (4 new this week), 2 feedback notes, 13 tracked jobs in 7 days. No known vulnerabilities in
  dependencies.
