# Nia Template Thumbnails — Spline Guideline (v1)

**For:** Ika (making the images in Spline) and Claude in VS Code (building the Templates gallery).
**Companion files:** `templates.manifest.json` (every template, its ICPs, object, colours and image paths) and `thumb-safe-zones.png` (a guide image to place in the Spline frame).
**For now, thumbnails are made in Claude Design** (the "Template Thumbnails" canvas), drawn as illustrations rather than 3D renders. Same frame, zones, palettes and export name as below, so nothing in the code changes when Spline renders replace them later. Sections 3–5 describe the Spline version.
**Source of truth:** Figma. Finished thumbnails go into the Figma template card component before they go into code.

Read in order. Sections 1–6 are for making images. Sections 7–9 are for Claude in VS Code.

---

## 1. The three rules

1. **One object, taken from the work itself.** Each thumbnail shows one physical object a person in that role would actually touch while doing that template. *Test: if the object could sit on another template's card, it's the wrong object.*
2. **One recipe for everything.** Same camera, same lights, same backdrop shape, same materials library. Only the object and three colours change between thumbnails. This is what makes the gallery look like a set (the Apple Music effect).
3. **Leave room for words.** The bottom of every card carries the description and the mini map. The object lives in the upper middle and never crosses into those zones.

---

## 2. Card anatomy: what's baked in Spline vs. added in code

```
┌──────────────────────────────────────────────────────┐  16 : 11
│                                     [Use template →] │  ← hover pill (code)
│              ┌────────────────────┐                  │
│              │                    │                  │
│              │   OBJECT ZONE      │                  │  ← object (Spline)
│              │   x 22–74%         │                  │
│              │   y 8–66%          │                  │
│              └────────────────────┘                  │
│  ░░░░░░░░░░░░░░ quiet zone: y 70–100% ░░░░░░░░░░░░░░ │  ← dark fade (code)
│  One-line description, two lines max,     ┌───────┐  │  ← text (code)
│  bottom-left, white.                      │ map   │  │  ← mini map (code)
└───────────────────────────────────────────┴───────┴──┘
```

| Layer | Made in | Why |
|---|---|---|
| Backdrop gradient + object + light + floor shadow | **Spline** (one exported image) | The 3D look |
| Film grain | **Code** (SVG noise overlay) | Identical on every card; tune without re-rendering |
| Bottom dark fade | **Code** | Keeps text readable whatever the image |
| Label, name, description, mini map, hover pill | **Code** | Live data, translatable, accessible |

Don't use Spline's Noise, Vignette or Bloom effects for the final export. Grain and fade belong to the code layer, and Spline's docs don't confirm whether those effects appear in image exports.

**Square crop:** the same image is also cropped to a square for list rows and the launcher. The square is the middle 68.75% of the width, so the object must sit inside the object zone or it gets cut off. The overlay shows this.

---

## 3. The Nia recipe (identical for every thumbnail)

### Frame
- Frame mode on, frame size **1200 × 825** (16:11). Export at **2× pixel density → 2400 × 1650 PNG**. If 2× isn't offered, export the largest ratio available; the build script resizes.
- Import `thumb-safe-zones.png` as an image plane in front of the camera while composing. **Hide it before export.**

### Camera
- Perspective, **narrow field of view (~25–30°)**. A long-lens product look with little distortion.
- Camera raised **~15°** above the object, looking slightly down.
- Object rotated **−8° to −12° on Z** (the editorial tilt) and **20–30° on Y** so its depth shows.
- Never change the camera between thumbnails. Scale the object to fill the object zone instead.

### Backdrop
- A large **curved backdrop** (an infinity cove: a floor that bends up into a back wall) behind and under the object, filling the frame edge to edge.
- Gradient material, **radial**: lightest just above and behind the object, falling to darkest at the frame edges and bottom.
- Three colour stops from the template's palette family (Section 6): `light → core → deep`.
- The bottom 30% of the frame should already be the darker part of the gradient. The code fade finishes the job.

