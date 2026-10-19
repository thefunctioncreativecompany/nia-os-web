# Nia Templates — Build Guide (start here)

**For:** Claude in VS Code, building the Templates feature in the main app (`nia-os-web`, Next.js + Supabase).
**Visual reference:** `design/prototypes/CDWorkspace.html`. Open it in a browser; everything below works there.
**Rule:** Figma is the source of truth for how things look. Anything designed outside Figma (gallery views, preview modal, Suggested for you) gets reconciled back into Figma before or as it ships.

---

## 1. What's already in the repo

| File | What it is |
|---|---|
| `src/data/templates.manifest.json` | Every template (63): name, product code (`sku`), stage, roles (`icps`), group, tags, icon, keywords, `related` (3), preview-modal copy (`details`), Figma frame IDs |
| `src/data/template-schemas.json` | The 31 document templates' sections, for the template engine (extracted from the prototype) |
| `src/features/templates/types.ts` | TypeScript types for all of the above, plus personalisation types |
| `src/features/templates/catalog.ts` | Loads the manifest and schemas; `getTemplate`, `getSchema`, `templateCount`, `isOpenable` |
| `src/features/templates/search.ts` | `rankTemplates(query, catalog)`: plain-language search with synonyms and word-boundary matching |
| `src/features/templates/recommend.ts` | `suggestTemplates(catalog, profile)` for "Suggested for you"; `relatedTemplates()` for the modal |
| `src/features/templates/events.ts` | Supabase calls: record events, load a profile, set the role, reset history |
| `src/features/templates/recommend.test.ts` | 7 tests for search and suggestions (`npm i -D vitest`, then `npx vitest run`) |
| `supabase/migrations/20261021000000_templates.sql` | `template_events`, `documents` (project access + soft delete), `template_requests`, all with row-level security. The role is `profiles.profession` (onboarding); the `document-images` bucket comes with the storyboard step |
| `TEMPLATE_ENGINE.md` | How to build the 31 document templates from one editor |
| `TEMPLATE_THUMBNAILS.md` | Thumbnail style (Section 0: flat black and white) |

`types.ts`, `search.ts` and `recommend.ts` type-check under `strict` and pass their tests. The migration has been run twice against Postgres without errors.

---

## 2. What we're building

**Templates gallery** (`/templates`)
- Large **Templates** title, then the search box: `Search {n} templates` (n = `templateCount()`, so it grows on its own).
- Filter chips: All · Pre-production · Production · Post-production · Administrative · Camera & Visual (with counts).
- View toggle: **Showcase** (large cards) · **Compact** (small tiles grouped by Figma group) · **Index** (black icons on white with product codes).
- **Suggested for you** under the Showcase row, replacing the old "in design" strip (§4).

**Preview modal** for every template (§5), with a **Related templates** section.

**Template editor**: the 31 document templates from `TEMPLATE_ENGINE.md`.

**Editorial Shoot workflow** (T01): launcher → project workspace with Map and List views (prototype `ProjectWorkspace`).

---

## 3. Structure

### Routes (App Router)
```
/templates                       gallery (?view=showcase|compact|index &stage=… &q=…)
/templates?preview=D01           same page with the preview modal open (shareable link)
/templates/[code]/new            "Use this template": creates a document draft (or the T01 launcher) and redirects
/documents/[docId]               template editor for a saved document
/projects/[projectId]/workspace  Editorial Shoot workspace (Map / List)
```
Keep the modal in the URL (`?preview=`) so Back closes it and links can be shared.

### Components
```
src/features/templates/components/
  TemplatesPage.tsx       title, search, chips, toggle, views, suggestions, modal
  TemplateSearch.tsx      input + suggestion dropdown (uses search.ts)
  FilterChips.tsx · ViewToggle.tsx
  TemplateCard.tsx        showcase card (flat): click → preview; hover pill "Use template"
  CompactTile.tsx · IndexItem.tsx
  SuggestedForYou.tsx     SuggestTile + RolePicker + "Reset what Nia learned"
  PreviewModal.tsx        header, DocMiniature / workflow map, description, tags, About, How to use, FAQ, Related
  DocMiniature.tsx        miniature of the real editor, drawn from the template's schema
  FlatIcon.tsx            the GLYPHS line icons (copy from the prototype)
  useHoverIntent.ts       open the preview after 800 ms of hover (desktop only)
```
Load the manifest in a **server component** and pass only what each view needs to the client, since the full manifest is large.

---

## 4. Personalisation: how Nia learns a person's workflow

**Signals** (written with `recordTemplateEvent`, fire-and-forget):

| Event | When |
|---|---|
| `view` | Preview modal opened (click or hover) |
| `use` | "Use this template" (document draft created / workflow launched) |
| `complete` | A document reaches `ready`, or a workflow's steps are all complete |
| `search` | A search is committed (store the query, for future tuning) |

**Role (ICP):** chosen at onboarding and changeable from the gallery ("I work as …"). Stored on `profiles.profession` (`profiles.role` is the Settings job title).

