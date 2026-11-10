# Nia master list

**Updated 2026-11-08.** The one place for what's shipped, what's open, feedback and future features.
Each item runs as its own fix, one at a time (below). Elsewhere, and kept there:

- Why each decision was made: [decisions.md](decisions.md).
- Milestone checklist and what's next: CLAUDE.md → Progress, and [BUILD_PLAN.md](../BUILD_PLAN.md).
- Step-by-step build guides: NAVBAR_BUILD.md, TEMPLATES_BUILD.md, TEMPLATE_ENGINE.md (the Explore timeline
  spec was pasted in chat on 2026-11-01 and isn't in the repo).
- Weekly notes and side projects: [progress-log.md](progress-log.md).

Status: ⬜ logged, not started · 🔍 being studied · 🔄 in progress · ✅ done · ⏸ waiting on Ika.

## How each fix runs

1. Restate the fix in plain English, say what changes and why, and list any SQL or dashboard step for Ika.
2. Design first where it's new (Claude Design, then Figma), then build from `src/components` and the theme.
3. Check: desktop and phone width, refresh, two test accounts where data is involved, no console errors.
4. Ika runs any SQL or Supabase dashboard step.
5. Commit, push, check the live site, update this list (and BUILD_PLAN.md if it maps to a step).

---

## 1. Logged 2026-11-08: Ika's update list and Alvin's feedback (not started)

Nothing here is built yet. "Today" is what exists in the app now. "Implications" is what it would
touch: the rules in CLAUDE.md, data and permissions, design, plans, and other items it depends on.
Size: S (a day or less), M (a few days), L (a week or more, or several steps).

### A. First-run value: who Nia is for, and getting to an outcome fast

| # | What | Source | Today | Implications | Size |
|---|------|--------|-------|--------------|------|
| B1 | **Explore as the front door.** Browse and study references before making an account; sign up only to save, study deeper or start a project | Ika; Alvin agreed | Signed-out visitors are sent to `/login`. Explore is early access only (`has_explore_access()`, invite codes) | Reverses two standing rules (Explore early-access only; bare domain routes by sign-in state), so it needs Ika's decision first. Public pages need: a signed-out Explore that reads no user data; what a visitor can and can't do (save, Cast & Crew View all, timeline); Explore's "link, never copy" and credits are already public-safe, but ~280 titles wait on the TMDB licence and the TMDB credit must show to visitors; search engines will index it (titles, people pages); rate limits on the still and image routes; Top 10 counts must ignore visitors. Then onboarding starts from what they were doing ("Save this to a project") | L |
| B2 | **Say who Nia is for, before sign-up.** A short intro of the vision and who it serves (filmmakers, photographers, creators, agencies, production teams) | Alvin | Sign-up hero is a slideshow of Ika's images; no line on who it's for | Copy first (plain, no slogans, "No catchy AI copy"). Could live on the sign-up hero, the share page and B1's front door. Pairs with B1 | S |
| B3 | **Guided workflows: start from a goal, not a template.** "Plan a photoshoot" → shoot brief, shot list, mood board, model release, delivery checklist; "Plan next week's content" → Day in My Life, Product Review, GRWM, Storytime, Tutorial; "Prepare for production" → budget, call sheet, crew list, equipment log | Ika (paraphrasing Alvin) | Templates stand alone; a project can hold documents; the Editorial Shoot workflow (Fix 13 / 3.1 launcher) is Ika's named priority but not built | This is the 3.1 launcher grown into a general "workflow" (a named bundle of templates plus a project). Needs: a workflow list per goal and role, which templates are missing or not yet working (model release, delivery checklist and shoot brief may not exist), one-tap "create project with these documents" (free-plan limit is 5 documents per project and one of each template: a workflow may hit it), Claude Design first. Strongest answer to Alvin's main point | L |
| B4 | **Example projects.** A few finished projects from start to finish (photoshoot, creator campaign, commercial, short film) to show what success looks like | Alvin; Ika | Explore shows finished films (by design, "Explore models finished projects"), not Nia projects | Needs real projects with permission (rule: imagery comes from the user's own work; pictures of people only with consent). Read-only, probably via the existing share-link page. Could double as B3's demo and B1's front door. Ask: who curates, and is there a bar for showing one (Alvin asked) | M |
| B5 | **"If you used Nia for the first time again"** answers: understand what success looks like quickly; personalisation; examples before sign-up | Alvin | n/a | Feeds B1–B4 and B6. Not a build item on its own | — |

### B. Personalisation by role

| # | What | Source | Today | Implications | Size |
|---|------|--------|-------|--------------|------|
| B6 | **The role chosen at onboarding should shape the app.** Alvin chose Photographer and Home promoted Production Budget, Script Breakdown and Series Bible | Alvin | Suggestions already weight the role (`recommend.ts`: +6 made for the role), but only templates that work in the editor are offered, and few photography ones work, so film ones fill the row. What's new is already weighted by group | Mostly a template gap, not a ranking bug: build the photographer's core templates (ties to B3). Also: what Home leads with per role (the template row, Explore picks, the empty-state copy). Rule from Ika: multidisciplinary people mustn't be boxed in (see B8) | M |
| B7 | **Filter templates by profession or creator type** (Photography, Film & TV, Content creation, Producing, Agency / client work) as well as by production phase | Alvin | Filters by phase and category; each template already lists the roles it's for (`icps`) | Small: a chip row in the existing filter bar (`filter-bar.tsx`, Marketplace look). Grouping names need Ika's OK (don't invent categories) | S |
| B8 | **Don't limit people to one role** (nonois.co): let them try everything and decide | Alvin; Ika | Onboarding asks one profession; Settings → AI assistant has "I work as…" | Let people pick several roles, or weight but never hide. Touches `profiles.profession` (one value today): a migration if it becomes a list | S–M |
| B9 | **Greeting uses the surname.** "Welcome, bukenya" instead of "Welcome, Alvin" | Alvin | The first word of the full name (`name.split(" ")[0]`); names written surname first, or a Google name in that order, greet by surname | Bug. Ask for "What should we call you?" (a first-name field, or check at onboarding's name step) instead of guessing. Small migration if it's a new column | S |
| B10 | Template library will need organising as it grows | Alvin | 63 templates; working ones lead each row | Covered by B7 and B3 | — |

### C. Projects: files, references, sharing and people

| # | What | Source | Today | Implications | Size |
|---|------|--------|-------|--------------|------|
| B11 | **Files section under each project**: one place to manage everything uploaded | Ika | Uploads, tags (Reference, Raw, WIP, Final asset, Brief), Archive, restore and delete live inside the project page (P3, P4, A8) | A project sub-page like Cast & crew (`/projects/[id]/files`): list or grid, filter by tag and kind, bulk select, rename, move, version (B16). Mostly reuses `project-files.tsx`. Design first | M |
| B12 | **Carousel view for references** | Ika | References show as a grid; the ring carousel (R1, Bencho) was planned but not built, and the prototype carousel was removed in the 2026-11-01 audit | Restore the Carousel from tag `parked-2026-11-02` or build R1 fresh; keyboard and reduced motion; animation is allowed only for listed cases, so a carousel needs Ika's OK as an exception or a no-loop design | S–M |
| B13 | **Share final assets only**, as a gallery, a PDF or a link to the project | Ika | The view-only link shows the whole project; files can be tagged Final asset, and final assets show under the description | A second kind of share link scoped to Final asset files (new token kind or an option on the link), a gallery page, a PDF export of the gallery, private storage served by signed links that expire. Watermark or download rules? Plan limits (Pro?) | M |
| B14 | **Permissions that fit real workflows.** Who sees and edits what (a photographer shouldn't edit the invoice) without being too strict for multidisciplinary people | Ika | Project roles are owner, Can edit, Can view (`editor`/`viewer`); anyone who can edit can edit every document | Biggest data change on this list: database rules (RLS) per document kind or per document, e.g. money documents (Invoice, Budget) owner and producer only; a role per person on the project (from Cast & crew departments?) and per-document overrides; request access. Needs a design of the few roles that matter, then a migration Ika runs, then tests with two accounts. Do before B15 and B17 | L |
| B15 | **Add cast and crew the quick way**: Nia username or email that fills in from their profile, plus a role; the longer form for more detail; people accept or decline being added | Ika | 4.1 People: add pop-up and edit drawer; someone with the same email in the workspace is reused; the people picker (`find_people`) exists in templates; linking a person to their Nia account is the open 4.1 to-do | Finishes 4.1. Accepting = a notification with Accept / Decline (like invites); until accepted, show only what they typed, never their Nia photo (consent rule). Ties to B14 (what an added person can see) | M |
| B16 | **Version history** for documents (and files) | Ika | Autosave; Undo/Redo only while the document is open | A versions table (snapshot on a pause or on close), a history panel with restore and compare; files keep old uploads. Storage and plan limits (versions kept on Free?) | M–L |
| B17 | **Live collaboration** | Ika | The project page updates live for others in 1–2 s; documents aren't edited together live | Real-time co-editing of documents: presence (who's here), live cursors, and merging edits without overwriting (a CRDT such as Yjs over Supabase Realtime, or a service). Must work with autosave and B16. Largest build on the list | L |
| B18 | **Import brand assets and context** (logos, colours, fonts, tone, past work) | Ika | None. D2 (Pro: your own logo on downloads) is waiting | A brand kit per workspace: storage, a settings page, used by downloads (D2), templates and later Copilot (Milestone 5: AI proposes, the producer decides). Plan gate (Pro) | M |

### D. Data and privacy

| # | What | Source | Today | Implications | Size |
|---|------|--------|-------|--------------|------|
| B19 | **Anonymous usage data, with a line at sign-up** and a way to opt out | Ika | No analytics service. Nia already stores some usage tied to accounts: `template_events` (opens, uses, searches), Explore views for Top 10 | The pasted clause names "T3 Code": it was copied from another product and must be rewritten for Nia. Decide the tool (Vercel Analytics is cookie-free and simplest; PostHog for product funnels) and what's collected; update the privacy page; an opt-out in Settings that's honoured on the server; never personal data in addresses or events; check POPIA and GDPR wording. Measuring time-to-value (B1–B3) needs this first | S–M |

### How these connect (study notes)

- **One theme runs through Alvin's feedback: show the outcome first.** B1 (Explore before sign-up), B3
  (workflows by goal), B4 (example projects) and B6 (role shapes Home) are four doors to the same room.
  B3 is the core: it gives B4 something to show, gives B6 something per role, and is already Ika's
  stated priority (Editorial Shoot).
- **Measure before and after.** B19 should come early so time-to-first-project can be compared once
  B1–B3 ship.
- **People and permissions come before collaboration.** B14 decides what B15 (adding people), B13
  (sharing) and B17 (live editing) are allowed to show. Building B17 first would mean redoing it.
- **Rules that would change:** B1 (Explore early-access only; signed-out routing), B12 (motion
  exceptions), B8 (one profession per person). Each needs Ika's dated decision in decisions.md.
- **Cheap, high-value first:** B9 (greeting bug), B7 (profession filter), B2 (who Nia is for).

---

## 2. Still open from before

| # | What | Status | Notes |
|---|------|--------|-------|
| 1 | Sign-up email: branded email, link that works on any device, 6-digit code | ⏸ | Last test sent no email: check junk, Resend → Emails, Supabase → Logs → Auth; then link and code on a phone; DMARC; remove old redirect URLs |
| 7 | Onboarding: "How will you use Nia?" | ⬜ | Draft in Claude Design first. Now overlaps B3 and B8 |
| L1 | Loading screen with a status bar | ⏸ | Waiting on a Claude Design draft |
| R1 | References as a ring carousel | ⬜ | Now B12 |
| W1 | Set up your workspace on Home (stepper) | ⬜ | Claude Design draft first |
| 10 / 13 | Template 01 opens the project launcher; Editorial Shoot workflow | ⬜ | Ika's priority. Now part of B3 |
| 11 / 12 | Project sections; two projects open at once | ⏸ | Claude Design first |
| 14 | Review the build history for missed fixes | ⬜ | This list is the first pass |
| C2 | Generate a project cover (paid AI) | ⏸ | Later; needs an image service key |
| D2 | Nia mark on downloads; Pro removes it or uses your logo | ⏸ | Ties to B18 |
| G1 / G2 | Google sign-in shows the Supabase address | ⏸ | Ika: Google Auth Platform branding; custom auth domain is a paid add-on |
| E1 | Explore title → "Start a project from this" (AI proposal) | ⬜ | Explore side is built; the proposal waits for Copilot (Milestone 5). Ties to B3 |
| 1.3 / 1.4 / 2.2–2.5 | Plan steps still open | ⬜ | See CLAUDE.md → Progress (Team Members, sort, Next shoot, Complete your profile, onboarding extras) |
| 4.1 | Cast & crew: link a person to their Nia account; Nia photos in the project row; people's own pages | 🔄 | Now B15 |
| 4.2+ | Locations, shoot days and the schedule; documents fill themselves; Shoot Day screen | ⬜ | Milestone 4 plan agreed 2026-11-01 |
| 6.3 | Settings: Notifications and the other tabs | ⬜ | Notifications draft exists in Claude Design |
| NAV | Desktop navbar N4 ("Try" ideas), N5 (gallery, fallbacks), N6 (full check); Figma frames | 🔄 | NAVBAR_BUILD.md. Built from Claude Design boards; Figma reconcile still to do |
| EX1 | Explore: notify people of new titles they'd like; let people suggest titles | ⏸ | Design rows A–E on the Claude Design canvas; Ika to pick before anything is built |
| EX2 | Explore: covers for the titles waiting (done 2026-11-10 with TMDB's free API during the private beta: 74 posters); the 289 studio-catalogue titles; weekly import | 🔄 | Commercial licence before Nia charges anyone; confirm "One on One" and Tyler Perry's "Love Thy Neighbor" |
| EX3 | Explore timeline steps E (colour band, filter) and F | ⬜ | From the timeline spec (pasted 2026-11-01; not in the repo) |
| OPS | Ika: run `20261107000000_security_function_access.sql`; leaked password protection; paste the two email templates into Supabase; Vercel CLI account and extra projects; delete old branches | ⏸ | From CLAUDE.md → Next week |
| BETA | Beta pilot: invite the three groups, move them to Pro by hand, read `feedback_review` weekly | ⏸ | Alvin's feedback is the first written review |

---

## 2b. Future builds on record

Gathered 2026-11-08 from every earlier list: CLAUDE.md's Future builds (now and 2026-10-21), the
2026-10-22 Future fixes, the "Nia OS: product state, October 2026" doc, the "Creative Director
Role Analysis" doc, the old prototypes' notes (`~/Downloads/Nia Technologies/Old prototypes`,
private: holds press contacts) and the Claude Design canvases. Built items are left out.

**Designed or partly built**
- Start from a brief (Home: type, attach or record; an "AI draft" project with sources; Apply /
  Modify / Dismiss). Designed; needs Copilot, transcription, a drafts table, a per-plan limit.
- One production profile + "Projects like this had": on branch `feature/core-features`, not merged.
- Explore new-for-you notifications and title suggestions: design rows A–E, waiting for a pick.
- Recently added, rethought: removed 2026-11-08, tag `parked-2026-11-08-recently-added`.
- Navbar N4–N6 and its Figma frames; Explore timeline steps E–F.
- Nia Learn (L0–L5 spec and screens on canvases).
- Link preview video: branch `link-preview-draft`, waiting for a direction.
- Marketplace: removed in the 2026-11-01 audit (tag `parked-2026-11-02`).
- Demo films for Coodie: Explore done; Projects and files, Cast & crew, Templates and call sheet,
  Share and collaborate, References and production details to make.

**Producing and running a shoot**
- Home that knows the phase (next shoot, today, double-booking warnings); Complete your profile
  (W1); shoot days, locations, schedule, documents that fill themselves; a project location field.
- Team Members; reference board (now B12); project cards' no-cover look, type chip, stage badge.
- Editorial Shoot launcher (part of B3); Storyboard and Casting Deck (picture storage); the 31
  undesigned templates; document toolbar in the pill style with downloads in one menu (check).

**From the Creative Director analysis (build order)**
1. Brief Builder + Inbox (email, WhatsApp, Slack into a structured brief, gaps flagged).
2. Production Room review and approvals (timestamped notes, client sign-off).
3. Pitch Builder (first deck from the brief). 4. Account home and Studio (load, review queue,
roster). 5. Radar (daily trend digest) and Wrap and Results (specs, rights, results, case study).
Open: client approvals inside Nia or by link; who pays; how much of a deck Nia writes.

**From the old prototypes**
- AI-filled production frameworks (most exist as templates; filling waits for Copilot); a crew
  roster with primary and secondary disciplines; Contacts and Events databases, events that
  start a brief; an archetype library (ties to Nia Learn).

**Data, launch and housekeeping**
- Explore in Supabase; TMDB weekly import; before launch (February 2027): TMDB licence, Meta
  oEmbed, JustWatch credit; the ~280 waiting titles (batches of about 25).
- Image resizing past Vercel's free allowance (Vercel Pro, or Nia's own resizer).
- Settings tabs and account deletion; privacy policy (B19); Figma reconcile; repository private?;
  Vercel CLI account and extra projects.
- Sounds on real speakers; phone dock tick on lift; a vertical creator film in normal Chrome;
  ElevenLabs commercial use before the demo films go out; delete the film test projects.

## 3. Shipped 2026-10-21 to 2026-11-08

**Explore**
- Made in Africa, Hollywood Classics (studio era, New Hollywood, modern classics, Black and POC
  leads), Greatest TV (sitcoms, drama series), By studio (312-title catalogue and the update run);
  creator films from Instagram, Vimeo and YouTube; 31 titles suggested by Mbali, Paballo and Ika.
- Every title: press kit (reviews, interviews, context), Cast & Crew (top 10 free, View all on paid
  plans), release date, palette, tags; trailer stills stand in for missing posters.
- Top 10 from what people open, save and use (now a numbered row like the press kits); Recently
  viewed; For you; Collections and Add to project. (Recently added was removed again on 2026-11-08.)
- Explore all as a canvas and a timeline (eras of film history; desktop only; open to everyone in the beta).
- An Explore all button bottom left on desktop; the pinwheel icon.

**Projects**
- Project details for production; Crew & talent, then the Cast & crew directory (add, edit, status,
  remove) as Milestone 4 step 1.
- Instagram links as references; final assets under the description; References from Explore and
  Inspiration for this project.

**Templates**
- Production Budget, Script Breakdown, Series Bible, Call Sheet – Detailed, Talent Roster Report,
  Content Production Guideline, Press Junket Brief and the 13 creator templates work in the editor.
- A mini tutorial in the preview and on first use; Just added row.

**Across the app**
- Dark and light mode (neutral greys, Nia Blue accent, follows the device); card hover sweep.
- Global search (tags, autocorrect, suggestions), the same on phones; filter rows that swipe on phones.
- Welcome tour and What's new since your last tour; pilot feedback (Send feedback).
- Back links return where you left off.
- Shorter onboarding; plain sign-up messages.
- Speed work (AVIF pictures, lighter pages); security headers.
- The 2026-11-01 audit removed parked features (Marketplace, Explore's Feed, the quick view, two onboarding screens,
  the Carousel; all kept in tag `parked-2026-11-02`).
- New desktop navbar (2026-11-08): frosted bar that stays at the top, search in the middle (N1–N3).

---

## 4. Archive

### The tracker as it stood on 2026-10-21

| # | Fix | Status | Notes |
|---|-----|--------|-------|
| 1 | Sign-up email: Nia-branded email, link that works on any device, plus a 6-digit code to type in (fixes "PKCE code verifier not found") | ⏸ | **Come back to this.** Done: Resend SMTP, branded templates, Site URL fixed to 9ahh. Open: last test sent no email — check junk, Resend → Emails, Supabase → Logs → Auth (rate limit? reused address?); then test link + code on phone; add DMARC; remove old nia-technologies redirect URLs |
| 2 | Favicon: Nia logo | ✅ | Logo saved in `design/brand/nia-logo.png` |
| 3 | Date picker on every date field, from the component library | ✅ | Project Production Info "Date" (the only date field today); new date fields must use `EditableDate` / `DateField` |
| 4 | Crop/adjust project cover and profile photo | ✅ | Shared `PhotoEditor` (round for photos, 19:10 for covers): new project, project page (Change cover + Adjust), Settings profile photo, onboarding |
| 5 | Shared links show the project cover as the preview image and the project title as the link title | ✅ | Projects without a cover show the NIA card (`public/brand/share-preview.png`) |
| 5b | New NIA wordmark as the main logo on the onboarding screens (and the share-link fallback image) | ✅ | `<Wordmark>` (`src/components/nia/wordmark.tsx`) on sign-in/onboarding heroes, share page and privacy page; originals in `design/brand/`. The round mark (`nia-mark-white-source.svg`) is saved, not used yet |
| 6 | Onboarding: profession list (scrollable, common roles first, then grouped by sector) | ✅ | Six common roles as tiles (incl. Production Assistant), then all roles by sector with a filter; names match the templates' roles so Suggested for you works from onboarding. Built without a Claude Design draft (Ika asked to go ahead) |
| 7 | Onboarding: "How will you use Nia?" primary use case step | ⬜ | Draft in Claude Design first |
| 8 | Collaborators end to end: invite by email or in-app (accept once), "Shared with you" on Projects, contributions, live updates and notifications | ✅ | "Shared with you" on Projects (uiarc cards, View opens the project); in-app invites. Notifications table + Home inbox (U1). Invitation emails: Resend (`RESEND_API_KEY` in `.env.local` and Vercel nia-os-web-9ahh, key "nia-os-web-app"), sign-up email's design, "Open project" or "Join Nia", replies go to the owner (`src/lib/project-invite.ts`); sending checked live. Live project page (`project-live.tsx`, migration `20261023000000_projects_realtime.sql`): changes by others show in ~1–2s, a field being typed in keeps its text; tested with two accounts |
| 5c | Black wordmark above the form on phones (sign-in and onboarding) | ✅ | |
| L1 | Loading screen template for the whole platform, with a loading status bar (reference: Ika's "Installation Complete" screenshot, 2026-10-19) | ⏸ | Ika's choices: full screen on arrival (after sign-in / sign-up / onboarding) and for longer jobs (creating a project, later exports); moving between pages inside the app shows only a thin bar under the navbar plus the grey placeholders. Status bar only, no spinner. Waiting on a Claude Design draft, then Figma, then build (`LoadingScreen` + top bar in `src/components/nia`, in the component library). Bar fills smoothly and stops under reduced motion |
| T | Templates rebuild from `TEMPLATES_BUILD.md` (63 templates, flat black and white, Showcase / Compact / Index, search, preview pop-up, Suggested for you, template engine, Editorial Shoot workflow). Runs before Fix 6, one build step at a time | 🔄 | Steps 1–3 done: data; gallery with "Templates" title, "Search 63 templates" box (search on Enter, best match + also relevant), filter chips incl. Administrative and Camera & Visual, Showcase / Compact / Index, flat black line icons (Lucide). Step 4 done: suggestions while typing (top 5, Best match, matched words, See all results, arrow keys / Enter / Escape). Step 5 done: preview pop-up (click or 0.8s mouse hover, ← → and Esc, expand, `?preview=` link so Back closes it and links share, related templates, full screen on phones). Step 6 done: Suggested for you (uiarc cards, reason on each, I work as…, Reset what Nia learned; views / uses / searches saved to `template_events`). Step 7 (engine, TEMPLATE_ENGINE.md §8) part 1 done: `src/features/templates/engine/` (fields, text, letter; Undo/Redo; autosave to `documents`, created on first edit, `?doc=` reopens), `/templates/[code]`, Filming Notice from Figma 840:29449; toolbar shows only working actions; Download PDF (print) split button with Word / Markdown / .txt (uiarc split-button, Ika 2026-10-19); no Save button until step 8. Next: engine part 2, tables. Replaces 9, 10 and 10b below |
| T1 | Templates page: heading "Start from a proven path" becomes "Templates"; remove the "New template" label on cards | ✅ | Done with build step 2 |
| U1 | Home: updates, notifications and inbox as swipe rows (uiarc `swipe-actions`: swipe to archive / mark read, full swipe commits) | ✅ | `src/components/home/updates.tsx`, live via Realtime; migration run. Checked desktop + 375px: arrives without refresh, tap marks read, menu and full swipe archive, all kept after refresh (fixed: mark/archive weren't being sent to Supabase) |
| U2 | Profile menu behind the avatar (uiarc `user-menu`): name, email, Settings, Log out; bottom sheet on phones | ✅ | Profile, Settings, Log out (Nia's wording kept); theme switch hidden (no dark mode yet) |
| U3 | Navbar search as uiarc `expanding-search`: icon that grows into a field, recent projects first, matches as you type; full-width on phones | ✅ | `src/components/nia/nav-search.tsx`. uiarc names map to Nia tokens in `globals.css`, motion in `src/components/arc/motion-tokens.ts`; `next.config.ts` keeps CSS modules out of the Tailwind loader |
| U4 | Active navbar tab pill fits its label ("Templates" was squeezed into a fixed 100px) | ✅ | On phones the active tab is its icon on the gold pill so all five tabs fit |
| R1 | References on a project: starts with an empty "add" card; upload images and videos; shown as a ring carousel (drag or swipe round, arrow keys, gentle press on hover); open any one full page to view or play | ⬜ | Part of Fix 11 (project sections). Carousel code supplied (Bencho lab ring); pictures come from the project's own uploads, never sample art. Needs storage for project files (BUILD_PLAN 3.2 `project_files`) |
| W1 | Set up your workspace on Home for new accounts: a step-by-step checklist (uiarc `stepper`) that remembers what was already filled in at sign-up and onboarding (name, username, photo, profession, workspace) and only asks for the rest | ⬜ | Stepper code supplied; steps to agree with Ika (Claude Design draft first) |
| C1 | uiarc `card` for "Suggested for you" under the main Templates cards, and for a new "Shared with you" row of projects others shared with me; "View" opens the full project | ✅ | Suggested for you (step 6) and Shared with you (Fix 8) |
| U5 | Phone and tablet navigation as Bencho's magnifying dock (MIT): glass bar fixed at the bottom with Home, Projects, Templates, Explore and Inbox (coming soon), magnifies under the finger or pointer, one travelling label; the NIA wordmark takes the tabs' place in the top bar | ✅ | `src/components/nia/magnifying-dock.tsx`, styles in `globals.css` (Bencho's names mapped to Nia tokens on the dock itself; Nia timings, no overshoot) |
| U6 | Phones and tablets: the NIA wordmark in the top bar becomes a borderless + that starts a new project (the bordered + stays on desktop) | ✅ | |
| T2 | Templates Index view: section titles (Workflows, Production Management & Operations, …, Coming soon) and template names instead of product codes | ✅ | Two per row on phones |
| H2 | Home: template cards use the same design as "Suggested for you" on Templates (uiarc cards) | ✅ | Ika, 2026-10-19. Stage under the name; Preview opens the template's preview |
| H3 | Home: Updates merge with Recent Activity into one list | ✅ | "Activity" (`src/components/home/activity-feed.tsx`): notifications (gold dot, swipe to mark read / archive) and project activity, newest first, live; a change that sent a notification shows once. Tested with two accounts |
| T5 | Templates: real controls instead of text boxes (date pickers, time, duration, number steppers, money, yes/no, choices, tags, people); values saved in a standard format for later autofill from voice memos and documents | 🔄 | Ika, 2026-10-19. Filming Notice done (v1.1): fields are `{ label, kind }` in template-schemas.json (choice, dateTimeRange, yesNo, phone, email; `engine/field-controls.tsx`, `engine/format.ts`), Title and Type split, the letter's [placeholders] fill from the answers. Tables done (step 7 part 2, `engine/table-view.tsx`): Crew Contact List, Shotlist, Equipment Rental Log, Continuity Log, Shot Logging Sheet, 3-Column AV Script, each column typed (role search, pick-lists, number steppers, dates where Date in can't precede Date out, durations as amount + unit, Use tick); phones get a card per row; tables in Markdown/Word/.txt. People fields done: `src/components/nia/assignees.tsx` (Bencho Assignees, adapted): type a name, @username or email, Nia profiles pop up (`find_people`: @username any user, exact email only, names only among collaborators), picking fills name/photo/role (Crew list Position ← role); people not on Nia added as typed. Used for Filming Notice Location Manager and Crew Contact List Name; Director/Writers/Stars on the project page come with P1. Duration is an amount + minutes/hours/days (seconds/minutes for clip lengths). Invoice done (step 7 part 3): money fields, Extended = Rate × QTY and Total Due work themselves out (can't be typed over), Currency choice (USD, EUR, GBP, ZAR, CAD, AUD) formats every amount, Terms pick-list, Prepared by is a people field, Mark paid stamps it and saves status `paid`; Add Tax waits (no tax field yet). Call Sheet done (step 7 part 4, v2.5): times from the time wheel, Director/Producer/Exec. Producer/1st AD and Cast are people fields, Sunrise / Sunset pair, Weather as condition pills + high temperature (°F/°C), Locations as cards, schedule Pages in eighths with a Total pages row, D/N pick-list, Cast ticks rows of Cast & Talent Calls (shown 01, 03), Location picks from the Locations answers. Send to Crew waits for Cast & Crew. Next: Editorial Shoot workflow (Ika's priority) |
| P1 | Project page from Figma 824:23124: cover, title, description left; Details / Manage tabs right; stacked on phones/tablets | ✅ | Ika, 2026-10-19. Details: Date, Duration (amount + minutes/hours/days), Director/Writers/Stars (people picker; names stored as text until Cast & Crew), Genres (pills, several), Behind the Production (document pills + Add document). Stills row removed (Ika: redundant with Files & references). Manage: actions, overview, documents (remove/delete), activity. Files & references full width below |
| S1 | Projects: "Shared with you" also lists projects opened through a view-only link (as well as email and in-app shares) | ✅ | Ika, 2026-10-19. Marked "Via link · shared by …", View opens the link; drops off when the link is turned off. Migration `20261026020000_link_shared_projects.sql` (run) |
| E1 | Explore: real films and series (e.g. Sinners) broken into assets (synopsis, credits, budget estimate, script link); "Start a project from this" as an AI proposal; poster row on Projects/Templates links in (Figma 824:23053) | ⬜ | Ika, 2026-10-19. Wikidata/Wikipedia first; no IMDb scraping; posters need a licence. Set up step by step with Ika |
| C2 | Generate a project cover from the project's description (wide, exactly the cover's 19:10), shown forming with Bencho's Generate; an AI draft you Apply | ⏸ | Ika, 2026-10-19: later, it costs money per picture. Ready: `src/components/nia/generate.tsx` (+ "Generate" in globals.css, FLOWER still a stub). Needs an image service (fal.ai FLUX makes exact 1520×800) and its key |
| H4 | Home "Start from a template": horizontal cards the width of the project cards (icon, name, stage under it); hover or tap previews on Home and closing stays on Home, only "Use this template" leaves; ordered by recently viewed, then Suggested for you | ✅ | Ika, 2026-10-19. `src/components/home/home-templates.tsx` (replaces H2's cards) |
| T6 | Templates that don't open in the editor yet are greyed out ("Coming soon", Use disabled, still previewable); working ones lead each row; suggestions (Suggested for you, phones' row, Home) offer only working templates, most recently viewed or used first | ✅ | Ika, 2026-10-19. `ready` on each gallery template (server), `works()` and `workingSuggestions()` |
| T7 | "Use this template" did nothing after opening a preview by clicking a card (closing the preview stepped Back after the trip to the editor); "+ → From Template" was switched off | ✅ | Ika, 2026-10-19. Use now replaces the preview in the history; From Template lists the working templates (recent first) and opens the chosen one. Filing it under the project comes with step 8 |
| P2 | Save templates to projects (build step 8): "Save to project" in the editor (pick a project you can edit or name a new one), Saved to / Open project / Move / Remove from project; Back returns to the project; project page Documents list with Add document (opens a template saved straight into the project) and remove | ✅ | Ika, 2026-10-19. Migration `20261025000000_documents_project_check.sql` (a document can only go into a project you can edit) |
| P3 | Upload files to a project and organise them: drag or choose, 50 MB each, private storage, progress per file (Bencho dropzone), sorted into References (stills, mood-board grid + viewer), Documents, Audio (player), Video; download and remove; live for everyone on the project. Reading files to autofill is parked (paid AI) | ✅ | Ika, 2026-10-19. Migrations `20261025010000_project_files.sql`, `20261025020000_project_files_remove.sql`. Tested with two accounts incl. outsiders refused |
| P4 | File tags (Reference, Raw file, Work in progress, Final asset, Brief & paperwork): tabs by tag, "Tag new files as" (Automatic by kind, or a set tag), change a file's tag from its menu; PDFs show their first page as the cover (pdf.js, at upload); Add document first asks: upload from your computer, or start from a template | ✅ | Ika, 2026-10-19. Migration `20261025030000_project_files_tags.sql`. Word/other documents show their file icon (no first-page picture yet) |
| A1 | Audit 2026-10-19 #1: `pilot_clients` (11 contacts, readable by any signed-in account) removed | ✅ | Ika ran `20261026000000_remove_pilot_clients.sql` |
| A2 | Audit #2: view-only people get a read-only document (controls locked but readable, "You can view this document", no Undo/Add row/Move/Remove) | ✅ | Ika, 2026-10-19 |
| A3 | Audit #3: Your drafts on Templates (documents not in a project), Delete document in the editor and on the project's list (maker or project owner) | ✅ | Ika, 2026-10-19 |
| A8 | Free-plan document rules (one of each template, 5 per project) and the file Archive (restore, delete for good) | ✅ | Migration run by Ika; tested: database refuses a second Call Sheet / sixth document / moving one in; screens show 5 of 5, Already in this project, Already has an Invoice; Archive, Undo, Restore, Delete for good (stored file removed) |
| A4 | Audit #4: branded "We couldn't find that" pages (inside the app with the navbar, and outside), with a way back. The status stays 200 once a page has started streaming; Next.js marks it noindex (documented behaviour) | ✅ | |
| A5 | Audit #5: the project title is the page's main heading | ✅ | |
| A6 | Audit #6: Home Browse templates works; Import files (pick a project, drop files); onboarding done says Go to Home / Explore templates; project's Export row became Download documents | ✅ | |
| A9 | Audit #9: Activity records documents added/removed/deleted and uploads ("uploaded 3 files to …", one line per person per 10 min); collaborators get Home updates for them | ✅ | Migration `20261026010000_activity_documents_files.sql` (run) |
| A12 | Audit #12: New project form takes files (optional): briefs, scripts, stills, voice memos; they upload into the project once it's created, tagged automatically, PDFs with their first-page cover | ✅ | Ika's earlier request (upload under new project setup) |
| A14 | Audit #14: navbar search finds projects, documents (yours and those in projects you can open, "In …" or "Draft") and every live template (working ones open the editor, the rest their preview). People come with Cast & Crew | ✅ | |
| A15 | Audit #15: BUILD_PLAN ticked where finished (2.1, 3.4, 3.7); what keeps the others open is listed in CLAUDE.md Progress | ✅ | |
| H1 | Home: the template row links to the real templates (opens each one's preview on the Templates page) | ✅ | Names and icons come from the manifest; "Coming soon" tag removed |
| U7 | Phones and tablets: search is a field filling the top bar; the + is a round button; both with a silver gradient rim on a white fill (`glass-silver`) | ✅ | Desktop unchanged |
| T3 | Templates on phones (after Apple Music): suggested templates as smaller large cards with the next peeking in; every template by category as rows of square gradient cards (› shows the whole category); same category rows on desktop | ✅ | Gradients sampled from grainient.supply freebies (commercial use allowed) and rebuilt as CSS tokens `--grain-1…12` with a grain overlay; no image files shipped |
| T4 | Compact and Index views retired from the Templates page | ✅ | Kept in the component library, section 31 |
| G1 | Google sign-in says "continue to nvgmkyvowtmdjwnfucsn.supabase.co"; should say "Nia Operating System" | ⏸ | Ika: Google Auth Platform → Branding (app name, logo, home page, privacy page) and brand verification. Showing the name instead of the Supabase address also needs Google to see a domain you own, i.e. a Supabase custom domain (paid add-on), e.g. `auth.niatechnologies.co` |
| 9 | Templates gallery: search with suggestions + results view | ✅ | Build step 4 of T |
| 10 | Template 01 opens the project launcher | ⬜ | Now build step 8 of T |
| 10b | Template detail pop-up (like Storyflow's) | ✅ | Build step 5 of T |
| 11 | Project sections (add/edit/delete), incl. References with a gallery view | ⏸ | BUILD_PLAN 3.2; Claude Design first |
| 12 | Project tabs (two projects open at once) | ⏸ | BUILD_PLAN 3.3; Claude Design first |
| 13 | Editorial Shoot workflow (map + steps) with collaboration | ⬜ | After 10 and 11 |
| 14 | Review the build history for missed features/fixes and schedule them | ⬜ | Fixed 2026-10-21: switched-off share link (now says "This link is off"; status stays 200 because the page streams), calendar range band. Still: plan boxes 1.3–2.5 need final checks; test scripts to move into the repo |
| G2 | Find which Google account owns the Google sign-in setup (needed for G1) | ⏸ | Supabase → Authentication → Sign In / Providers → Google shows the Client ID (ends in `.apps.googleusercontent.com`). Sign in to console.cloud.google.com with each Google account you use → APIs & Services → Credentials, and look for that Client ID. The account that has it owns the setup |
| F1 | Fonts: only the app's own font (Geist) everywhere — no serif (Instrument Serif italic) and no all-caps monospace labels; sentence case instead | ✅ | Done across the app and CLAUDE.md. Kept for Ika to decide: the screenplay preview's Courier capitals (industry format, content not labels); component-library sample pages unchanged |
| M1 | Phones: Home slid sideways (long Activity lines widened the page); document panel with a long project name; Call Sheet preview chips; stills' Download / Archive needed hover (now in the picture viewer on phones); "Shot #" header; Home template row scrollbar removed | ✅ | Checked at 320, 375 and 768 across Home, Projects, a project (Details, Manage, Add document), New project, template previews, every working template and a saved document |
| D1 | Download PDF saves a real PDF straight away instead of opening the print screen (Ika's feedback) | ✅ | Built in the browser from the same data as Word (`toPdf` in `engine/export.ts`, jsPDF 4.2.1 + autotable, Geist from `public/fonts`), US Letter, "Generated by Nia" and page numbers on every page. Print stays in the toolbar |
| D2 | Nia branding on downloaded files; Pro removes it or replaces it with the user's own logo (Ika's idea) | ⏸ | Free downloads already carry "Generated by Nia · version" (PDF, Word, Markdown, .txt). Next: the Nia mark in the PDF footer (Claude Design), then the Pro plan gate (not built yet) for remove / own logo |
| E2 | Explore "Coming soon" screen from Ika's Claude Design (ExploreSoon): ring of stills around a frosted panel, Notify me | 🔄 | Built at `/explore` (Explore tab and dock icon now open it). Adapted: Geist, "Coming soon" in sentence case, still gold dot (no pulse), ring turns only with the pointer or a finger (no loop), Ika's sign-in stills. Notify me saves to `feature_waitlist`: **Ika runs `20261027000000_feature_waitlist.sql`**. "Preview Explore" waits for the Explore library design |

### Done before the tracker

- Favicon and app icons from the Nia logo
- Fix 1 code and email templates pushed (8bb6e52); waiting on Ika to paste the templates into Supabase

- Templates gallery slice 1 (showcase + compact views, stage filters, family shelves, build-thumbs) — 7c2e348
