# Nia OS product roadmap

**Updated 2026-11-27 (November audit).** What's live, what's being built, the rough edges we know
about, and what Nia is built with. For the detail behind each item see [FEEDBACK.md](FEEDBACK.md)
(the master list), [decisions.md](decisions.md) (why) and CLAUDE.md → Progress (the build plan's
checklist).

**Keeping it current:** any commit that fixes a rough edge, ships an "In development" item, or adds
a new integration or dependency updates this file in the same commit: the item's status, the tech
stack and the counts.

---

## November at a glance

- **Projects grew up:** references in folders with a full-screen viewer and Finder-style selecting;
  key milestones with assignees and a full view; uploaded documents show in Documents (UB1).
- **Meetings:** notes from any notetaker (step 1) and booking a Google Meet from a project (step
  3) went live; booked meetings show on Home's Upcoming schedule.
- **Explore:** search by title, person, studio, festival and how it was made; hover trailers;
  franchises; Best of 2026 (90 of the top 100 live); Recently added back as a row.
- **Desktop:** Nia installs as an app, keeps opened documents readable offline, and sends
  notifications while it's open.
- **Home:** "Get started with", Upcoming schedule, five recent projects.
- **Shipping:** GitHub checks types, lint and tests on every pull request (2026-11-21).
- **Outage, 2026-11-25 to 2026-11-27:** the live site was paused when Nia's own picture resizer
  used up the Vercel Hobby plan's 4 hours of server time a month. Nia moved to Vercel Pro and back
  to Vercel's own resizer.

## Live now