**Ranking** (`recommend.ts`, tested):
- Made for their role **+6**; related to one of their role's templates **+3**.
- Goes with a template they've used **+4 × w** (or +2 × w the other way round).
- Next production stage in the same group **+1.5 × w**.
- Viewed a lot already **−1.5 × w**. Used in the last 3 days: hidden (it's in their projects).
- `w` = event weight (view 1, use 3, complete 5) halved every 14 days, capped at 1.5. History counts half for templates outside their role.
- Cold start: their role's templates, then the starter set (Editorial Shoot, Call Sheet, Shotlist, Crew Contact List, Production Budget, GRWM).
- Each suggestion shows **why**: "Popular with Creative Directors", "Goes with Invoice", "Next after Shotlist".

**Privacy:** people only ever read their own events (row-level security). "Reset what Nia learned" deletes their history (`clearTemplateHistory`). v1 uses no other users' data.

**Later:** true "popular with {role}" from anonymised counts across all users (a nightly materialised view), suggestions on Home and in project sidebars, and an AI re-ranker on top of `suggestTemplates` (it stays the fallback).

---

## 5. Preview modal

- **Opens** on click or tap of any card, tile, index item, suggestion or search result, or after **800 ms of hover** on desktop. Not on touch. Hover won't reopen it for 1.5 s after closing.
- **Top bar:** expand/shrink · previous/next (← → keys) within the list it was opened from · close (Esc, or click outside).
- **Content, in order:**
  1. Group and product code.
  2. Large title.
  3. "Nia · Official template · {stage}" and the **Use this template** button (gap templates: disabled "In design").
  4. Preview panel: `DocMiniature` (documents) or the workflow map (T01).
  5. Description and keyword tags.
  6. **About this template** · **How to use the {name}** (numbered) · **Frequently asked questions**, all from `details`.
  7. **Related templates**: 3 cards from `related`; clicking one swaps the modal to it.
- **Use this template** records `use` and goes to `/templates/[code]/new`.
- All copy lives in the manifest's `details`, so it can be edited without code changes.

---

## 6. Visual style

Flat black and white (`TEMPLATE_THUMBNAILS.md` Section 0): black `#0A0908` line icons on white, no gradients or 3D. In the Templates area, accents are black too (selected chip, primary buttons, focus rings, checkboxes); the Editorial Shoot workspace keeps its existing tokens.

---

## 7. Build order (show each step running before the next)

1. **Data:** copy the files from §1 into place; run the migration (paste its contents into the Supabase SQL Editor); `npm test` passes.
2. **Gallery shell:** title, search box with the live count, filter chips, view toggle, Showcase cards.
3. **Compact and Index views.**
4. **Search:** dropdown suggestions (top 5, Best match, matched words), results view, closest-match message.
5. **Preview modal** with hover intent, keyboard navigation, related templates, `?preview=` in the URL.
6. **Personalisation:** load the profile, record events, Suggested for you, role picker, reset.
7. **Template engine:** `TEMPLATE_ENGINE.md` §8, starting with Filming Notice.
8. **Editorial Shoot workflow:** launcher, workspace Map / List (from the prototype).
9. **Request a template** ("Can't find what you need?", from Figma Browse All): saves to `template_requests`.

---

## 8. Acceptance checklist

- [ ] Search box reads "Search 63 templates" and updates when the manifest changes
- [ ] Each view and filter combination shows the right templates; gap templates show "In design"
- [ ] Hover 0.8 s or click opens the preview; Esc and ← → work; Back closes it
- [ ] Related cards open the related template in the modal
- [ ] "Use this template" opens the editor (documents) or the launcher (T01) and records `use`
- [ ] Opening and using templates changes Suggested for you, each with a reason
- [ ] Changing the role changes suggestions straight away
- [ ] "Reset what Nia learned" empties history and suggestions fall back to role and starters
- [ ] Another user can't read your events or documents
- [ ] Works at phone width: modal goes full-screen, grids reflow, no hover-only actions

---

## 9. Open decisions (ask Ika)

1. **Hover-to-preview delay** (800 ms): keep, shorten, or click-only?
2. **Gallery in Figma:** Showcase/Compact/Index, Suggested for you and the preview modal need adding to Figma.
3. **Production Budget:** ATL/BTL (used) or the tiered "Budget Framework"?
4. **Black vs teal** for the rest of the app.

---

### Prompt to start Claude in VS Code

> Read `TEMPLATES_BUILD.md` first, then `TEMPLATE_ENGINE.md` and `TEMPLATE_THUMBNAILS.md` Section 0. Open `design/prototypes/CDWorkspace.html` as the visual and behavioural reference. Use the existing modules in `src/features/templates/` (types, catalog, search, recommend, events) rather than rewriting them, and run `supabase/migrations/20261019000000_templates.sql`. Build in the order of Section 7, one step at a time, and show me each step running before moving on. Check against Section 8. Ask me about Section 9 when you reach those points, and before changing any colours, sizes or copy.