### Lights (three, always the same)
| Light | Type | Position | Colour | Notes |
|---|---|---|---|---|
| Key | Directional | Upper-left front (~45° left, ~50° up) | Warm white `#FFF6EC` | The only light that casts shadows, soft |
| Rim | Directional or point | Behind, upper-right | Family **light** stop | Draws the bright edge that separates object from backdrop |
| Fill | Ambient | — | Family **core** stop, low | Lifts the shadows; tints the scene |

- Object floats just above the floor. Soft contact shadow below, nothing hard.

### Materials (save these in the master scene as a library)
- **Tinted satin chrome** for metal: metallic, roughness ~0.25–0.35, plus a Fresnel layer in the family **light** stop.
- **Satin ceramic / frosted glass** for hard non-metal: low metalness, roughness ~0.4–0.5, light Fresnel.
- **One honest material** per object: film base, paper, card, fabric, leather. This keeps it real rather than plastic.
- **Max three materials per object.**

### No type, no branding
- **Objects carry no text, logos or Nia branding.** The object itself is the icon. Labels, clapperboards, pages and signs are blank or show abstract detail only (stripes, ruled lines, colour blocks).
- **No real brands or recognisable product designs** either (no Kodak canister livery, no Arri or RED body shapes, no iPhone). Generic, invented forms only.

### Motion (optional, featured cards only)
- Default is a **static image**. A live Spline scene is allowed for one featured card at most.
- If live: a single slow float (~7s cycle, ±6px, ±3° rotation). Nothing else moves.

---

## 4. Baseline: Template 01 · Editorial Shoot (Creative Director)

Build this first. When it's approved, it becomes the master scene for everything else.

**Object: a 35mm film canister with the film leader pulled out.**
It's the moment before an editorial shoot, and it carries the 1970s–80s 35mm direction of the whole product. It also points at the template's own steps (mood references → shot plan → call sheet).

**Palette family:** Production & Direction (teal). Stops `#A6E2DB → #2E9A93 → #052826`.

### Build steps in Spline
1. **New file** → save as `NIA_THUMB_MASTER.spline` in a team folder `Nia / Template Thumbnails`.
2. **Frame:** frame mode, 1200 × 825. Import `thumb-safe-zones.png` as a plane in front of the camera, at reduced opacity.
3. **Backdrop:** a large plane, bent or built as floor + quarter-pipe + wall so there's no visible horizon line. Apply a radial gradient material: `#A6E2DB` centre (above and behind where the canister will sit), `#2E9A93` mid, `#052826` edges.
4. **Canister body:** cylinder, height ≈ 2.8× its radius. Material: tinted satin chrome (teal Fresnel).
5. **Caps:** two slightly wider, short cylinders top and bottom, with a small bevel. Same chrome, a touch brighter.
6. **Spool knob:** small cylinder on the top cap.
7. **Label band:** a cylinder a hair wider than the body, covering the middle ~55%. Dark satin material (`#0F0E0C → #3A3A37`), **no type**. Add one thin teal stripe (`#0B7A75`) near the bottom of the band, so it reads as film stock without naming any.
8. **Film leader:** a thin strip (box, very shallow depth) coming out of the body's side, angled slightly upward, with a diagonally cut tongue at the end. Cut small rounded-rectangle **sprocket holes** along both edges (boolean subtract). Material: translucent amber film base (`#D88A3E → #8A3F12`), slight gloss.
9. **Pose:** canister upright, rotated −9° on Z and ~25° on Y so the leader points toward camera-right. Scale until it fills the object zone; the leader must stay left of the hover-pill area.
10. **Lights:** add Key, Rim and Fill exactly as in Section 3.
11. **Check against the overlay:** object inside the zone, quiet zone clear, square crop keeps the whole canister.
12. **Hide the overlay** → Export → Image → PNG → 2× → save as `t01-editorial-shoot.master.png`.

### Baseline acceptance (all must pass before rolling out)
- [ ] Reads as "35mm film" in under a second, even at 56 × 56 px (squint test)
- [ ] Nothing in the quiet zone or the mini-map corner
- [ ] Square crop keeps the whole object
- [ ] White description text is legible over the bottom of the card at 560 px wide (check in the gallery prototype)
- [ ] No text, no Nia branding, no real brand marks
- [ ] Looks right next to the current SVG stand-in in the prototype: same tilt, same light direction
- [ ] Placed into the Figma template card component and approved there

