# Feedback and fixes tracker

One fix per session, finished fully (built, checked on desktop + 375px, live, committed) before
the next starts. Status: ⬜ to do · 🔄 in progress · ✅ done · ⏸ waiting on Ika.

## How each fix runs

1. Restate the fix in plain English and list what changes (and any SQL or dashboard step for Ika).
2. Build it from `src/components` (the `/dev/components` library) and the theme; no new looks invented.
3. Check: desktop and phone width, refresh, two test accounts where data is involved, no console errors.
4. Ika runs any SQL or Supabase dashboard step.
5. Commit, push, check the live site, tick the box here and in BUILD_PLAN.md if it maps to a step.

## Queue (in order)

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
| 8 | Collaborators end to end: invite by email or in-app (accept once), "Shared with you" on Projects, contributions, live updates and notifications | 🔄 | Done: "Shared with you" on Projects (uiarc cards, View opens the project); in-app invites already existed. Notifications table + Home inbox (U1) done. Invitation emails done: Resend (`RESEND_API_KEY`, key "nia-os-web-app"), sign-up email's design, "Open project" or "Join Nia", replies go to the owner (`src/lib/project-invite.ts`). To do: live updates on the project page |
| 5c | Black wordmark above the form on phones (sign-in and onboarding) | ✅ | |
| T | Templates rebuild from `TEMPLATES_BUILD.md` (63 templates, flat black and white, Showcase / Compact / Index, search, preview pop-up, Suggested for you, template engine, Editorial Shoot workflow). Runs before Fix 6, one build step at a time | 🔄 | Steps 1–3 done: data; gallery with "Templates" title, "Search 63 templates" box (search on Enter, best match + also relevant), filter chips incl. Administrative and Camera & Visual, Showcase / Compact / Index, flat black line icons (Lucide). Step 4 done: suggestions while typing (top 5, Best match, matched words, See all results, arrow keys / Enter / Escape). Step 5 done: preview pop-up (click or 0.8s mouse hover, ← → and Esc, expand, `?preview=` link so Back closes it and links share, related templates, full screen on phones). Step 6 done: Suggested for you (uiarc cards, reason on each, I work as…, Reset what Nia learned; views / uses / searches saved to `template_events`). Next: step 7 template engine. Replaces 9, 10 and 10b below |
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
| 14 | Review the build history for missed features/fixes and schedule them | ⬜ | Known so far: switched-off share link returns 200; calendar range band; plan boxes 1.3–2.5 need final checks; test scripts to move into the repo |
| G2 | Find which Google account owns the Google sign-in setup (needed for G1) | ⏸ | Supabase → Authentication → Sign In / Providers → Google shows the Client ID (ends in `.apps.googleusercontent.com`). Sign in to console.cloud.google.com with each Google account you use → APIs & Services → Credentials, and look for that Client ID. The account that has it owns the setup |
| F1 | Fonts: only the app's own font (Geist) everywhere — no serif (Instrument Serif italic) and no all-caps monospace labels; sentence case instead | ✅ | Done across the app and CLAUDE.md. Kept for Ika to decide: the screenplay preview's Courier capitals (industry format, content not labels); component-library sample pages unchanged |

## Done

- Favicon and app icons from the Nia logo
- Fix 1 code and email templates pushed (8bb6e52); waiting on Ika to paste the templates into Supabase

- Templates gallery slice 1 (showcase + compact views, stage filters, family shelves, build-thumbs) — 7c2e348
