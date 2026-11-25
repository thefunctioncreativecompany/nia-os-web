# Nia OS product roadmap

**Updated 2026-11-18.** What's live, what's being built, the rough edges we know about, and what Nia
is built with. For the detail behind each item see [FEEDBACK.md](FEEDBACK.md) (the master list),
[decisions.md](decisions.md) (why) and CLAUDE.md → Progress (the build plan's checklist).

**Keeping it current:** any commit that fixes a rough edge, ships an "In development" item, or adds
a new integration or dependency updates this file in the same commit: the item's status, the tech
stack and the counts.

---

## Live now

| Area | What people can do |
|------|--------------------|
| Accounts | Sign up and log in with email or Google, reset a password, a 5-screen onboarding |
| Projects | Projects list with search, stage chips, type and genre filters and sort; create blank or from a workflow; cover, production details, files up to 50 MB with tags (select several, tag at once); references in folders (select or drag to move) with a full-screen viewer; share by email (Can view / Can edit), a view-only link, or "view and ask to edit"; comments with replies; live updates between collaborators |
| Cast & crew | One directory per workspace: cast table, crew by department, profiles, statuses, add and edit people |
| Templates | 37 working templates in one list by category; editor with autosave, Undo/Redo; downloads as PDF, Word, Markdown and .txt; tutorials |
| Workflows | 12 guided workflows, three for each group (creators, filmmakers, photographers, small studios) |
| Explore | Curated films and series with press kits, cast and crew, palettes and release dates; categories incl. Made in Africa, Hollywood classics and Best of 2026; search with production-detail filters (Look, Camera, Setting, Mood); timeline on desktop; open to everyone signed in |
| Everywhere | Global search, Home, welcome tour and What's new, Send feedback, dark mode, switch between accounts, Settings (Profile, General), Plans (Free, Starter, Creator, Pro; no payments yet) |

## In development

| Item | Status | What's left |
|------|--------|-------------|
| Portfolios (beta) | 🔄 Test accounts only | 75 view templates across 14 kinds, Access step, client links, passcodes, expiry, downloads, favourites; send a project to Explore for review; open to beta users |
| Marketplace | 🔄 Designed, prototype only | Not in the app (removed in the 2026-11-01 audit, tag `parked-2026-11-02`). Rent and Buy, listings with pickup dates and a deposit hold, checkout, fleet booking, List your gear, lister dashboard |
| Cast & crew (4.1) | 🔄 | Link a person to their Nia account; Nia photos in the project row; people's own pages |
| Templates by group | 🔄 37 of 63 working | Build the rest in Ika's priority order (creators, filmmakers, small studios) |
| Desktop navbar | 🔄 N1–N3 done | N4 "Try" ideas, N5 gallery and fallbacks, N6 full check; Figma frames |
| Explore catalogue | 🔄 | Studio-catalogue titles 2–3 at a time, each with a press kit; AI tagging from a fixed list (EX5) |
| PostHog activation | 🔄 Installed, session replay on | First recordings on the live site; Replay Vision scanners start then |
| Meetings (step 3 of 4) | 🔄 Step 1 live (Overview → Meetings); step 2 (suggested changes) built, off until an `ANTHROPIC_API_KEY` is added (no paid services yet); step 3 (Schedule a Google Meet: Calendar event, Meet link, invites, who's busy) live 2026-11-19, booked meetings on Home's Upcoming schedule | Add the key for step 2; then Gemini notes arriving by themselves (4). `docs/MEETINGS_SPEC.md` |
| Desktop app | 🔄 Step 1 live 2026-11-24: install from Chrome, Edge or Safari (own window, Dock or Start menu icon) | Step 2 checked 2026-11-25 (all pages, sign-in, Google, links; Safari waits on Ika); documents offline live 2026-11-25; next desktop notifications; a downloadable Tauri app only with a reason (FEEDBACK D1–D7) |
| Onboarding (1.4) | 🔄 | "How did you hear about us" as an optional tap; "What you can do" as slides (waits on Figma) |

## Known rough edges

Logged in [FEEDBACK.md](FEEDBACK.md) → UI/UX audit (2026-11-12) and Still open.

| # | Rough edge | Status |
|---|-----------|--------|
| UX2 | Phone, Cast & crew: toolbar runs off screen; cast table's Contact and Status cut off | ⬜ |
| UX3 | Floating Feedback button covers content bottom right | ⬜ |
| UX4 | Plans sells AI credits before the Copilot exists; two equal primary buttons | ⬜ |
| UX5 | Explore titles show placeholders ("Recognition: To be confirmed", "Season 3 —") | ⬜ |
| UX6 | Settings and Plans light up the Home tab | ⬜ |
| UX12 | No-cover projects show a grey block that looks like loading | ⬜ |
| UX13 | Phone tap targets under 44px | ⬜ |
| UX14 | Phone, project page: Adjust and Change cover always over the cover photo | ⬜ |
| UX15 | Phone, Home: the New project tile is a full card of empty space | ⬜ |
| UX16 | Phone, Explore title: "Trailer" label overlaps the trailer's own text | ⬜ |
| UX17 | Template editor: the How-it-works card fills the first screen | ⬜ |
| UX18 | Home Activity repeats share-link on/off lines | ⬜ |
| UX19 | Person page: "Films" for a series; stray capitals | ⬜ |
| UX20 | Login hero is a *Sinners (2025)* still: rights? | ⏸ Ika |
| FB3 | Template preview: the list on the left gets squeezed and workflow names overlap (Alvin) | ✅ 2026-11-19 |
| FB4 | Sign-up role page: Content creator looks already picked (Alvin) | ✅ 2026-11-19, Photographer a main tile |
| FB13 | Onboarding images are fashion shoots; one set of production photography instead (Inbar) | ⏸ Ika picks the photos |
| 1 | Sign-up email: last test sent no email | ⏸ Ika |
| G1 | Google sign-in shows the Supabase address | ⏸ Ika |
| DB | `20261110000000_explore_open.sql` not run: only invited people can save Explore titles | ⏸ Ika |

## Next up

1. Milestone 4: Locations, then shoot days and the schedule, documents that fill themselves, the
   Shoot Day screen, Home that knows the next shoot.
2. Collaboration: permissions by role (B14), then add crew by Nia username with accept (B15),
   version history (B16) and live co-editing (B17).
3. Milestone 5: Copilot (AI proposes, the producer decides).
4. Beta pilot with the three groups.
5. A new person's first minute (feedback 2026-11-18, FB2, FB14, FB16; Ika's decision on Home
   first): the role picked at onboarding fills an empty Home with that group's workflows; fewer
   onboarding questions; template thumbnails that show the template (FB15).
6. Explore's study page, one design (EX6 with FB6–FB10): stills and colour strip at the top,
   tags you can tap, production notes before box office, checked camera and lighting details.
7. Later: applying for work (briefs, castings, festivals, grants) with your profile and portfolio;
   a PR workspace (press kits, junkets, talent rosters, media lists, coverage); a brand kit (B18);
   Explore open before sign-up (B1), weekly new titles, "Start a project from this".

### Designed or planned, not built

| Function | Status | What it is |
|----------|--------|------------|
| Spaces | Designed (24 screens) | Projects become Spaces: next up, what needs you, phases, schedule, crew and documents |
| Nia AI | Designed | Paste a brief, get a Space; spots the films a brief names and adds them as references (BR1, BR2) |
| Agents | Planned | Model-agnostic agents for the legwork: call sheets, clashes, hand-offs; each one proposes |
| Meeting notes | Step 1 live (uploaded notes keep their structure; action items to Key milestones in one tap), Google Meet booking live (Joshua, FB1) | Overview → Meetings: notes from any notetaker now; then proposals on Apply, Google Meet scheduling and Gemini notes (`docs/MEETINGS_SPEC.md`) |
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
| App | Next.js 16.4 (App Router, Cache Components), React 19.3, TypeScript 5 |
| Look | Tailwind 4, shadcn/ui (radix-nova), Radix, Framer Motion 14, Lucide icons, Geist |
| Data | Supabase: Postgres with row-level security, Auth, Storage, Realtime |
| Hosting | Vercel (deploys from `main`), GitHub |
| Documents | jsPDF + jspdf-autotable (PDF), docx (Word), pdf.js (reading PDFs), mammoth (reading Word meeting notes) |
| Other UI | Recharts, react-day-picker, d3-time, cmdk, Sonner, Vaul, react-easy-crop |
| Video | Remotion (template tutorials, demo films); ElevenLabs voice-over (demo films only) |
| Testing | Vitest; Playwright MCP (headless Chrome checks); ESLint |
| Security | Zod 4 checks every server action's input (`src/lib/schemas.ts`); pictures downloaded on the server are capped at 50 MB and 100 megapixels, refuse redirects and come only from Nia, its own Supabase project, YouTube thumbnails and Wikimedia Commons (`src/lib/fetch-image.ts`) |
| AI | Claude API (`@anthropic-ai/sdk`, `claude-opus-5-5`, structured output, the API's own fallback model when a request is declined) for a meeting's suggested changes (`src/features/meetings/propose.ts`); the Copilot and agents later |

## Integrations and services

| Service | Used for | Status |
|---------|----------|--------|
| Supabase | Database, sign-in, files, live updates | Live |
| Google | Sign in with Google; Calendar and Meet for booking production meetings (`src/lib/google.ts`, its own "Nia calendar" client; free) | Sign-in live; Calendar live, in Google's Testing mode (only test users added in Google Cloud can connect) until Google verifies the app |
| Resend | Auth emails and project invites | Live |
| PostHog | Product analytics, session replay | Live, waiting on first recordings |
| TMDB | Explore posters and credits (free API during the private beta) | Beta; commercial licence before charging |
| Wikidata, Wikimedia Commons | Explore credits and film people's photos (credited) | Live |
| Figma, Claude Design | Designs (Figma is the source of truth) | Tools |
| Claude Code | Building the app | Tool |
| Supabase MCP, Playwright MCP | Database checks and browser tests during development | Tools |

## Counts

| | |
|-|-|
| Working templates | 37 of 63 |
| Workflows | 12 (3 per group) |
| Explore titles in the library | 329 (only titles with a cover show) |
| Explore press kits | 178 |
| Database migrations | 42 files (2 waiting to be run) |
| Automated tests | 151 in 24 files, all passing |
