# Templates — redesign spec (Workflows section onward)

Reference design: /design-ref/templates/Templates.dc.html (layout, copy and motion values only; do not copy markup).

Conventions: inline style objects only, no Tailwind, tokens from atoms.jsx, Geist font.

Keep the existing page **unchanged** down to and including "Suggested for you": header, search, phase chips, featured carousel and suggested row. Reuse the existing data, tile mesh gradients and Lucide icons.

Replace the row sections from "Workflows" down with:

## 1. Workflows — filmstrip (cursor scrub)
- Header: "Editorial Shoot" 26px/700, a lavender "Coming soon" pill and its description.
- Track of 6 stage cards (260×260 gradient tile, number top-left, icon, name 16px/700, one-line blurb): Vision, References, Casting, Shot plan, The day, Call sheet.
- Behaviour: cursor X inside the section maps to the track's translateX across its full overflow (1.1s cubic-bezier(.16,1,.3,1)).
- Each card's distance to the centre gives k (0–1): scale 0.86 + 0.14k, translateY (1 − k) × 24px, opacity 0.45 + 0.55k.
- Footer row: "03 / 06" counter, the focused name and a 2px progress bar.

## 2. Production Management & Operations — ranked list with hover preview
- Columns: 44px gradient tile | name (20px/700, 280px) | phase pill | description (one line, ellipsis) | hover action ("Use template →", or "Notify me →" for coming soon).
- Phase pill colours: Production #EAF4EC/#1E5B2E, Pre-production #EEF1F8/#2C3E78, Post-production #F7EEE8/#7A3A16, Coming soon #F1EFFA/#4B3B8F.
- Rows: 76px, 1px #F1F0EE dividers.
- Hover: name slides 12px right and other rows turn grey.
- A 220px gradient tile with the template's icon follows the cursor (+40, −130) and tilts with cursor speed (±8°).

## 3. Strategy & Development — filmstrip
Same component as Workflows, with 300px tiles and descriptions under each. Footer: counter, "{name} · Coming soon", progress bar.

## 4. UGC & Social Content — scrolling columns
- 5 columns, each scrolling vertically forever (duplicated list, linear, alternate columns reversed, 52/68/46/74/58s).
- Hover pauses that column and dims its other cards.
- Cards: square gradient tile + icon, name 15px/700, one-line blurb.
- Fade the top and bottom with a mask. Section height 640px.

## 5. Coming soon (31) — compact ranked list
- 3-column grid of 56px rows: number | 30px gradient tile | name 15px/600.
- Same cursor-following preview (180px) as section 2.
- "63 templates" footnote.

## Shared
- Build one `<Filmstrip>`, one `<RankedList previewFollowsCursor>` and one `<MarqueeColumns>` component, reused across sections.
- prefers-reduced-motion: static layouts (no scrub transforms, marquee or tilt).
- Throttle cursor handlers with rAF.
- Everything is a real `<a>`/`<button>` with a focus ring; focus mirrors hover.