| Area | What people can do |
|------|--------------------|
| Accounts | Sign up and log in with email or Google, reset a password, a 5-screen onboarding |
| Home | "Get started with" (New project, Meeting, Explore, Collection, Templates), five recent projects, Upcoming schedule (booked meetings and shoot days, Join on the day), Activity |
| Projects | Projects list with search, stage chips, type and genre filters and sort; create blank or from a workflow; cover, production details, files up to 50 MB with tags (select several, tag at once); uploaded documents in the Documents tab; references in folders (select or drag to move, ⌘/Shift click, drag a box) with a full-screen viewer that plays trailers, Instagram posts, video and sound; key milestones with assignees and a full view; share by email (Can view / Can edit), a view-only link, or "view and ask to edit"; comments with replies; live updates between collaborators |
| Meetings | Overview → Meetings: notes from any notetaker (file or paste) read into a summary and transcript, action items to Key milestones in one tap; Schedule a Google Meet (Calendar event, Meet link, invites to cast and crew, who's busy) |
| Cast & crew | One directory per workspace: cast table, crew by department, profiles, statuses, quick add (Who + Role, paste a list) |
| Templates | 37 working templates in one list by category; editor with autosave, Undo/Redo; downloads as PDF, Word, Markdown and .txt; tutorials |
| Workflows | 12 guided workflows, three for each group (creators, filmmakers, photographers, small studios) |
| Explore | Curated films and series with press kits, cast and crew, palettes and release dates; categories incl. Made in Africa, Hollywood classics, Holiday classics, By festival and Best of 2026; franchises; Recently added; search by title, person, studio, festival and production details (Look, Camera, Setting, Mood); hover trailers on every row; timeline on desktop; open to everyone signed in |
| Desktop | Install Nia as an app from Chrome, Edge or Safari (own window and icon); documents opened stay readable offline (`/offline`); desktop notifications while Nia is open (shares, access requests, comments) |
| Everywhere | Global search, welcome tour and What's new, Send feedback, dark mode, switch between accounts, Settings (Profile, General), Plans (Free, Starter, Creator, Pro; no payments yet), link previews for every page |

## In development

| Item | Status | What's left |
|------|--------|-------------|
| Portfolios (beta) | 🔄 Test accounts only | Ika runs `20261123000000_portfolios_own_work.sql` (PA1, PA2: the database rule that keeps a portfolio to its own workspace's work); then 75 view templates across 14 kinds, Access step, client links, passcodes, expiry, downloads, favourites; send a project to Explore for review; open to beta users |
| Marketplace | 🔄 Designed, prototype only | Not in the app (removed in the 2026-11-01 audit, tag `parked-2026-11-02`). Rent and Buy, listings with pickup dates and a deposit hold, checkout, fleet booking, List your gear, lister dashboard |
| Cast & crew (4.1) | 🔄 | Link a person to their Nia account; Nia photos in the project row; people's own pages |
| Templates by group | 🔄 37 of 63 working | Build the rest in Ika's priority order (creators, filmmakers, small studios) |
| Briefs (UB2, UB3) | ⬜ Next | Uploaded briefs open as editable documents, like meeting notes; formatting kept from upload through editing, preview and export |
| Desktop navbar | 🔄 N1–N3 done | N4 "Try" ideas, N5 gallery and fallbacks, N6 full check; Figma frames; PA6 (the bar's side edge) waits on Ika |
| Explore catalogue | 🔄 90 of Best of 2026's top 100 live | The last 10, then the weekly rerank; studio-catalogue titles 2–3 at a time, each with a press kit; AI tagging from a fixed list (EX5) |
| PostHog activation | 🔄 Installed, session replay on | First recordings on the live site; Replay Vision scanners start then |
| Meetings (steps 2 and 4 of 4) | 🔄 Steps 1 and 3 live (see Live now); step 2 (Claude's suggested changes on Apply) built, off until an `ANTHROPIC_API_KEY` is added | Add the key for step 2; then Gemini notes arriving by themselves (4). `docs/MEETINGS_SPEC.md` |
| Desktop app | 🔄 Steps 1, offline documents and notifications live 2026-11-24/25; notifications with Nia closed live 2026-11-27 | Safari check (D2, Ika); a downloadable Tauri app only with a reason (D3); phones after desktop (D4) |
| Notifications (D8) | 🔄 Part 1 live 2026-11-28: new documents, added to a cast or crew, shoot dates, deliverables and budget changes | Part 2 @mentions in comments live 2026-11-28; part 3 in meeting notes and documents; part 4 mentions of people outside the project (email via Resend); Inbox messages with the Inbox |
| Onboarding (1.4) | 🔄 | "How did you hear about us" as an optional tap; "What you can do" as slides (waits on Figma) |

## Known rough edges

Logged in [FEEDBACK.md](FEEDBACK.md) → UI/UX audit (2026-11-12), Platform audit (2026-11-18),
Desktop (D1–D7) and Still open. Fixed in November and checked off: FB3, FB4, UX15, UX16, UX17,
UB1, PA3–PA5, PA7, PA8.

| # | Rough edge | Status |
|---|-----------|--------|
| D7 | Explore all → Timeline shows a page error (React #418) | ⬜ |
| UX2 | Phone, Cast & crew: toolbar runs off screen; cast table's Contact and Status cut off | ⬜ |
| UX3 | Floating Feedback button covers content bottom right | ⬜ |
| UX4 | Plans sells AI credits before the Copilot exists; two equal primary buttons | 🔄 2026-11-25, the two buttons are grey; AI credits still shown |
| UX5 | Explore titles show placeholders ("Recognition: To be confirmed", "Season 3 —") | ⬜ |
| UX6 | Settings and Plans light up the Home tab | ⬜ |
| UX12 | No-cover projects show a grey block that looks like loading | ⬜ |
| UX13 | Phone tap targets under 44px (also the top bar's + and account button, 2026-11-25) | ⬜ |
| UX14 | Phone, project page: Adjust and Change cover always over the cover photo | ⬜ |
| UX18 | Home Activity repeats share-link on/off lines | ⬜ |
| UX19 | Person page: "Films" for a series; stray capitals | ⬜ |
| PA9 | Switches that are always on (`exploreUnlocked`, `previewPanel`, …) still in the code | ⬜ |
| UX20 | Login hero is a *Sinners (2025)* still: rights? | ⏸ Ika |
| FB13 | Onboarding images are fashion shoots; one set of production photography instead (Inbar) | ⏸ Ika picks the photos |
| 1 | Sign-up email: last test sent no email | ⏸ Ika |
| G1 | Google sign-in shows the Supabase address | ⏸ Ika |
| DB | Migrations not run: `20261110000000_explore_open.sql` (only invited people can save Explore titles), `20261123000000_portfolios_own_work.sql` (PA1, PA2), `20261127000000_push_subscriptions.sql` (D6) | ⏸ Ika |

## Next up

1. Briefs editable on the platform, formatting kept everywhere (UB2, UB3).
2. Milestone 4: Locations, then shoot days and the schedule, documents that fill themselves, the
   Shoot Day screen, Home that knows the next shoot.
3. Collaboration: permissions by role (B14), then add crew by Nia username with accept (B15),
   version history (B16) and live co-editing (B17).
4. Milestone 5: Copilot (AI proposes, the producer decides).
5. Beta pilot with the three groups.
6. A new person's first minute (feedback 2026-11-18, FB2, FB14, FB16): Home's "Get started with"
   is live (2026-11-19); still to do: the role picked at onboarding fills an empty Home with that
   group's workflows, fewer onboarding questions, template thumbnails that show the template (FB15).
7. Explore's study page, one design (EX6 with FB6–FB10): stills and colour strip at the top,
   tags you can tap (production-notes tags open search since 2026-11-19), production notes before
   box office, checked camera and lighting details.
8. Later: applying for work (briefs, castings, festivals, grants) with your profile and portfolio;
   a PR workspace (press kits, junkets, talent rosters, media lists, coverage); a brand kit (B18);
   Explore open before sign-up (B1), weekly new titles, "Start a project from this".

### Designed or planned, not built

| Function | Status | What it is |
|----------|--------|------------|
| Spaces | Designed (24 screens) | Projects become Spaces: next up, what needs you, phases, schedule, crew and documents |
| Nia AI | Designed | Paste a brief, get a Space; spots the films a brief names and adds them as references (BR1, BR2) |
| Agents | Planned | Model-agnostic agents for the legwork: call sheets, clashes, hand-offs; each one proposes |
| Explore by content type | Studied (EX8) | View Explore all as Trailers · Interviews · Behind the scenes · Press events |
| Production checklists and reminders | Planned (Youvanni, FB24–FB26) | A checklist for each role from practice Nia recommends, reminders tied to the shoot's timeline ("Shoot starts now, here's your checklist"), and the run of show reaching everyone on the shoot; builds on Milestone 4's shoot days and desktop notifications |
| Expenses and reimbursements | Being studied (Youvanni, FB23) | Crew log what they paid for with a receipt photo, the producer approves, both see when it's paid back; unplanned costs show against the budget. Nia records money, it doesn't move it |
| Keep-going reminders | Idea (Jacqueline, FB27) | An opt-in phone or desktop notice to pick a project back up when it's gone quiet |
| Recreate this look | Idea (Alvin, FB9) | From an Explore title, a shot list and mood board proposed into your project |
| Template looks | Idea (Inbar, FB18) | A few designed versions of each template (background, fonts); needs a decision on document fonts |
| Community profile | Idea (Inbar, FB19) | A profile for networking and collaboration, started inside Settings |

## What testers say

From beta testers, November 2026 (full list and permissions: [FEEDBACK.md](FEEDBACK.md) → 2026-11-18).

- "Wow bro! It's quick and efficient!" — Paballo Mavundla, actor (South Africa)
- "I saw the explore page🥺 its literally so so cool hey" — Mbalenhle Banda
- "A seamless start! So excited bro!" — Joshua
- "I doubt I'll be needing Notion!" — Joshua
- "The workflows by role are exactly what I was hoping for." — Alvin

---

## Tech stack

| Layer | What we use |
|-------|-------------|
| App | Next.js 16.4.6 (App Router, Cache Components), React 19.3, TypeScript 5 |
| Look | Tailwind 4, shadcn/ui (radix-nova), Radix, Framer Motion 14, Lucide icons, Geist |
| Data | Supabase: Postgres with row-level security, Auth, Storage, Realtime |
| Hosting | Vercel Pro since 2026-11-27 (deploys from `main`; pictures resized by Vercel's own image service), GitHub |
| Desktop | Installable web app (`src/app/manifest.ts`), a service worker for offline documents and notifications (`public/sw.js`) |
| Documents | jsPDF + jspdf-autotable (PDF), docx (Word), pdf.js (reading PDFs), mammoth (reading Word meeting notes) |
| Other UI | Recharts, react-day-picker, d3-time, cmdk, Sonner, Vaul, react-easy-crop |
| Notifications | web-push 3.6.7 (sends desktop notices through the browser's own push service: Google's for Chrome and Edge, Apple's for Safari; `src/lib/push.ts`) |
| Text editing | TipTap 3.32.2 (formatting as you type, saved as Markdown; `@tiptap/extension-mention` and `@tiptap/suggestion` for @mentions in comments; `src/components/nia/rich-text-editor.tsx`) |
| Video | Remotion (template tutorials, demo films); ElevenLabs voice-over (demo films only) |
| Testing | Vitest; GitHub Actions runs types, lint and tests on every pull request (`.github/workflows/checks.yml`); Playwright MCP (headless Chrome checks); ESLint with Nia's design rules (`lint/nia-design-rules.mjs`) |
| Security | Zod 4 checks every server action's input (`src/lib/schemas.ts`); pictures downloaded on the server (Explore's trailer stills, Instagram covers) are capped at 50 MB and 100 megapixels, refuse redirects and come only from allowed places (`src/lib/fetch-image.ts`); Vercel resizes Supabase pictures from Nia's own project only |
| AI | Claude API (`@anthropic-ai/sdk`, `claude-opus-5-5`, structured output, the API's own fallback model when a request is declined) for a meeting's suggested changes (`src/features/meetings/propose.ts`); the Copilot and agents later |

## Integrations and services

| Service | Used for | Status |
|---------|----------|--------|
| Vercel | Hosting, picture resizing | Pro since 2026-11-27 (the Hobby plan paused the site 2026-11-25) |
| Supabase | Database, sign-in, files, live updates | Live |
| Google | Sign in with Google; Calendar and Meet for booking production meetings (`src/lib/google.ts`, its own "Nia calendar" client; free) | Sign-in live; Calendar live, in Google's Testing mode (only test users added in Google Cloud can connect) until Google verifies the app |
| Resend | Auth emails and project invites | Live |
| Anthropic (Claude API) | A meeting's suggested changes (Meetings step 2) | Built, off until an `ANTHROPIC_API_KEY` is added |
| Browser push services (Google, Apple, Microsoft) | Desktop notifications when Nia is closed: Nia sends to the address each browser gives (keys `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`); a Supabase database webhook on new notifications calls `/api/push` (`PUSH_WEBHOOK_SECRET`) | Live 2026-11-27 (tested in the Safari app with Nia quit) |
| PostHog | Product analytics, session replay | Live, waiting on first recordings |
| TMDB | Explore posters, credits and trailers (free API during the private beta) | Beta; commercial licence before charging |
| Wikidata, Wikimedia Commons | Explore credits and film people's photos (credited) | Live |
| GitHub Actions | Types, lint and tests on every pull request | Live since 2026-11-21 |
| Figma, Claude Design | Designs (Figma is the source of truth) | Tools |
| Claude Code | Building the app | Tool |
| Supabase MCP, Playwright MCP | Database checks and browser tests during development | Tools |

## Counts

As of 2026-11-27 (was 2026-11-18):

| | Now | Was |
|-|-|-|
| Working templates | 37 of 63 | 37 of 63 |
| Workflows | 12 (3 per group) | 12 |
| Explore titles in the library (only titles with a cover show) | 446, plus 124 creators' films on Explore all | 329 |
| Explore press kits | 294 | 178 |
| Database migrations | 51 files (4 waiting to be run) | 42 (2 waiting) |
| Automated tests | 248 in 37 files, all passing | 151 in 24 files |
