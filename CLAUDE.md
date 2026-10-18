@AGENTS.md

# Nia OS (web)

Next.js 16 (App Router, Cache Components) + Tailwind 4 + shadcn/ui + Supabase auth.
Designs live in Figma: `jaF49U0T0DQ5lNB6h4wJvp` (Nia Technologies Inc.), page "Web App",
frame "Nia OS — Developer Handoff (Ordered by User Journey)".

## Build loop (repeat for every screen)

1. Copy the screen's Figma frame link (right-click → Copy link to selection). Where a screen or
   layout could be formatted or improved beyond the Figma (e.g. no mobile design), suggest Claude Design.
2. Plan first: "Plan how to build this screen. Don't write code yet: [link]"
3. Build the look with sample data, matching Figma exactly and reusing existing components.
4. Compare with Figma at localhost:3000 and fix specific differences.
5. Make it real: connect to Supabase so data saves and loads for the signed-in user.
6. Run the test checklist.
7. "Commit and push." Vercel deploys in about a minute; check the live site too.

## Test checklist (every screen)

- Refresh the page: is the data still there?
- Log out and back in: is it still there?
- Sign in with a second test account: it must not see the first account's data.
- Narrow the browser window: does the layout still hold?
- Check the live Vercel site, not just localhost.

## Golden rules

- One screen per prompt; two to five screens per session.
- Start a session with "Read CLAUDE.md and tell me where we left off." End with
  "Update the progress section of CLAUDE.md, then commit and push."
- Keys never go in chats or code: only `.env.local` and Vercel → Settings → Environment Variables.
- If something isn't fixed in two tries: "Undo back to the last commit" and describe it differently.
- After each change, ask whether to commit.

## Conventions

- Build screens from shadcn components and the Supabase UI library auth blocks, restyled to Figma,
  rather than from raw pixels. Use real logo SVGs from the web (not Figma placeholders).
- Theme: the shadcn light-mode variables in `src/app/globals.css` are mapped from Figma
  (foreground/primary `#1A1A1A`, muted-foreground `#73726C`, border/input `#E2E2E2`, secondary
  `#EEEDEC`, accent `#F0EFEC`, muted `#F9F9F9`, destructive `#EF4444`, ring `#9C9B96`). Prefer
  shadcn tokens (`text-foreground`, `border-border`, ...); `nia-*` names are aliases plus extras
  (`nia-footer`, `nia-placeholder`, `nia-success(-bg)`). Radius scale = Figma: sm 6, md 8, lg 12,
  xl 16, 2xl 22px, buttons `rounded-full`. Font: DM Sans app-wide with `opsz 14`.
- Auth UI: `src/components/auth/` (`AuthLayout`, `AuthForm`, `AuthInput`, `GoogleButton`, ...).
  Supabase logic stays in `src/components/{login,sign-up,forgot-password,update-password}-form.tsx`.
- Email and Google sign-in links land on `/auth/confirm`; failures go to `/auth/error`.

## Progress

Live at https://nia-os-web-9ahh.vercel.app (production deploys from `main`).

Done:
- Auth screens from Figma, wired to Supabase: `/login`, `/signup`, `/forgot-password`,
  `/check-email`, `/reset-password`, plus `/auth/error`. Google sign-in, resend email,
  "Open email app" opens the user's web inbox. Old `/auth/*` pages removed.
- `/privacy` policy page (needed for Google OAuth). Company name and contact email to be confirmed.
- Google OAuth client created and published; Google provider enabled in Supabase. Sign-in verified
  working on the live site (Google + email sign-up/confirm).
- Supabase URL Configuration: Site URL `https://nia-os-web-9ahh.vercel.app`; Redirect URLs exactly
  `https://nia-os-web-9ahh.vercel.app/**` and `http://localhost:3000/**`. Use `/**` wildcards (the app
  adds `?next=`), and never point at `*-nia-technologies.vercel.app` URLs (Vercel-protected → login wall).

In progress (branch `feat/settings-profile`, not pushed):
- Top navbar app shell (replaces sidebar) and `/settings/profile` look with sample data.
- Figma theme applied to the shadcn variables.

Plan (approved 2026-10-17), one session each, full build loop per screen:
- A: Supabase schema (profiles, user_settings, workspaces/members/invites, login_events, RLS;
  SQL in `supabase/migrations`, run in the Supabase SQL editor) + connect Profile + General +
  Notifications (no Figma frame: draft it in Claude Design first).
- B: Security (password, TOTP 2FA, sessions + revoke, login history; no backup codes) +
  Shortcuts (custom key combos, reset) + Connected Apps as "coming soon" (Pinterest, IMDb,
  Cosmos, Instagram).
- C: Onboarding (frames in `796:16081`): how did you hear, import profile ("coming soon" +
  skip), username (availability check), photo (upload/crop), profession.
- D: Onboarding: workspace setup (invites stored, emails later), follow creators (sample
  creators), what to expect, all set → Home empty state (`872:42636`).
  New users are routed through onboarding until complete.

Next:
- Settings section (Figma `796:10795`): Profile, General, Connected Apps, Security, Shortcuts.
  Profile (`796:10907`) is planned and first. Decisions: the Figma top navbar replaces the shadcn
  sidebar app-wide; Apple sign-in is set up alongside Google (needs an Apple Developer account);
  assistant traits are presets you toggle plus custom ones; data goes in a `profiles` table with RLS.
- Not yet built from Figma: onboarding flow, home, projects, calendar, and the rest of the app.
