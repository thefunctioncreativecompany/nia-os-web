# Explore — build spec

Reference designs (layout, copy and motion values only; custom template format, do not copy markup):
- /design-ref/explore/ExploreSoon.dc.html
- /design-ref/explore/ExploreLibrary.dc.html

Conventions: inline style objects only, no Tailwind. Tokens from atoms.jsx (add missing ones there). Figma is the source of truth. Compare is OUT OF SCOPE.

## Flag
`exploreUnlocked` (default false). Locked → `<ExploreComingSoon />`, unlocked → `<ExploreLibrary />`. The Explore pill in the top nav routes to the active state.

## Top bar (shared)
- 80px tall, 30px side padding, 1px bottom border #E2E2E2, white.
- Left: Home, Projects and Documents icon buttons (44px hit area, stroke #73726C), then the active "Explore" pill (bg #EEEDEC, 40px tall, fully rounded, 15px/500), then Inbox.
- Right: search pill (#F4F4F3, 40px, max 280px, "Search projects..."), black 36px "+" button, name 15px/500, 32px round avatar.
- Text #1F1E1D, muted #73726C.

## ExploreComingSoon
- Orbit: 14 posters on an ellipse (x radius 41%; y radius 16% → 32% as the cursor moves down).
- Motion: requestAnimationFrame rotation of 0.07°/frame + (cursorX − 0.5) × 1.2°/frame.
- Depth d = (sin θ + 1) / 2 drives:
  - scale 0.55 + 0.6d
  - opacity 0.35 + 0.65d
  - blur 2px × (1 − d)
  - saturation 0.5 + 0.5d
  - z-index d × 100
- Posters: 170px wide, aspect 268/373, radius 10px.
- Centred frosted card (white 86%, blur 16px, 1px #E2E2E2 border, radius 20px, max 470px wide), rising in on load:
  - "COMING SOON" pill with a pulsing green dot (#1FAF6E)
  - "Explore" heading, 44px/600
  - body copy: "Browse films, director's notes and electronic press kits from across Nia, then compare any two side by side. Opens February 2027."
  - buttons: "Notify me" (black pill) and "Preview Explore →" (outline pill)

## ExploreLibrary (padding 30px)
1. **Header:** "Explore All ›" 28px/600.
   - Chips: All (active = black), Most Popular, Genres, Crew, Directors, Rating. 37px tall, 1px #E2E2E2 border, fully rounded, 14px/500.
   - Right side: "Sort by: Most Popular ▾".
2. **Explore All grid:** 5 columns, 13px gap, posters aspect 268/373, radius 10px.
   - Columns shift with cursor Y (factors −50, 40, −80, 30, −45px; odd columns offset −60px; 1.2s cubic-bezier(.16,1,.3,1)).
   - Hover: lift 6px and show title/director over a bottom scrim.
3. **"By Category ›"** heading, 24px/600.
4. **Top 10 Electronic Press Kits:** 5 columns scrolling forever (duplicated list, translateY 0 → −50%, linear; alternate columns reversed; 58/74/50/82/64s).
   - Hovering a column pauses it and dims its other cards.
   - Cards: big white rank number (52px/700) and an "EPK ▶" tag, with title and director underneath.
   - Fade the top and bottom with a mask.
5. **Top 10 Director's Notes:** ranked list. Columns: Rank (32px/700) | Film (26px/600) | Director | Document (grey pill: Call Sheet, Script, Shot List, Storyboard, Lookbook, Treatment, Production Bible, Director's Notes) | "Open →" on hover.
   - Rows: 72px.
   - Hover: title slides 14px right and other rows turn grey.
   - A 200px poster preview follows the cursor (+40, −150) and tilts with cursor speed (±8°).
6. **Latest Projects:** 6 strips, 520px tall, radius 14px. The first is expanded (grow 6 vs 1); hover expands another (0.9s).
   - Collapsed strips show a vertical title.
   - Expanded strips show a "LATEST PROJECT" pill, "Step Inside the World of {Film}", "{Director}'s latest — explore behind-the-scenes breakdowns, call sheets, and production docs" and "View Project →".

## Data
- `film { id, title, director, posterUrl, stillUrl? }`
- `category { id, title, kind: 'grid'|'epk'|'notes'|'latest', items: [{ filmId, rank?, documentType? }] }`

Start with a local mock and render each section from its category.

## Motion and accessibility
- prefers-reduced-motion: no rAF loops, marquees, parallax or tilt.
- Throttle cursor handlers with rAF and cancel them on unmount.
- Real `<a>`/`<button>` elements with focus rings; focus triggers the same reveal as hover. aria-label on icon buttons.
- At phone width, chips wrap and grids stack.
