# Navbar — design spec

Reference designs (Claude Design, 2026-11-08). Use them for layout, copy and motion values only. They use a
custom template format, so don't copy the markup:
- `/design-ref/navbar/NavFrosted.dc.html`: **N1**, the frosted bar. Its lower edge blurs what scrolls under it.
- `/design-ref/navbar/NavFloating.dc.html`: **N2**, the floating glass pill.
- `/design-ref/navbar/NavTinted.dc.html`: **N3**, which is N1 in dark mode with search open. It isn't a third option.

How to build is in `/NAVBAR_BUILD.md`. This file says what it looks like. Figma is the source of truth: once
Ika has reconciled the chosen variant into Figma (build step N0), the Figma frame wins wherever it disagrees
with this file.

Scope: **desktop only** (`lg`, 1024px and up). Phones and tablets keep today's top bar (round + and the
silver-glass search field) and the magnifying dock, unchanged.

---

## 1. Design values → Nia tokens

The designs use raw hex and pixel values. Pages may only use theme variables (CLAUDE.md → Design), so build
from the right-hand column. A ⚠ means the design value had to change, and the reason is in §6.

| Design value | Use | Notes |
|---|---|---|
| `#1F1F1F` text / `#E6E6E6` dark | `text-foreground` | |
| `#4D4D4D` inactive tab | `text-foreground/80` ⚠ | Not `muted-foreground`, which fails contrast on glass (§6) |
| `#6B6B6B` search hint | `text-muted-foreground` | Only on the field, which is close to opaque |
| `#8A8A8A` Inbox (coming soon) | today's coming-soon style (`text-muted-foreground opacity-60`) | Disabled, so exempt from contrast rules |
| `#005FB8` / `#3794FF` active tab text | ⚠ keep `text-foreground` | Nia Blue is for indicators, borders and tints only, never text |
| `rgba(0,95,184,.10)` active tab fill | `bg-nia-blue/15` | Today's highlight, unchanged |
| `rgba(255,255,255,.62)` bar | `glass-bar` utility (§2) | ⚠ 80% instead of 62% |
| `rgba(31,31,31,.55)` dark bar | `glass-bar` utility, dark branch | ⚠ 80% instead of 55% |
| `blur(20px) saturate(160%)` | `glass-bar` | Dark mode uses `saturate(140%)` |
| `rgba(0,0,0,.06)` bar hairline | `border-border/60` | |
| `rgba(255,255,255,.85)` field | `bg-background/95` ⚠ | So the hint text passes contrast over any photo |
| `rgba(0,0,0,.08)` field border | `border-border` | |
| `rgba(55,148,255,.55)` field while search is open | `border-nia-blue/50` | Allowed: a border |
| `0 1px 2px rgba(0,0,0,.04)` | `shadow-xs` | |
| N2 `0 8px 30px rgba(0,0,0,.08)` + inner highlight | new `--shadow-glass` token (§2) | |
| Geist 13px / 500 tabs | `text-small font-medium` | |
| Geist 14px search hint | `text-sm` | |
| 150 / 250ms, `cubic-bezier(.16,1,.3,1)` | `duration-fast` / `duration-base`, `ease-out` | Ease-out on enter. Not the design's glide curve |

## 2. New theme pieces (add to `src/app/globals.css`, nowhere else)

```css
:root {
  --nav-h: 5rem;        /* height of the top bar */
  --nav-offset: 0rem;   /* how much of the top the bar covers while the page scrolls */
  --shadow-glass: 0 8px 30px rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.8);
}
@media (width >= 64rem) {           /* lg */
  :root { --nav-h: 4rem; --nav-offset: var(--nav-h); }  /* set in build step N2, not before */
}

@utility glass-bar {
  background: color-mix(in oklab, var(--background) 80%, transparent);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
  .dark & { -webkit-backdrop-filter: blur(22px) saturate(140%); backdrop-filter: blur(22px) saturate(140%); }
  @supports not (backdrop-filter: blur(1px)) { background: var(--background); }
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    background: var(--background); -webkit-backdrop-filter: none; backdrop-filter: none;
  }
}
```

