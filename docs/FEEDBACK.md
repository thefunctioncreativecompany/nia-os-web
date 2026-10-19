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
| 6 | Onboarding: profession list (scrollable, common roles first, then grouped by sector) | ⬜ | Draft in Claude Design first |
| 7 | Onboarding: "How will you use Nia?" primary use case step | ⬜ | Draft in Claude Design first |
| 8 | Collaborators end to end: invite by email or in-app (accept once), "Shared with you" on Projects, contributions, live updates and notifications | ⬜ | Needs invitation emails (Resend) and a notifications table |
| 5c | Black wordmark above the form on phones (sign-in and onboarding) | ✅ | |
| T | Templates rebuild from `TEMPLATES_BUILD.md` (63 templates, flat black and white, Showcase / Compact / Index, search, preview pop-up, Suggested for you, template engine, Editorial Shoot workflow). Runs before Fix 6, one build step at a time | 🔄 | Step 1 (data) in progress. Replaces 9, 10 and 10b below |
| T1 | Templates page: heading "Start from a proven path" becomes "Templates"; remove the "New template" label on cards | ⬜ | Done with build step 2 (gallery shell), which uses the large "Templates" title |
| U1 | Home: updates, notifications and inbox as swipe rows (uiarc `swipe-actions`: swipe to archive / mark read, full swipe commits) | ⏸ | Component installed in `src/components/arc/`, restyle to Nia theme; needs a notifications table (shared with Fix 8) |
| U2 | Profile menu behind the avatar (uiarc `user-menu`): name, email, Settings, Log out; bottom sheet on phones | ⏸ | Component installed; theme switch hidden (no dark mode yet) |
| 9 | Templates gallery: search with suggestions + results view | ⬜ | Now build step 4 of T |
| 10 | Template 01 opens the project launcher | ⬜ | Now build step 8 of T |
| 10b | Template detail pop-up (like Storyflow's) | ⬜ | Now build step 5 of T (layout is in the prototype; copy in the manifest's `details`) |
| 11 | Project sections (add/edit/delete), incl. References with a gallery view | ⏸ | BUILD_PLAN 3.2; Claude Design first |
| 12 | Project tabs (two projects open at once) | ⏸ | BUILD_PLAN 3.3; Claude Design first |
| 13 | Editorial Shoot workflow (map + steps) with collaboration | ⬜ | After 10 and 11 |
| 14 | Review the build history for missed features/fixes and schedule them | ⬜ | Known so far: switched-off share link returns 200; calendar range band; plan boxes 1.3–2.5 need final checks; test scripts to move into the repo |

## Done

- Favicon and app icons from the Nia logo
- Fix 1 code and email templates pushed (8bb6e52); waiting on Ika to paste the templates into Supabase

- Templates gallery slice 1 (showcase + compact views, stage filters, family shelves, build-thumbs) — 7c2e348
