# Nia Navbar — Build Guide (start here)

**For:** Claude in VS Code, replacing the desktop top bar on every signed-in page of `nia-os-web`.
**Visual reference:** `design-ref/navbar/`, which holds three Claude Design boards and **NAVBAR_SPEC.md**
(the same designs written in Nia's tokens, with sizes, states and widths).
**Rule:** Figma is the source of truth. These designs come from Claude Design, so step N0 reconciles the
chosen one into Figma. Don't start N1 until Ika confirms it's there.

**How to work:** exactly as BUILD_PLAN.md. Take one step at a time, top to bottom. For each step:
1. Explain the plan in plain English and wait for Ika's OK.
2. Build it.
3. Run the Design check.
4. Run the Standard checks plus the step's own checks, and the don't-break list (§5).
5. Tick the box here, update CLAUDE.md → Progress, commit, push, and stop.

If something fails twice, stop, explain, and offer to revert to the last commit.

Written against commit `ead71dc` (2026-11-08). If `src/components/nia/navbar.tsx`, `nav-search.tsx` or
`src/app/(app)/layout.tsx` has changed since, re-read them and update §1 before building.

---

## 1. What's already there

| File | What it does today | Navbar work touches it? |
|---|---|---|
| `src/app/(app)/layout.tsx` | The shell for every signed-in page: `Navbar` (with `UserMenu` streamed in a `Suspense`), `<main>` (`pb-28 lg:pb-0` so the dock never covers a page's end), `NavDock`, `UpgradeDialog`, `Feedback`, `NavTrail`, `ExploreAllButton` | Yes, lightly (N2, N4) |
| `src/components/nia/navbar.tsx` | `Navbar` (80px, `h-20`, **not sticky**), `NavTabs` (desktop: icon + name, one Nia Blue highlight that glides between tabs, kept in `lastHighlight`; navigate sound on press), `NavDock`/`Dock` (phones and tablets), the `tabs` list (Inbox has `href: null`, so it's coming soon with a tooltip) | Yes (N2) |
| `src/components/nia/nav-search.tsx` | Desktop: 280px "Search Nia ⌘K" button. Phones and tablets: silver-glass field. The ⌘K / Ctrl K listener. Loads `GlobalSearch` on hover, focus or tap | Yes (N3) |
| `src/components/nia/global-search.tsx` | The search window: kinds, chips, previews, autocorrect, suggestions (recent on this device, then `POPULAR`), and Explore only with early access | Only position and suggestions (N3, N4) |
| `src/components/nia/user-menu.tsx` | Avatar menu (arc `UserMenu`), with the name beside it from 80rem | One prop (N2) |
| `src/components/projects/new-project-dialog.tsx` | Wraps both + buttons | No |
| `src/components/nia/magnifying-dock.tsx`, `.gdock` in globals.css | Phone and tablet dock | **No** |
| `src/app/globals.css` | Tokens, `glass-silver`, `.nav-search-glass` | Adds `--nav-h`, `--nav-offset`, `--shadow-glass`, `glass-bar`, `nav-edge` |
| `src/app/dev/components/_sections/patterns.tsx` | Gallery section 26, "Navigation & Account" | Adds the new bar (N5) |

### Facts the build must respect
- **The bar is 80px and scrolls away today.** Nothing has ever scrolled under it on desktop. Making it
  sticky is the riskiest part of this work, so N1 prepares for it before anything changes visually.
- **These places assume the bar is 5rem tall** (full-height screens):
  - `src/app/(app)/explore/layout.tsx`: the loading fallback.
  - `src/components/explore/library-canvas.tsx`: Explore all canvas.
  - `src/components/explore/explore-coming-soon.tsx`
  - `src/components/explore/timeline/timeline-view.tsx`: `lg:h-[calc(100svh-5rem)]`. Phones use `100svh-12rem`, which is the bar's 5rem plus 7rem for the dock.
  - `src/components/explore/timeline/timeline-locked.tsx`: the same pair.
  - `src/app/(app)/explore/all/timeline/page.tsx`: the `100svh-7rem` skeleton. Check it against the view.
- **These stick to the top of the page and would slide under a sticky bar:**
  - `src/components/home/activity-page.tsx`: the month bar, `sticky top-0`. Its `jumpTo` also scrolls with a fixed `- 150` offset.
  - `src/features/templates/engine/section-outline.tsx`: `sticky top-3`. Its section headings use `scroll-mt-20` (`template-editor.tsx`).
  - `src/features/templates/engine/template-editor.tsx`: side column, `md:sticky md:top-6`.
- **Jump-to links that land under the bar:** `scroll-mt-24` on Explore categories, the film hero and project references is fine (6rem is more than 4rem). `press-kit-body.tsx` uses `scroll-mt-6` but scrolls inside the press-kit window, so the bar doesn't cover it. Check it on the title and film pages too.
- **Layer order:** the new bar goes at `z-30`. The dock, Feedback and Explore all buttons are `z-40`, dialogs (including global search) `z-50`, and the user-menu panel `z-60`. Don't raise the bar above 30.
- **Pages without the shell keep no navbar:** sign-in pages, onboarding, `/share/[token]`, `/privacy`, `/dev/*`.
- **Things that must keep working:**
  - ⌘K / Ctrl K, and global search loading only on hover, focus or tap.
  - The navigate sound.
  - The gliding highlight, which survives page changes.
  - The Inbox coming-soon tooltip.
  - The `Suspense` around the tabs (the active tab is only known at request time).
  - `print:hidden`.
  - Dark mode following the device (Settings overrides it).
  - The Explore access gate.

---

## 2. What changes, and what doesn't

**Changes (desktop, 1024px and up):**
- A 64px frosted bar that stays at the top. Pages scroll softly under it.
- Three zones: tabs on the left; a wide search with a round + in the centre; the avatar on the right.
- The search hint suggests something to try from the person's own work, one idea per page visit.
- A round + (outline in N1, filled in N2).
- The search window opens just under the bar.
- Dark mode: the same recipe in dark tokens.

**Doesn't change:**
- The tabs, routes and active-tab rule.
- Sounds, ⌘K, and how global search works.
- New Project, the user-menu items and sign-out.
- **Phones and tablets**: the top bar, the dock, the `pb-28` room for it.
- Feedback and Explore all buttons, the upgrade dialog, the Explore gate, printing.

---

## 3. Decisions for Ika (step N0)

Each one has a recommendation. Log the answers in `docs/decisions.md` (dated) before N1.

1. **N1 frosted bar or N2 floating pill?** N3 is N1's dark mode with search open, not a third option.
   *Recommend N1.* It has no strip of page showing above the bar, it's simpler beside the full-height Explore
   canvas, and it's one less shape to maintain. The component takes `variant: "bar" | "floating"` so N2 can
   be switched to later, but only one ships.
2. **Tab icons.** The 2026-10-20 decision is icon + name on every tab, but the designs show names only.
   *Recommend keeping icons* until people know their way. The cost: between 1024 and 1440 wide, the search
   sits a little right of centre (NAVBAR_SPEC §7). Dropping them is a new dated decision.
3. **The "Try" idea changes every 3 seconds in N1.** That's a looping animation, which the rules only allow
   for "still working" indicators. *Recommend a new idea each time the page changes, with no timer.* The
   alternative is a timer that stops when the bar is touched, the browser tab is hidden or reduced motion is
   on, and it needs a written exception in decisions.md.
4. **Colour, picture and voice search don't exist yet.** The rule is that anything not working is greyed out
   with a note, but a note line doesn't fit in a 44px field. *Recommend leaving the three buttons out* until
   a step builds them. Otherwise, show them disabled with a "· coming soon" tooltip, like Inbox.
5. **The ⌘K label.** The designs drop the `⌘K` key label. *Recommend keeping the shortcut, dropping the
   label, and showing it in the field's tooltip.*
6. **Name beside the avatar.** The designs show only the avatar and a chevron. *Recommend no name on
   desktop.* The tabs already carry their names, and it gives the search about 7rem.
7. **What opens when you click search.** N3 draws a small "Try, for your work" panel. *Recommend keeping the
   existing search window* (it does everything that panel does, and more, and it's tested). Move it to open
   just under the bar, and lead its empty state with the "Try" ideas. Don't build a second search.
8. **Design values that fail contrast.** The glass at 62% and 55%, blue tab text, and grey tab text all fail
   contrast over people's own covers (NAVBAR_SPEC §6). *Recommend the adjusted values in the spec.* Ika
   confirms they still look right in Figma.
9. **Reconcile into Figma.** Ika puts the chosen variant (light, dark and search open) into Figma, and the
   node IDs go in the N0 box below.

---

## 4. Steps

- [ ] **N0 — Decisions and Figma.** Ika answers §3, the answers go into `docs/decisions.md`, and the Figma
  node IDs go here: light `____`, dark `____`, search open `____`. No code.
  *Decisions logged 2026-11-08 (all as recommended). Waiting for the Figma frames; Ika said to go ahead
  with the build meanwhile (2026-11-08). N1 changes nothing visible; N2 needs the frames.*

- [x] **N1 — Make pages ready for a sticky bar (nothing visible changes).** *Done 2026-11-08: before
  and after screenshots at 1440 and 375 identical (the timeline differed only by the minute that passed;
  the test account has no project, so the project page wasn't shot; none of its parts changed).*
  - Add `--nav-h: 5rem` and `--nav-offset: 0rem` to `:root` in globals.css (NAVBAR_SPEC §2). Don't add the
    `lg` override yet.
  - Navbar `h-20` → `h-(--nav-h)`.
  - Replace every `5rem` in §1's full-height list with `var(--nav-h)`: for example
    `lg:h-[calc(100svh-var(--nav-h))]`, and on phones `h-[calc(100svh-var(--nav-h)-7rem)]`.
  - Sticky parts:
    - Activity month bar `top-0` → `top-(--nav-offset)`.
    - Section outline `top-3` → `top-[calc(var(--nav-offset)+0.75rem)]`.
    - Editor side column `md:top-6` → `md:top-[calc(var(--nav-offset)+1.5rem)]`.
    - Section headings `scroll-mt-20` → `scroll-mt-[calc(var(--nav-offset)+5rem)]`.
  - `activity-page.tsx` `jumpTo`: read `--nav-offset` (from `getComputedStyle(document.documentElement)`)
    and add it to the 150.
  - *Checks:* screenshots before and after at 1440 and 375 of `/home`, `/home/activity`, `/projects`, a
    project page, `/templates`, a template with the section outline (`/templates/D07`), `/explore`,
    `/explore/all`, `/explore/all/timeline` and a title page. They must be pixel-identical. `npm run build`,
    `npm run lint` and `npm test` pass.

- [x] **N2 — The new bar (desktop).** *Done 2026-11-08 from the Claude Design boards Ika linked (N1 frosted,
  N3 dark with search open); Figma frames still to reconcile. Phones and tablets pixel-identical; Explore all and
  the timeline fill the screen; the activity month bar sticks under the bar; light and dark checked. The avatar
  has no chevron: uiarc shows it only with the name.*
  - In globals.css:
    - The `lg` override: `--nav-h: 4rem; --nav-offset: var(--nav-h)`. For N2 floating, `--nav-h` is `4.625rem`.
    - Add `--shadow-glass` and the `glass-bar` and `nav-edge` utilities.
  - `navbar.tsx`:
    - Header classes per NAVBAR_SPEC §3: `lg:sticky lg:top-0 z-30`, `glass-bar`, the three-column `lg:grid`,
      `px-6`.
    - Below `lg`, keep every class it has today. Phones and tablets must not change.
    - Add `variant?: "bar" | "floating"` (default from decision 1).
  - Tabs restyle: size, text colours, icons per decision 2. **Keep** the glide code, `lastHighlight`, the
    sound handlers, the Inbox tooltip and the `Suspense` fallback.
  - Blur strip: a sentinel `div` at the top of `<main>` in `(app)/layout.tsx`, plus a small client hook
    (`useScrolled`, an `IntersectionObserver`) that sets `data-scrolled` on the header. Only render the
    strip when scrolled.
  - Profile: `UserMenu` gets `showName={false}` on desktop (decision 6).
  - *Checks:*
    - The widths in NAVBAR_SPEC §7, in light and dark.
    - A page with a black cover and one with a white cover scrolled under the bar: tab text stays readable (§6).
    - Explore all canvas fills the screen exactly, with no page scrollbar.
    - The timeline fits.
    - The activity month bar and the template outline sit just under the bar.

- [x] **N3 — Search and + in the middle.** *Done 2026-11-08 with N2: 38rem pill (558px at 1280 and up, 406px
  at 1024), tooltip "Search Nia · ⌘K", round outline +, search window opens under the bar. Tab order checked:
  tabs → search → + → profile. No colour, picture or voice buttons (decision 4).*
  - `nav-search.tsx`, desktop button only:
    - The pill per NAVBAR_SPEC §3 (`h-11 w-full`, `bg-background/95`).
    - The hint, `Search Nia` until an idea is picked.
    - `aria-label="Search Nia"`, `aria-keyshortcuts`, and the tooltip "Search Nia · ⌘K".
    - The ⌘K label goes (decision 5).
    - `border-nia-blue/50` while `open`.
  - The phone/tablet field and the ⌘K listener stay as they are.
  - The desktop + becomes a round `Button variant="outline" size="icon"` (N2: filled), still inside
    `NewProjectDialog`. The phone + is untouched.
  - Colour, picture and voice buttons only if decision 4 says so, all `aria-disabled` with tooltips.
  - `global-search.tsx`: on desktop, `top-[12svh]` → `lg:top-[calc(var(--nav-h)+0.5rem)]`. Don't change
    anything else in it in this step.
  - *Checks:*
    - ⌘K and Ctrl K open search from every page, including when focus is in a field.
    - Search still loads only on hover, focus or tap: no request on page load in the Network tab.
    - Esc closes it and focus returns to the field.
    - Tab order: tabs → search → + → profile.

- [x] **N4 — "Try" ideas.** (2026-11-10)
  - New `src/features/navbar/try-ideas.ts`, plain functions only:
    - `SECTION_IDEAS`, short lists: Home and Projects (document and template words such as "Call sheet",
      "Shotlist", "Production budget", "Invoice"), Templates (template names), and Explore (tag labels from
      `src/features/explore/tags.ts`).
    - `pickIdea({ section, recent, exploreAccess, visit })`. It takes the section's list, adds up to three
      recent searches, adds Explore ideas only if `exploreAccess`, removes duplicates (`norm` from
      `src/lib/search.ts`), and picks by `visit`.
    - Move `POPULAR` out of global-search into this file, so both share one list.
  - New `try-ideas.test.ts`. It checks:
    - No Explore idea without access.
    - Duplicates are removed.
    - The idea changes as `visit` goes up.
    - It falls back to the section list when there are no recent searches.
    - Every Explore idea is a real tag (`isTag`). This stops ideas that find nothing.
  - Explore access in the bar: in `(app)/layout.tsx`, `NavbarUser` loads `getCurrentUser()` and
    `hasExploreAccess()` together (`Promise.all`; it's cached per request and already runs on Explore pages).
    It passes the result to a tiny client store that `NavSearch` reads. It's streamed, so it never holds up
    the page.
  - `NavSearch`:
    - Picks the idea after the page loads (it uses localStorage, so the server can't know it).
    - Counts page changes in `sessionStorage` for `visit`.
    - Swaps the hint with a `duration-fast` fade, and with no fade under reduced motion.
  - Global search's empty state leads with **Try, for your work**: the current idea, then ideas from the
    person's projects, which it has already loaded. The recent and popular rows follow, as today.
  - *Checks:*
    - An account without Explore access never sees an Explore idea.
    - Every idea shown finds at least one result.
    - No new network request on page load.
    - `npm test` passes.

- [ ] **N5 — Finish.**
  - Check the fallbacks: reduced transparency, more contrast, no `backdrop-filter` (Firefox with
    `layout.css.backdrop-filter.enabled` off), and print.
  - Add the new bar (both variants, light and dark) to the gallery, section 26 in `patterns.tsx`.
  - Update `docs/decisions.md` (what shipped and why each design value changed), the CLAUDE.md Design
    rules (bar height token, `glass-bar`), and Progress.
  - This isn't a new feature, so no `UPDATES` entry unless Ika wants one.

- [ ] **N6 — Full check, then ship.** Before pushing, tag the last commit before N2 (`pre-navbar-2026-11`), so
  going back is one command. Run all of §5 on localhost, then on the live site, with both test accounts (one
  with Explore access, one without).

---

## 5. Don't-break list (run after every step from N1)

**Navigation**
- [ ] Each tab goes to its page, and the active tab is right on every route, including `/settings/*` and
  `/plans` (they show Home).
- [ ] The highlight glides between tabs. It doesn't glide under reduced motion, and it's re-placed on resize.
- [ ] Inbox can't be chosen and shows "Inbox · coming soon" on hover and focus.
- [ ] The navigate sound plays once per change, on press for pointers and on Enter for keys.
- [ ] Back links (`BackLink` / `NavTrail`) still step back.

**Search**
- [ ] ⌘K / Ctrl K, the desktop field and the phone field all open global search.
- [ ] Search loads only on hover, focus or tap.
- [ ] Results, chips, autocorrect and previews behave as before.
- [ ] Explore results appear only for early-access accounts.

**Actions**
- [ ] + opens New Project on desktop and phone, and creating a project still works.
- [ ] The avatar menu opens above the bar with all items: Profile, Settings, Plans, Take the tour, Send
  feedback, Log out. Log out works.

**Layout**
- [ ] Explore all canvas, Explore coming soon, the timeline and the timeline-locked note fill the screen
  exactly at 1440×900 and 1280×720, with no page scrollbar and nothing hidden under the bar.
- [ ] The activity month bar, the template section outline and the editor side column stick just under the
  bar, and their jump links land with the heading visible.
- [ ] Dialogs, the upgrade prompt, toasts, Feedback, Explore all and the welcome tour sit above the bar.
- [ ] No layout shift when the user menu or the "Try" idea streams in (check CLS in Lighthouse).

**Phones and tablets (375, 768)**
- [ ] The top bar, dock, round + and search field look and work exactly as before, and the bar scrolls away
  as before.
- [ ] The dock never covers a page's end.

**Themes and access**
- [ ] Light, dark and "Match my device". Dark never flashes white on load.
- [ ] Keyboard only: every control is reachable with the shadcn focus ring. Screen reader: "Main" navigation,
  "Search Nia" button, "New project" button.
- [ ] Contrast checks from NAVBAR_SPEC §6 over a black and a white cover.
- [ ] Reduced motion, reduced transparency and print.

**Pages without the shell**
- [ ] Sign in, sign up, onboarding, `/share/[token]` and `/privacy` show no navbar, as before.

**Build**
- [ ] `npm run build`, `npm run lint` and `npm test` pass, and the browser console is clean.

---

## 6. If something goes wrong

- Most risk is in N2 (sticky). If a page breaks there, the fastest fix is setting `--nav-offset: 0rem` at
  `lg` and removing `lg:sticky`: the bar goes back to scrolling away, and nothing else needs undoing.
- To go back entirely: `git revert` the navbar commits, or reset to the `pre-navbar-2026-11` tag. N1 is safe
  to keep either way.
