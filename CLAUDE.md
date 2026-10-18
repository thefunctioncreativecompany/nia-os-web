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

- App shell: Figma top navbar (replaces the shadcn sidebar), placeholder `/dashboard`, Figma theme
  mapped onto the shadcn variables.
- Settings → Profile and General, saving to Supabase (photo upload, linked Google account, workspace
  name, preferences). Other tabs show as disabled.
- Onboarding (Figma `796:16081`), nine steps under `/onboarding/*`, each saving on Continue: how did
  you hear, import (platforms "coming soon"), username (live availability check), photo (upload +
  crop/zoom/rotate), profession, workspace (invites stored, emails not sent yet), follow sample
  creators, what you can do, all set. The proxy sends users to onboarding until they finish
  (`onboarded` flag in user metadata, falling back to `profiles.onboarding_completed_at`); accounts
  created before 2026-10-18 skip it. Auth and onboarding share the crossfading hero slideshow.
- Supabase migrations run in the SQL editor: `20261018000000_profiles_settings_workspaces.sql`,
  `20261019000000_onboarding.sql`. Pending: `20261019010000_avatar_cleanup.sql` (old photos aren't
  deleted until it's run).
- Tested end to end with the test account (credentials in `.env.local` as `TEST_USER_*`; scripts sign
  in headlessly): every onboarding step persists after a fresh sign-in, and RLS limits it to its own
  profile, settings, workspace, invites and avatar folder.
- Session checks call `await connection()` first (Supabase reads `Date.now()`), so partial
  prefetching doesn't hit the "unstable value" prerender error.

Next (one session each, full build loop per screen):
- Home empty state (Figma `872:42636` / `1021:754`); "Go to Dashboard" lands on the placeholder.
- Settings: Notifications (Claude Design draft awaiting approval; data in
  `user_settings.notification_preferences`), Security (password, TOTP 2FA, sessions + revoke, login
  history; no backup codes), Shortcuts (custom key combos, reset), Connected Apps "coming soon"
  (Pinterest, IMDb, Cosmos, Instagram).
- Apple sign-in alongside Google (needs an Apple Developer account).
- Open questions: keep the slideshow on login/sign-up or onboarding only; keep the low-res Black
  Panther slide; confirm caption years; "Explore templates" target.
- Not yet built from Figma: home, projects, calendar, and the rest of the app.
