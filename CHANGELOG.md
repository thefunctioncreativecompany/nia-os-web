# Changelog

One or two lines for every change that touches more than one file: date, branch, files touched.
Newest first. The full story of each change is in its commit and in docs/decisions.md.

## Recent Changes

- 2026-11-15 · `feature/explore-templates-marketplace` → `main` · `20261117000000_portfolios_signed_out.sql` run: signed-out visitors refused on both portfolio tables, members and published pages unaffected (checked). Files: `CLAUDE.md`, `docs/PRODUCT_ROADMAP.md`, `CHANGELOG.md`.
- 2026-11-15 · `feature/explore-templates-marketplace` · Security audit: Zod checks on every server action; the image resizer could be pointed at any website (`/\site`) or any Supabase project, now closed, with size, pixel and redirect limits on every server-side picture download; signed-out visitors closed off the portfolio tables. Explore rows stop growing cards on wide screens (2xl, 3xl). Files: `package.json`, `package-lock.json`, `src/lib/{schemas,fetch-image}.ts` (+ tests), `src/app/api/img/…/route.ts`, `src/app/api/explore-still/…/route.ts`, `src/lib/{instagram-post,project-invite}.ts`, `src/features/explore/{credits,press}-actions.ts` (+ test), `src/features/templates/actions.ts`, `src/components/explore/{row-cell.ts,press-coverage.ts,title-card,top-ten,category-strip,creators-strip,made-in-africa-strip,epk-lanes,studio-strip}.tsx`, `src/app/globals.css`, `supabase/migrations/20261117000000_portfolios_signed_out.sql`, `docs/PRODUCT_ROADMAP.md`, `CLAUDE.md`.
- 2026-11-15 · `feature/explore-templates-marketplace` → `main` · Portfolio delete is live (migration run, 7 checks with two accounts pass); PF1 off the rough edges. Files: `docs/PRODUCT_ROADMAP.md`, `CLAUDE.md`, `CHANGELOG.md`.
- 2026-11-14 · `feature/explore-templates-marketplace` → `main` · Portfolios: deleting works (through `soft_delete_portfolio`), and a product roadmap. Files: `src/features/portfolios/portfolio-editor.tsx`, `supabase/migrations/20261116000000_portfolios_delete.sql`, `docs/PRODUCT_ROADMAP.md`, `CLAUDE.md`.
