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
| 1 | Sign-up email: Nia-branded email, link that works on any device, plus a 6-digit code to type in (fixes "PKCE code verifier not found") | 🔄 | Resend SMTP + templates set in Supabase (done by Ika). Waiting on Ika's phone test: new sign-up via link and via code |
| 2 | Favicon: Nia logo | ✅ | Logo saved in `design/brand/nia-logo.png` |
| 3 | Date picker on every date field, from the component library | ✅ | Project Production Info "Date" (the only date field today); new date fields must use `EditableDate` / `DateField` |
| 4 | Crop/adjust project cover and profile photo | ⬜ | Profile photo crop exists in onboarding; reuse it |
| 5 | Shared links show the project cover as the preview image and the project title as the link title | ⬜ | |
| 6 | Onboarding: profession list (scrollable, common roles first, then grouped by sector) | ⬜ | Draft in Claude Design first |
| 7 | Onboarding: "How will you use Nia?" primary use case step | ⬜ | Draft in Claude Design first |
| 8 | Collaborators end to end: invite by email or in-app (accept once), "Shared with you" on Projects, contributions, live updates and notifications | ⬜ | Needs invitation emails (Resend) and a notifications table |
| 9 | Templates gallery: search with suggestions + results view | ⬜ | Slice 2 of BUILD_PLAN 3.1 |
| 10 | Template 01 opens the project launcher | ⬜ | Slice 3 of BUILD_PLAN 3.1 |
| 10b | Template detail pop-up (like Storyflow's): family label, title, "Use this template", large preview, description, keyword chips, About, How to use (numbered steps), FAQ, Related templates, previous/next and expand buttons. Light mode only | ⬜ | Copy per template goes in the manifest; draft the layout in Claude Design first |
| 11 | Project sections (add/edit/delete), incl. References with a gallery view | ⏸ | BUILD_PLAN 3.2; Claude Design first |
| 12 | Project tabs (two projects open at once) | ⏸ | BUILD_PLAN 3.3; Claude Design first |
| 13 | Editorial Shoot workflow (map + steps) with collaboration | ⬜ | After 10 and 11 |
| 14 | Review the build history for missed features/fixes and schedule them | ⬜ | Known so far: switched-off share link returns 200; calendar range band; plan boxes 1.3–2.5 need final checks; test scripts to move into the repo |

## Done

- Favicon and app icons from the Nia logo
- Fix 1 code and email templates pushed (8bb6e52); waiting on Ika to paste the templates into Supabase

- Templates gallery slice 1 (showcase + compact views, stage filters, family shelves, build-thumbs) — 7c2e348