When it passes, **lock the master**: camera, lights, backdrop shape and material library don't change again without updating this guideline.

---

## 5. Rolling out from the master

For each new thumbnail:
1. **Duplicate** `NIA_THUMB_MASTER.spline` → rename to the template's slug (from the manifest).
2. **Delete the canister, build the new object** (see Section 6 and the manifest's `object` field). Reuse library materials.
3. **Change exactly three colours** to the template's palette family: backdrop gradient stops, Rim light colour, Fresnel tint.
4. Pose with the same tilt logic, fill the object zone, check against the overlay.
5. Export PNG 2× → `{slug}.master.png`.
6. Run the acceptance checklist (Section 9).

**Only make a thumbnail once the template itself exists.** Templates still marked as a gap show a plain gradient card (no object) with an "In design" label. The manifest's `status` controls this.

### Rollout order
1. **Template 01 · Editorial Shoot**: baseline (above).
2. **Production & Direction core** (most-used by covered ICPs): Call Sheet, Shotlist, Production Budget, Crew Contacts, Script Breakdown.
3. **Rest of production:** Filming Notice, Equipment Rental, Invoice, Storyboard, AV Script, Series Bible, Casting Deck, Continuity Log, Shot Logging.
4. **Creator & Content:** GRWM, Explainer, Day in My Life, Tutorial, Storytime, Product Review, Haul/Unboxing, Content Guideline.
5. **Enterprise, Brand & PR:** Press Junket Brief.
6. **Gap templates**, only as each is designed (Post-Production, Photography, Design & Art, Camera & Tech, Legal, Talent).

---

## 6. Palettes and objects across the catalogue

### Palette families (colour = who it's for)
The family comes from the template's **primary ICP category** in the ICP Mapping Strategy. Colour tells a user at a glance whether a template is for them; the object tells them what it does.

| Family | ICP categories | light | core | deep |
|---|---|---|---|---|
| **Production** (teal) | Production & Direction, Production Ops | `#A6E2DB` | `#2E9A93` | `#052826` |
| **Camera** (steel) | Camera & On-Set Tech | `#C9DCEB` | `#6C93B5` | `#0E1E2E` |
| **Creator** (ember) | Content & Digital Media | `#F6B08A` | `#E05018` | `#2A0C08` |
| **Post** (violet) | Post-Production, Music & Audio (post) | `#CDBDF0` | `#7A5BC4` | `#120A2A` |
| **Craft** (rose) | Design & Visual Arts, Styling & Wardrobe, Styling & Beauty | `#F0D6DB` | `#BE919D` | `#261A21` |
| **Photo** (aged gold) | Photography & Digital | `#F1E6C8` | `#C2AF80` | `#352D1B` |
| **Enterprise** (graphite) | Enterprise & Brand, PR & Communications, Business & Capital | `#E4E2DC` | `#9C9A93` | `#0F0E0C` |
| **Performance** (moss) | Music & Performance, talent representation | `#D3E2C2` | `#7FA36A` | `#121C0F` |

Teal, ember/violet (from the orb) and aged gold already come from Nia's brand, so the gallery feels like the product rather than a stock pack.

**Avoiding a wall of teal:** Production has the most templates. In the gallery, group cards into rows by family (like Apple Music's shelves), and within a family rotate the gradient's bright centre between three positions: upper-left, centre, upper-right. The manifest's `variant` field (`a`, `b`, `c`) sets this. Colours stay the same.

### Two kinds of template, two card sizes
- **Workflow templates** (multi-step, with a map view; e.g. Editorial Shoot) get the large featured card, 16:11, with the mini-map inset.
- **Document templates** (one artefact; e.g. Call Sheet, Shotlist) get standard cards and list rows, mostly shown as the square crop.

Same recipe and same master export for both. The code crops.

### Card headings
Every card heading is **label · title · stage**, e.g. `NEW TEMPLATE` · `Editorial Shoot` · `Pre-production`. Each template's stage is set in the manifest as the stage where it's *mainly* used. Some templates are used across stages (a call sheet is drafted in pre-production but lives on the shoot day). Review the `stage` values once before launch.

### Objects for the designed catalogue
Full list with ICPs, stage, alt text and descriptions is in `templates.manifest.json`. Summary:

| # | Template | Kind | Family | Object |
|---|---|---|---|---|
| T01 | Editorial Shoot | workflow | Production | 35mm film canister, leader pulled out |
| D01 | Call Sheet | document | Production | Aluminium clipboard with one ruled sheet (lines, no text) |
| D02 | Production Budget | document | Production | 1970s desk adding machine with a curl of paper tape |
| D03 | Crew Contacts | document | Production | Rotary card file (Rolodex-style, unbranded) |
| D04 | Invoice | document | Production | Carbon-copy invoice pad, top sheet curling up |
| D05 | Script Breakdown | document | Production | Brad-bound script with coloured index tabs |
| D06 | Shotlist | document | Production | Director's viewfinder on a neck cord |
| D07 | Filming Notice | document | Production | Small folding A-frame street sign |
| D08 | Equipment Rental | document | Production | Cine prime lens with a paper luggage tag |
| D09 | Storyboard | document | Production | Fan of three storyboard panel cards |
| D10 | AV Script | document | Production | Open booklet: frame on the left page, waveform on the right |
| D11 | Series Bible | document | Production | Thick cloth hardback with a ribbon bookmark |
| D12 | Casting Deck | document | Production | Fan of unbranded instant-film prints |
| D13 | Continuity Log | document | Production | Spiral notebook with one instant print clipped to it |
| D14 | Shot Logging | document | Production | Clapperboard slate with blank chalk fields |
| D15 | GRWM | document | Creator | Open compact mirror |
| D16 | Explainer | document | Creator | Small easel with a flip chart |
| D17 | Day in My Life | document | Creator | Twin-bell alarm clock |
| D18 | Tutorial | document | Creator | Three stacked numbered blocks, 1·2·3 |
| D19 | Storytime | document | Creator | Vintage ribbon microphone |
| D20 | Product Review | document | Creator | Magnifying glass over a small unlabelled bottle |
| D21 | Haul / Unboxing | document | Creator | Open shipping box with tissue paper spilling out |
| D22 | Content Guideline | document | Creator | Folded brand-guide booklet with a colour swatch strip |
| D23 | Press Junket Brief | document | Enterprise | Press pass on a lanyard |

The ICP doc counts **27 designed templates** but names 23 of them, with Template 01 additional. **Add the four unnamed ones to the manifest** before rolling out step 3.

### Objects reserved for gap templates (use when each template is designed)
| Family | Template → object |
|---|---|
| Camera | Lighting Plot → fresnel lamp · Power Distribution → cable reel · Camera Package List → generic cine camera body (invented form) |
| Creator | Content Calendar → flip desk calendar · Social Media Brief → tabletop tripod with an empty phone clamp · Brand Deal Tracker → paper swing tag on string |
| Post | Edit Decision List → film splicer · Post Schedule → wall planner strip · Color Brief → grading trackball · VFX Breakdown → chrome ball + grey ball pair · Sound Spotting → studio headphones · Cue Sheet → sheet-music page on a stand · Motion Brief → zoetrope |
| Photo | Photo Brief → medium-format camera (invented) · Contact Sheet → loupe on a contact sheet · Shot List (Photo) → handheld light meter · Usage License → embossed seal on a certificate · Event Brief → hot-shoe flash |
| Craft | Design Bible → fanned swatch book · Set Drawing → drafting triangle + scale rule · Prop List → tagged rotary phone · Costume Breakdown → dress form · Makeup Sheet → brush on a pigment palette · Pull Sheet → garment on a hanger with a pull tag |
| Enterprise | Contract → fountain pen · Deal Memo → folded memo with a bulldog clip · Rights Tracker → rubber stamp · NDA → sealed envelope |
| Performance | Submission Tracker → headshot in a folder · Availability Calendar → flip calendar with a ring · Deal Log → ledger book |

---

## 7. Files, naming and export pipeline (for Claude in VS Code)

### Naming
- Slugs come from the manifest (`t01-editorial-shoot`, `d01-call-sheet`, …).
- Spline export: `{slug}.master.png` (2400 × 1650).

### Where things live
```
design/thumbnails/masters/{slug}.master.png     ← Spline exports (source, committed or kept in Drive)
public/templates/{slug}-card.avif               ← 1120 × 770
public/templates/{slug}-card.webp               ← 1120 × 770 (fallback)
public/templates/{slug}-card-sm.webp            ← 560 × 385
public/templates/{slug}-square.webp             ← 512 × 512, centre crop
src/data/templates.manifest.json                ← copied from the companion file
```

### Build script
Write `scripts/build-thumbs.mjs` using `sharp`:
- For every manifest entry with a master file: produce the four outputs above. The square is a centre crop of height × height.
- Targets: card ≤ 120 KB, square ≤ 40 KB. Lower quality until under target.
- Skip entries with no master; the gallery falls back to the gradient card.
- Add `"thumbs": "node scripts/build-thumbs.mjs"` to `package.json`.

---

## 8. The gallery card in code (for Claude in VS Code)

Build to match the `TemplateCard` in the `CDWorkspace.html` prototype, using the project's own token constants. Specs:

- **Card:** aspect 16:11, radius 18, 1px border `rgba(15,14,12,.08)`, shadow `0 8px 24px rgba(15,14,12,.10)`; hover lifts 3px with `0 24px 54px rgba(15,14,12,.22)`.
- **Above the card (three lines, Apple Music style):**
  1. **Label:** small uppercase grey, from the manifest's `label`: `NEW TEMPLATE`, `UPDATED TEMPLATE` or `IN DESIGN`.
  2. **Title:** the template name, 21px, 600: `Editorial Shoot`.
  3. **Stage:** grey, 15px, from the manifest's `stage`: `Pre-production`, `Production` or `Post-production`.

  Example: `NEW TEMPLATE` / `Editorial Shoot` / `Pre-production`. ICP roles don't appear in the heading; they power filtering ("Templates for Line Producers") and the alt text.
- **Image:** `next/image` with the card AVIF/WebP. While loading, show the family gradient as the background (no blank flash). Gradient: `radial-gradient(120% 95% at {variant position} , light 0%, core ~35%, deep 100%)`.
- **Grain:** SVG `feTurbulence` fractal noise, opacity 0.16, `mix-blend-mode: overlay`, over the image.
- **Fade:** `linear-gradient(to top, rgba(8,6,4,.62) 0%, rgba(8,6,4,.18) 34%, rgba(8,6,4,0) 52%)`.
- **Description:** bottom-left, 22px in, 20px up, white 15px / 1.45, max two lines, stops 172px from the right edge on workflow cards (room for the mini map).
- **Mini map (workflow only):** bottom-right 132 × 84 glass panel drawn from the template's step data (`layoutMap` in the prototype).
- **Hover:** image scales to 1.035 over 0.5s; "Use template →" pill fades in top-right. **No floating on static images** (the backdrop is baked in, so the whole picture would move).
- **Status:** `gap` → gradient only, "In design" chip, not clickable.
- **Live Spline scene (optional, featured card only):** `@splinetool/react-spline`, dynamically imported, static image shown first and swapped when the scene loads; static only if `prefers-reduced-motion`.
- **Accessibility:** the image's `alt` comes from the manifest's `alt`; the card is a button labelled "Use the {name} template".
- **Layout:** see Section 8b (Showcase and Compact views, stage filters, search).

---

## 8b. Compact view and search (for Claude in VS Code)

Match the `TemplatesGallery` in `design/prototypes/CDWorkspace.html`.

### Page layout
1. Title, then the **search box**, then a row with **stage filter chips** on the left (`All · Pre-production · Production · Post-production`, each with a count) and the **view toggle** on the right (`Showcase` / `Compact`).
2. **Showcase view:** the large-card row of every template that isn't a gap, then an "N in design" strip of small pills for gap templates, with a "See all in compact view" button.
3. **Compact view:** every template as a small tile, in one section per palette family (Production & Direction, Creator & Content, Camera & On-Set, Post-Production, Photography, Design Styling & Craft, Enterprise Brand & PR, Talent & Performance). Each heading has a colour dot and a count.
4. The stage chips filter both views and the search results.

### Compact tile
- Grid: `repeat(auto-fill, minmax(248px, 1fr))`, 14px gap. Tile 96px tall, radius 14, 1px border.
- Background: the family **light** colour as a soft tint over white (`light` at ~40% → ~67% left to right).
- Left: name (14.5px, 600) and stage in small mono caps (`IN DESIGN` for gaps).
- Right: two stacked mini cards bleeding off the bottom edge. Behind: the family **core** colour at 32% opacity, rotated 9°. In front: the family gradient, rotated −5°, with the template's **icon** (manifest `icon`) in white at 30px. Templates with a finished thumbnail show its square crop instead of the icon.
- Hover: lift 2px, back card rotates to 12°, front card rises 4px. Gap tiles are not clickable and show the icon at 55% opacity.
- Icons: one line icon per manifest `icon` value, 24px grid, 1.6 stroke, round caps. The prototype's `GLYPHS` set covers every value in the manifest.

### Search
- One large input (56px tall, radius 16) with the placeholder *What are you making? Try "fashion editorial", "permit" or "stylist"*.
- **While typing** (2+ characters), show up to 5 suggestions: icon tile, name, stage, the first two roles, and on the right the words that matched. The first is labelled **Best match**. Arrow keys move, Enter opens the highlighted template, Esc closes. The last row is "See all results for …".
- **Results view** (Enter on that last row): the best match as a large card with "Matched on …" under it, and up to 12 more as compact tiles under "Also relevant". If the top result doesn't cover every word typed, the subtitle says these are the closest matches. If nothing matches, suggest trying a role, a deliverable or what they're shooting.
- **Ranking:** a pure function `rankTemplates(query, templates)`, so it can later be swapped for or blended with AI matching without touching the UI.
  1. Lowercase, split into words, drop stopwords (*a, the, for, my, need, make, plan, template, next, week…*).
  2. For each word, also try its singular and its **synonyms** (prototype's `SYNONYMS` map: *money → budget, invoice*; *permit → filming notice*; *fashion → editorial, pull, stylist, wardrobe*; *tiktok → grwm, creator*…).
  3. Score against the template, matching at the **start of words only** ("line" finds Line Producer, not "guideline"): name 12 · keywords 6 · roles 5 · stage/family 3 · description 2. Synonym hits count at 80%.
  4. Add +3 for live templates, +1 for designed, and +20% if every word matched. Sort by score and drop zeros.
- Search covers **all** templates, gaps included. A gap shows "In design" and can't be opened.
- Data comes from the manifest's `name`, `keywords`, `icps`, `stage`, `family`, `preview` and `object` fields. Improve results by editing `keywords` in the manifest, not the code.

### Opening a template
- `live` → the project launcher.
- `designed` → the document template editor (until that exists, a short message saying so).
- `gap` → not clickable.

## 9. Checklist for every thumbnail

- [ ] **Name test:** the object belongs to this template and no other
- [ ] **Squint test:** recognisable at 56 × 56 px
- [ ] **Zones:** inside the object zone; quiet zone and mini-map corner clear; square crop intact
- [ ] **Recipe:** master camera, three standard lights, library materials, only the three family colours changed
- [ ] **Light:** key from upper-left, rim on the right edge
- [ ] **Marks:** no text, no Nia branding, no real brands or recognisable products
- [ ] **Export:** PNG, 2400 × 1650, named `{slug}.master.png`, overlay hidden
- [ ] **In context:** dropped into the gallery and the Figma card; description legible; sits well next to its neighbours

---

### Prompt to start Claude in VS Code

> Read `TEMPLATE_THUMBNAILS.md` and `src/data/templates.manifest.json`, and open `design/prototypes/CDWorkspace.html` as the visual reference. Build the Templates gallery from Sections 7, 8 and 8b: the `build-thumbs` script; `TemplateCard` (showcase) and `CompactTile` (compact) components using our token constants; the Showcase / Compact toggle; stage filter chips; and the search box with suggestions and a results view, ranked by a separate `rankTemplates` function. Cards with no image yet use the family gradient. Gap templates show "In design" and aren't clickable. Template 01 opens the project launcher. Build it in small steps and show me each one running before moving on. Don't change any colours, sizes or copy without asking.
