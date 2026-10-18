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
- AI proposes, the producer decides: AI output is a proposal card (Apply / Modify / Dismiss) with a
  gold "AI draft" marker; never change user data without Apply.
- Deep modules (Projects, Documents, People & Places, Schedule, Copilot); one primary action per screen.
- Every element serves a production job, or ask Ika. Imagery comes from the user's own work.
- Production language (project, call sheet, shoot day, crew, call time, wrap). Never: payload, token,
  manifest, asset locker, "Intelligent Core", or "workspace" except for the team account.
- Prevent mistakes (e.g. double-booking) instead of reporting them afterwards.

Design:
- Colors, fonts, radii, spacing and motion only from theme variables; no hex or pixel values in pages.
- Brand: Obsidian `#0A0908`, Aged Gold `#8A7A52` (single accent, active states only), Geist (UI),
  Instrument Serif italic (accent headings only).
- Build from `src/components/ui` (shadcn) and `src/components/nia`; new looks are variants. Keep shadcn
  focus rings and keyboard behaviour.
- Motion: `fast` 150ms, `base` 250ms, `slow` 400ms, ease-out on enter, no loops, respect reduced
  motion. Only modals/panels, the saved tick, cards settling, Copilot highlights and onboarding slides animate.

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

## Working notes

- If something fails twice, stop, explain simply, and offer to revert to the last commit.
- Sessions: start with "Read CLAUDE.md and tell me where we left off"; end by updating Progress,
  then commit and push.
- Live site: https://nia-os-web-9ahh.vercel.app (production deploys from `main`, ~1 minute).
- Test account: credentials in `.env.local` as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; sign in with
  them in headless Chrome to verify signed-in screens. A second test account is still needed for the
  isolation check (until then, isolation is checked by querying as the test account).
- Supabase URL Configuration: Site URL `https://nia-os-web-9ahh.vercel.app`; Redirect URLs exactly
  `https://nia-os-web-9ahh.vercel.app/**` and `http://localhost:3000/**`. Never use
  `*-nia-technologies.vercel.app` URLs (Vercel-protected, shows a login wall).
- Auth UI lives in `src/components/auth/`; Supabase logic in
  `src/components/{login,sign-up,forgot-password,update-password}-form.tsx`. Email and Google links
  land on `/auth/confirm`; failures go to `/auth/error`. Use real logo SVGs from the web.
- Anything reading the Supabase session must `await connection()` first (Supabase reads `Date.now()`),
  inside a `<Suspense>` boundary.
- If the dev server serves stale CSS or route types, stop it, `rm -rf .next`, and restart.

## Progress

Milestone 0 — Foundations
- [x] 0.1 CLAUDE.md (this file), BUILD_PLAN.md and docs/design-program.md added.
- [ ] 0.2 Theme. Current theme is mapped from Figma (DM Sans, `#1A1A1A`, radius sm 6 / md 8 / lg 12 /
  xl 16 / 2xl 22); to be re-mapped to the plan's brand, plus motion tokens.
- [ ] 0.3 Base components. Have button, input, dialog, dropdown-menu, badge, card, avatar, select,
  sonner, sheet, tooltip (plus slider, switch, textarea, skeleton). Missing: tabs, table,
  toggle-group, Button `pill`, Badge status variants.
- [ ] 0.4 Nia components. Not started.
- [ ] 0.5 Component gallery. Not started.
- [x] 0.6 Connect services. Supabase URLs and Vercel env vars verified; live site loads.

Milestone 1 — Accounts
- [x] 1.1 AuthLayout, Log in, Sign up. Hero is a crossfading slideshow of Ika's images.
- [x] 1.2 Password recovery: forgot password, check your email (opens the user's web inbox), new password.
- [ ] 1.3 Make auth real. Working: email/password, Google, password reset, `profiles`,
  `user_settings`, `workspaces`, `workspace_members`, `workspace_invites` with RLS; new users →
  onboarding (proxy), logged-out → `/login`. To do: returning users → `/home` (rename from
  `/dashboard`), create the personal workspace at sign-up (today it's made in onboarding), soft deletes.
- [ ] 1.4 Onboarding. Built as all 9 Figma screens under `/onboarding/*`, saving each step, tested end
  to end locally and live. To do: trim per Decisions above.

Milestone 2 — Projects
- [ ] 2.1 App shell. Partly built: Figma top navbar with profile menu (Settings, Log out); other tabs
  disabled.
- [ ] 2.2–2.5 Not started.

Milestone 3 — Documents: not started.

Milestone 4 — Shoot day: not started.

Milestone 5 — Copilot: not started.

Milestone 6 — Share & launch
- [ ] 6.3 Essential settings. Partly built: Settings → Profile (incl. AI assistant style and
  suggestions) and General save to Supabase; other tabs disabled. A Notifications design draft
  exists in Claude Design.
- [ ] Everything else not started.

Migrations run so far: `20261018000000_profiles_settings_workspaces.sql`,
`20261019000000_onboarding.sql`, `20261019010000_avatar_cleanup.sql`.
