# Nia OS — BUILD_PLAN.md

Instructions for Claude Code. Ika (the owner) is new to coding. Follow this file exactly.

## How to work

- Do **one unchecked step at a time**, top to bottom. Never skip ahead or combine steps.
- For each step:
  1. Explain your plan in plain English (what you'll build, files and Supabase tables touched). **Wait for Ika's OK.**
  2. Build the UI with sample data, matching the Figma frame(s) exactly. Use the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`).
  3. Run the **Design check** (below). Fix anything that fails.
  4. Connect to Supabase so the data really saves and loads.
  5. Run the **Standard checks** (below) plus the step's own checks. Tell Ika how to verify each one.
  6. Tick the step's box in this file, update the Progress section of CLAUDE.md, commit with a clear message, push, and **stop**.
- Steps marked ★ need a Claude Design exploration first. If Ika hasn't confirmed the chosen direction is in Figma, **stop and ask**.
- **Figma is the source of truth.** If a step needs anything that isn't in Figma (a new screen, state, component, empty state or flow), do not invent it in code. Stop, describe exactly what's missing and why it's needed, and ask Ika to design it in Claude Design and reconcile it back into Figma first. Then build from the Figma frame.
- Never restyle existing Figma designs. Improvements come back through Figma, not through code.
- If something fails twice, stop, explain the problem simply, and offer to revert to the last commit.
- Explain everything simply. No jargon without a one-line explanation.

## Figma

File: https://www.figma.com/design/jaF49U0T0DQ5lNB6h4wJvp/Nia-Technologies-Inc.
Frame links: append `?node-id=` plus the node number, e.g. `?node-id=1104-43`.
Developer handoff board (ordered by user journey): node `796-7730`. If a step names a screen but no node, find it in that board and confirm the node with Ika before building.

## Stack

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres, Auth, Storage, Realtime), Vercel, GitHub. Animations with Framer Motion (`framer-motion`). Icons: Lucide only.

## Product rules (apply to every screen)

1. **AI proposes, the producer decides.** AI output is always a proposal card (Apply / Modify / Dismiss). AI-drafted content shows a small gold "AI draft" marker until approved. Never change user data without Apply.
2. **Deep modules, one obvious action.** Modules: Projects, Documents, People & Places, Schedule, Copilot. Each screen has one primary action.
3. **Purpose test.** Every element must serve a production job. If not, ask Ika before adding it.
4. **Design it twice** for ★ screens (done by Ika in Claude Design before the step).
5. **Visual, but quiet.** Imagery comes from the user's own work (covers, stills, moodboards). Motion only confirms an action or shows where something went.
6. **Production language.** Use the words crews use: project, call sheet, shoot day, crew, call time, wrap. Never: payload, token, manifest, asset locker, workspace (except the team account), "Intelligent Core".
7. **Errors out of existence.** Prevent mistakes (e.g. double-booking) instead of showing error messages afterward.

## Design rules

- Colors, fonts, radii, spacing and motion come **only** from theme variables. Never hard-code a hex value or pixel size in a page.
- Brand: Obsidian `#0A0908`, Aged Gold `#8A7A52` (single accent, active states only), Geist (UI), Instrument Serif italic (accent headings only). If Figma disagrees, ask Ika.
- Build from `src/components/ui` (shadcn) and `src/components/nia` (Nia components). New looks = new **variants**, not one-off styles.
- Keep shadcn focus rings and keyboard behavior.
- Motion tokens: `fast` 150ms (taps, hovers), `base` 250ms (panels, modals), `slow` 400ms (page changes). Ease-out on enter. No looping animations. Respect `prefers-reduced-motion`.
- Only these animate: modal/panel open-close, the "saved" tick, cards settling after drag, the highlight of Copilot changes after Apply, onboarding slides.

## Data rules

- Every table has Row Level Security: users only see rows in workspaces they belong to.
- Deletes are soft (`deleted_at`). Nothing is erased immediately.
- Secret keys live only in `.env.local` and Vercel environment variables. Never in code, never sent to the browser.
- Schema changes are migration files, explained to Ika before running.

## Design check (every step)

- [ ] Matches the Figma frame (spacing, type, color) at desktop width
- [ ] Works at phone width (375px)
- [ ] One obvious primary action
- [ ] Production language only
- [ ] Every image and animation has a job
- [ ] Empty, loading and error states exist and use production language

## Standard checks (every step)

- [ ] Refresh: data is still there
- [ ] Log out and back in: data is still there
- [ ] A second test account cannot see or open the first account's data (try the URL directly)
- [ ] Works on the live Vercel site, not just localhost
- [ ] No errors in the browser console

---

## Milestone 0 — Foundations

- [x] **0.1 CLAUDE.md.** Create/refresh CLAUDE.md: product summary (Nia OS, an AI-enabled content production operating system for creative professionals), the stack, the Product, Design and Data rules above (short form), a pointer to this file, and a Progress section listing Milestones 0–6.
- [x] **0.2 Theme.** Map brand colors, Geist + Instrument Serif, radii and spacing onto the shadcn theme variables in `globals.css`. Show Ika a table of Figma style → variable before applying. Add the motion tokens.
- [x] **0.3 Base components.** `npx shadcn@latest add` button, input, dialog, dropdown-menu, badge, card, tabs, table, avatar, toggle-group, select, sonner, sheet, tooltip. Add variants: Button `pill` (44px, fully rounded, default), Badge `confirmed / pending / on-hold / wrapped / cancelled`.
- [x] **0.4 Nia components** in `src/components/nia`: Navbar, StatusBadge, EmptyState (slot for an illustration), DocumentHeader (Back, PREVIEW, Ready to Export, Download PDF), ProjectCard (16:9 cover image, title, production-type chip, next shoot date; gradient fallback from project color; 1.02 hover lift at `fast`), TemplateCard (miniature document preview), ProposalCard (AI draft marker, Apply / Modify / Dismiss), SavedIndicator ("All changes saved ✓" with tick animation).
- [x] **0.5 Component gallery.** A `/dev/components` page showing every component and variant, for side-by-side comparison with Figma. Hide it in production.
- [x] **0.6 Connect services.** Confirm Supabase URL Configuration (Site URL = Vercel URL; redirect URLs include `http://localhost:3000` and the Vercel URL) and Vercel environment variables. Walk Ika through each screen. Check: live site loads.

## Milestone 1 — Accounts

- [x] **1.1 Auth layout + Log in + Sign up.** Shared AuthLayout (hero image left, form right, footer). Nodes `1104-43`, `796-16082`. Use Ika's own photography for the hero (ask her for files; placeholder until then). UI only.
- [x] **1.2 Password recovery.** Forgot password `1021-1844`, Check your email `1021-1895`, New password `1021-1866`. UI only.
- [ ] **1.3 Make auth real.** Supabase Auth: email/password, Google, password reset. Tables `profiles`, `workspaces`, `workspace_members` with RLS (create a profile and a personal workspace on sign up). New users → `/onboarding`; returning users → `/home`; logged-out users on app pages → `/login`. Check: reset email arrives and its link works on the live site.
- [ ] **1.4 Onboarding (5 steps).** One flow at `/onboarding` with a shared step component; save each answer as they go. Steps: Username `1023-30` (live availability check), Profile photo `1023-63` (Storage bucket `avatars`, max 5MB), Profession `1023-86` (store it; it decides solo vs crew mode later), Workspace `1023-185`, then "What you can do" `1023-219` as 3–4 swipeable slides, ending at All set `1023-262`. Ask "How did you hear" (`1114-115`) as a single optional tap on the last screen. Hide Import profile and Follow creators (after beta).

## Milestone 2 — Projects

- [x] **2.1 App shell.** Navbar on every signed-in page (Home, Projects, Templates, Inbox; Explore shows "Coming soon"), search bar (UI only for now), + button, profile menu with Log out. Reference `1021-754`.
- [ ] **2.2 ★ Projects list + New Project.** Grid of ProjectCards, search and sort, empty state with illustration slot. New Project modal: Blank or From Template (template option disabled until Milestone 3), name, description, production type (Film, TV Series, Short Film, Documentary, Music Video, Commercial, Interview, Behind the Scenes, Photo Shoot, Live Event), genre, cover image. Tables `projects`, `activity` with RLS. Storage bucket `project-files`.
- [ ] **2.3 ★ Project page.** Reference `722-31111` and the filled project frames. Cover image header, inline-editable title/description/Production Info (auto-save + SavedIndicator), Documents list (empty until Milestone 3), Team Members, Recent Activity, actions (Edit, Delete → soft delete). Every change writes one `activity` row.
- [ ] **2.4 Reference board.** (Moved into 3.2 as the References section.) Project References: drag-and-drop upload; tabs Stills / Documents / Audio / Video; stills shown as a visual masonry board; file detail panel. Table `project_files`. Max 50MB per file.
- [ ] **2.5 ★ Home.** Welcome line, **Next shoot** hero card (shows "Plan your first shoot" until Milestone 4), **Needs you** list, Recent Projects (ProjectCards), Recent Activity, Quick Actions. "Complete your profile" shows once as a dialog, then as a small Home card. Do not build the old four stat cards.

## Milestone 3 — Documents

- [ ] **3.1 ★ Template gallery.** Built from `TEMPLATE_THUMBNAILS.md` (Sections 7, 8, 8b), `src/data/templates.manifest.json` (the catalogue) and `design/prototypes/CDWorkspace.html` (visual reference). `/templates`: `build-thumbs` script (`npm run thumbs`), Showcase view (featured row of large TemplateCards: label · title · stage, 16:11 artwork, mini map on workflow templates) and Compact view (one shelf per colour family), stage filter chips, and search with suggestions ranked by a separate `rankTemplates` function. Family gradients stand in until a thumbnail exists; family colours are artwork only (UI stays Obsidian/gold). Templates not built yet show "Coming soon" and can't be opened. Template 01 (Editorial Shoot) opens the project launcher (add to an existing project or start a new one).
- [ ] **3.2 ★ Project sections.** A project is made of sections added from templates (References, Call Sheet, Shotlist, Team, Notes…). Table `project_sections` (project, type, title, position, content JSON, `deleted_at`) with RLS; add, rename, reorder and delete one section without touching the rest (deletes are soft and can be undone). One section editor renders any document template from JSON, with auto-save and SavedIndicator (this was the document engine). The References section takes images, video, documents and audio (Table `project_files`, 50MB per file; replaces 2.4). Proof: Call Sheet, Shotlist, GRWM and References can each be added, edited, auto-saved, reopened and removed. Designed in Claude Design first. Later (Milestone 5): upload a brief (PDF, DOCX or Markdown) and Copilot proposes project details and sections to Apply, Modify or Dismiss.
- [ ] **3.3 Project tabs.** Keep more than one project open and switch between them with tabs; tabs survive a refresh. Designed in Claude Design first.
- [x] **3.4 PDF export.** A clean print layout and Download PDF for any document.
- [ ] **3.5 Batch A — Shoot day:** Call Sheet – Detailed, Crew Contact List, Shooting Schedule. Data only, no new pages.
- [ ] **3.6 Batch B — Pre-production:** Script Breakdown, 3-Column AV Script, Storyboard – 9 Frame, Series Bible, Casting Deck, Production Budget.
- [x] **3.7 Batch C — On set & wrap:** Continuity Log, Shot Logging Sheet, Equipment Rental Log, Filming Notice, Invoice.
- [ ] **3.8 Batch D — Strategy:** Content Production Guideline, Press Junket Brief, Talent Roster Report, Production Budget Framework.
- [ ] **3.9 Batch E — UGC & Social:** Explainer, Skit, Product Review, Day in My Life, Tutorial, Haul, Storytime, Recipe, Workout, Room Tour, Q&A, Challenge/Trend.
- [ ] **3.10 Solo vs crew.** Use the profession from onboarding: solo creators see UGC templates first and no Cast & Crew/Locations tabs; crews see everything. Ika can switch it in the profile menu.

## Milestone 4 — Shoot day

- [ ] **4.1 Cast & Crew.** Directory (List/Grid, filters Department / Role Type / Status, totals), Add/Edit Person dialog, profile sheet (contact, agent, bio, weekly availability, episodes). Table `people` with RLS. StatusBadge changes save instantly.
- [ ] **4.2 Locations.** Set, Parking, Nearest Hospital, Base Camp, Catering; add with address, Google Maps link, photos (shown as image cards), notes. Table `locations`.
- [ ] **4.3 Schedule + calendar.** Month / Week / Day views, New Production Event dialog. Table `events`. **Prevent double-booking:** you cannot assign a person who is marked unavailable or already booked at that time (the option is disabled with a short reason).
- [ ] **4.4 ★ Connected call sheet.** Call Sheet and Call Sheet – Detailed pull cast, crew, locations and schedule live from the tables (no retyping). Call times are worked out from the schedule; Adjust Call Time dialog updates the source. Weather and sunrise are typed fields for now.
- [ ] **4.5 ★ Shoot Day view (new screen).** Phone-first `/projects/[id]/today`: call time, location with map link, weather, next scene, who's confirmed/arrived, emergency contacts. Very large type, high contrast, details one tap away. Ika designs this in Claude Design first.
- [ ] **4.6 Breakdown details.** Scene detail, Props Breakdown, Makeup & Hair Breakdown, built on the document engine and linked to `people`.
- [ ] **4.7 Home goes live.** Next shoot card, Needs you list and Upcoming Schedule read real data.

## Milestone 5 — Copilot

- [ ] **5.1 Server route.** A server-only route calling the Claude API with `ANTHROPIC_API_KEY` (in `.env.local` and Vercel only). Ask Ika to create the key at console.anthropic.com and set a monthly spending limit. Streams replies. Table `copilot_messages` with RLS.
- [ ] **5.2 ★ Copilot panel.** Side panel in the document editor: chat, suggestion chips (Summarize, Check conflicts, Draft memo), "Ask NIA anything…". Context: the open document plus its project's people, locations and events.
- [ ] **5.3 Proposals.** Requested changes come back as a proposed edit to the document's JSON, shown in a ProposalCard with the changes highlighted. Nothing saves until Apply. After Apply, briefly highlight what changed.
- [ ] **5.4 Generate call sheet.** One button on a project: Copilot drafts a call sheet from the schedule, people and locations as a proposal.
- [ ] **5.5 Conflict warnings.** Plain code (not AI) checks for overlapping events and missing call times; show them in Home's Needs you list.

## Milestone 6 — Share & launch

- [ ] **6.1 Share.** Share dialog (invite by email, Can view / Can edit, people with access, create link, allow duplicate). Table `shares`. Links use long random tokens, can be revoked, and open a read-only page that masks phone numbers and emails. Confirmation copy: "Link ready. Anyone with it can view." Add Open Graph tags for WhatsApp/iMessage previews. Send to Crew from a call sheet. Email via Resend (key in env only).
- [ ] **6.2 Inbox.** All / Unread / Mentions, Messages, Shared with you, notifications (invites with Accept / Decline, mentions, call time changes). Tables `messages`, `notifications`. Supabase Realtime.
- [ ] **6.3 Essential settings.** Profile, Notifications (email, weekly digest), Security (change password, two-factor via Supabase MFA), AI Assistant (communication style, suggestions on/off). Everything else in Settings shows "Coming soon".
- [ ] **6.4 Search.** ⌘K and the navbar search across projects, documents, templates and people the user can access.
- [ ] **6.5 Trash and Archive.** Restore / delete permanently; scheduled clean-up after 30 days (Trash) and 90 days (Archive).
- [ ] **6.6 Wrap moment.** When a project is marked wrapped: a summary card with the cover image, days shot, scenes and crew count, shareable as an image.
- [ ] **6.7 Launch checks.** Separate Supabase project for development; error tracking (Sentry) and Vercel Analytics; Privacy Policy and Terms pages linked from sign up (Ika provides the reviewed text); a full security review of every RLS policy and API route, reported to Ika in plain English.

## After the beta (do not build yet)

Explore and community, Follow creators, Import profile (IMDb, LinkedIn, Vimeo), connected apps, developer API and webhooks, encryption/NDA/watermark settings, login history, live co-editing, automatic weather, desktop app (Tauri), bespoke icon set.