`--nav-h` is the bar's height. `--nav-offset` is how far down anything that sticks to the top of a page must
sit so the bar doesn't cover it. It stays `0` on phones and tablets, because the bar there still scrolls away.
In N2 (floating), `--nav-h` at `lg` is `4.625rem`: the 0.875rem gap above the pill plus its 3.75rem height.

## 3. Anatomy (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Home  Projects  Templates  [Explore]  Inbox │   🔍 Try ‘call sheet’        ( + )  │   (●) ▾ │
│  ← tabs, left                                │  ← search + new project, centre    │ profile │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  ░░░░░░░░ soft blur strip (only once the page has scrolled) ░░░░░░░░
```

### Bar (N1, frosted)
- `<header>`: `lg:sticky lg:top-0 z-30 h-(--nav-h)`, `glass-bar`, `border-b border-border/60`, `px-6`,
  `print:hidden`.
- Layout: `lg:grid lg:grid-cols-[minmax(max-content,1fr)_minmax(16rem,38rem)_minmax(max-content,1fr)] lg:items-center lg:gap-4`.
  The side columns never squeeze the tabs or the profile. The centre column takes the space that's left, up
  to 38rem. When the tabs fit inside their half, the search sits exactly in the middle.
- **Blur strip**: a `div` straight under the bar, `aria-hidden`, `pointer-events-none`, using the
  `nav-edge` utility below. It shows only while `data-scrolled` is on the header, fading over
  `duration-base`. Without it, content cuts off at a hard line.

```css
@utility nav-edge {                 /* globals.css, beside glass-bar */
  height: 2.25rem;
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
  mask-image: linear-gradient(to bottom, #000, transparent);
  @media (prefers-reduced-transparency: reduce) { display: none; }
}
```
- **Scrolled**: set `data-scrolled` from an `IntersectionObserver` on a 1px sentinel at the top of `<main>`.
  Don't use a scroll listener.

### Bar (N2, floating pill), only if Ika picks it
- An outer `lg:sticky lg:top-0 z-30 h-(--nav-h) px-6 pt-3.5`, holding the pill: `h-15 rounded-full glass-bar`,
  `border border-background/70` (light) or `dark:border-foreground/10`, `shadow-(--shadow-glass)`,
  `pl-4 pr-2.5`.
- Behind the pill, always on: a taller `nav-edge` (6.875rem, blur 14px, mask opaque to 40% then
  transparent, tinted with `background` at 55%). Add it as a `nav-edge-tall` utility in globals.css,
  not as values in the component.
- The + is filled (`bg-primary text-primary-foreground`), so starting a project reads as the one primary
  action.

### Tabs (left)
- Same list, routes, active-tab rule, gliding highlight, coming-soon Inbox tooltip and navigate sound as today.
- Each tab: `h-9 px-2.5 rounded-full text-small font-medium`.
  - Inactive: `text-foreground/80 hover:text-foreground`.
  - Active: `text-foreground font-semibold` over the existing gliding `bg-nia-blue/15` highlight.
- Icons: decision 2 in NAVBAR_BUILD.md. If kept, they're 16px (`size-4`, today's SVGs) with `gap-1.5`.

### Search (centre)
- One `button`, not an input: it opens the existing global search window, as today. Classes `h-11 w-full rounded-full border
  border-border bg-background/95 shadow-xs pl-4 pr-1.5`, hover `border-foreground/40`, `focus-visible:ring-3
  ring-ring/50`. While the window is open: `border-nia-blue/50`.
- Inside: Lucide `Search` (`size-4 text-muted-foreground`), then the hint (`text-sm text-muted-foreground
  truncate`): **Try ‘{idea}’**, sentence case, curly quotes. Before an idea is chosen, the hint reads
  **Search Nia**.
- Accessible name: always `aria-label="Search Nia"`, so it doesn't change with the idea.
  `aria-haspopup="dialog"`, `aria-keyshortcuts="Meta+K Control+K"`. Tooltip: "Search Nia · ⌘K"
  (Ctrl K on Windows).
- Right end, only if decision 4 says to show them: three `size-8` round ghost buttons with Lucide `Palette`,
  `ScanSearch` and `Mic` at `size-4.5`. Each is `aria-disabled`, with a tooltip "Search by colour · coming
  soon" / "Search with a picture · coming soon" / "Search by voice · coming soon". N2 separates them from
  the hint with `border-l border-border pl-1.5`.

### New project (centre, right of search)
- `Button variant="outline" size="icon"`, `size-10 rounded-full bg-background/95`, Lucide `Plus` `size-4.5`,
  `aria-label="New project"`, tooltip "New project". It's wrapped in the existing `NewProjectDialog`.
- Gap to the search: `gap-2.5`.

### Profile (right)
- The existing `UserMenu`, `justify-self-end`. Avatar 32px plus a chevron. No name on desktop (decision 6).
  The menu items, sign-out and phone bottom sheet stay unchanged.

## 4. States

| State | What changes |
|---|---|
| At the top of a page | Bar on the page background. No blur strip. |
| Scrolled | Blur strip fades in. Content passes under the glass. |
| Hover on a tab / the field | Tab text goes to `foreground`. The field border goes to `foreground/40`. |
| Keyboard focus | shadcn ring (`ring-3 ring-ring/50`) on every control. Tab order: tabs → search → + → profile. |
| Search open | The field border turns `nia-blue/50`. The search window opens under the bar (`top: calc(var(--nav-h) + 0.5rem)`), and its empty state leads with "Try, for your work" (§5). |
| Dark mode | Same recipe: `glass-bar`'s dark branch, with every token switching by itself (N3). |
| Reduced motion | No highlight glide, no strip fade, no hint swap animation. |
| Reduced transparency / more contrast | Solid `bg-background`, no blur. |
| No `backdrop-filter` support | Solid `bg-background`. |
| Print | Hidden (`print:hidden`), as today. |

## 5. The "Try" idea

- **One idea per page visit.** It changes when the page changes, and never on a timer (decision 3). A swap
  fades in over `duration-fast`, and not at all under reduced motion.
- Every idea must find something. The design's examples ("films like Sinners", "warm-palette commercials")
  are natural-language searches, and Nia's search can't answer those yet. Ideas come only from:
  1. The section's own short list (no network):
     - Home and Projects: document and template words.
     - Templates: template names.
     - Explore: tag labels.
  2. Recent searches on this device (`recentSearches()`, localStorage).
  3. Explore ideas, only for people with early access.
- Project-based ideas ("night streets, like Night Market lookbook") appear **inside the open search
  window**, because that's where project data is already loaded. Never in the bar: the bar mustn't fetch
  anything on page load (CLAUDE.md → Load data a control needs on first use).
- Copy rule: the idea is shown exactly as it would be searched. Clicking the field opens search with the box
  empty, and the idea is the first suggestion chip.

## 6. Why some design values changed

Glass sits over people's own covers and stills, which can be anything from black to white. The figures
below are for the worst case.
- **62% white bar, `#6B6B6B` text over a black photo:** contrast about 2:1. With `#4D4D4D` it's about 3.2:1.
  At 80% white with `foreground/80` tab text, it's about 5:1, a pass.
- **55% dark bar, `#BDBDBD` text over a white photo:** about 2:1. At 80% dark it's about 5:1.
- **The search field:** `muted-foreground` hint text needs the field at 95% to stay above 4.5:1 over black.
- **Blue active-tab text:** about 3.6:1 on the tint over a dark photo. It also breaks the "Nia Blue is
  indicators, borders and tints" rule, so the active tab keeps dark text on the blue tint, as today.

The bar still reads as frosted at 80%: the blur and saturation carry the effect.

## 7. Widths (check each one)

| Width | Expected |
|---|---|
| 1024 | Tabs fit. Search about 21rem. With tab icons, the search sits right of centre; that's expected. |
| 1280 | Search about 30rem. |
| 1440 | Search 35–38rem. Exactly centred if tabs are text-only, slightly right with icons. |
| 1920 | Search 38rem, centred. |
| < 1024 | Today's phone and tablet bar and dock, unchanged. |
