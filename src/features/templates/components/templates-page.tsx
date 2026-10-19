"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { rankTemplates } from "@/features/templates/search";
import { FILTERS, inFilter, type Filter, type GalleryTemplate } from "@/features/templates/gallery";
import { CompactTile } from "@/features/templates/components/compact-tile";
import { TemplateCard } from "@/features/templates/components/template-card";
import { TemplateSearch } from "@/features/templates/components/template-search";
import { PreviewModal } from "@/features/templates/components/preview-modal";
import { SuggestedForYou } from "@/features/templates/components/suggested-for-you";
import { CategoryRows, SuggestedRow } from "@/features/templates/components/showcase-rows";
import { useTemplateProfile } from "@/features/templates/use-template-profile";

const compactGrid = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,15.5rem),1fr))] gap-3.5";

// The Templates page (TEMPLATES_BUILD.md §2, build steps 2–6): title, search with the live
// template count and suggestions, filters, one view and the preview pop-up. Phones lead with
// the suggested templates; larger screens show the featured row and "Suggested for you"
// (it learns from what is opened, used and searched here). Every screen then lists all
// templates by category. Compact and Index views were retired (Ika) and live on in the
// component library. The pop-up lives in the address (?preview=D01), so Back closes it.
export function TemplatesPage({ templates, groups, familyLabels, editable }: { templates: GalleryTemplate[]; groups: string[]; familyLabels: Record<string, string>; editable: string[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const row = useRef<HTMLDivElement>(null);
  const learning = useTemplateProfile();

  // Using a template: documents whose sections the editor can show open in it (build step 7,
  // `editable`); the launcher (workflows) and the other documents come in later steps.
  const use = (t: GalleryTemplate) => {
    if (t.status === "live") learning.record(t.code, "use");
    if (editable.includes(t.code)) return router.push(`/templates/${t.code}`);
    toast(t.kind === "workflow" ? "The project launcher comes in a later build step." : `${t.name} opens in the document editor, which is coming soon.`);
  };

  // The pop-up steps through the list it was opened from (a shelf, the results, the row).
  const [previewList, setPreviewList] = useState<GalleryTemplate[]>(templates);
  const pushed = useRef(false);
  const quietUntil = useRef(0);
  const openPreview = (t: GalleryTemplate, list: GalleryTemplate[], viaHover = false) => {
    const showing = new URLSearchParams(window.location.search).has("preview");
    // Hover never replaces an open pop-up, and waits 1.5s after one closes.
    if (viaHover && (showing || Date.now() < quietUntil.current)) return;
    setPreviewList(list);
    const url = new URL(window.location.href);
    url.searchParams.set("preview", t.code);
    if (showing) window.history.replaceState(null, "", url);
    else {
      window.history.pushState(null, "", url);
      pushed.current = true;
    }
  };
  const navigatePreview = (t: GalleryTemplate) => {
    const url = new URL(window.location.href);
    url.searchParams.set("preview", t.code);
    window.history.replaceState(null, "", url);
  };
  const closePreview = () => {
    quietUntil.current = Date.now() + 1500;
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("preview");
      window.history.replaceState(null, "", url);
    }
  };

  const visible = templates.filter((t) => inFilter(t, filter));
  const featured = visible.filter((t) => t.status !== "gap");
  const results = committed ? rankTemplates(committed, templates, familyLabels).filter((r) => inFilter(r.template, filter)) : null;
  const nudge = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * Math.min(584, el.clientWidth - 80), behavior: "smooth" });
  };
  const clear = () => {
    setQuery("");
    setCommitted("");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col pt-10 pb-18">
      <div className="flex flex-col gap-4.5 px-4 md:px-11">
        <h1 className="text-display font-extrabold tracking-tight text-foreground">Templates</h1>

        <TemplateSearch
          templates={templates}
          familyLabels={familyLabels}
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            if (!next) setCommitted("");
          }}
          onCommit={(q) => {
            setCommitted(q);
            // Searches are kept (with the best match) to tune search later; they don't change suggestions.
            if (q) learning.record(rankTemplates(q, templates, familyLabels)[0]?.template.code ?? "", "search", q);
          }}
          onPick={(t) => openPreview(t, rankTemplates(query, templates, familyLabels).map((r) => r.template))}
        />

        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <FilterChips templates={templates} filter={filter} onChange={setFilter} />
          {!results && (
            <div className="flex items-center gap-2 max-md:hidden">
              <Button variant="outline" size="icon-sm" aria-label="Previous templates" onClick={() => nudge(-1)}><ChevronLeft /></Button>
              <Button variant="outline" size="icon-sm" aria-label="Next templates" onClick={() => nudge(1)}><ChevronRight /></Button>
            </div>
          )}
        </div>
      </div>

      {results ? (
        <section aria-labelledby="results" className="px-4 pt-7.5 md:px-11">
          <div className="mb-4.5 flex items-start justify-between gap-3">
            <div>
              <h2 id="results" className="text-lg font-extrabold text-foreground">Results for &ldquo;{committed}&rdquo;</h2>
              <p className="text-small text-muted-foreground">
                {!results.length
                  ? "Nothing matches yet."
                  : results[0].matched.length < results[0].of
                    ? `No template covers everything you typed yet. These are the closest ${results.length}.`
                    : `${results.length} template${results.length === 1 ? "" : "s"} match${results.length === 1 ? "es" : ""}${filter === "All" ? "" : ` in ${filter.toLowerCase()}`}.`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clear}><X />Clear</Button>
          </div>
          {results.length ? (
            <div className="flex flex-wrap items-start gap-7">
              <div className="max-w-140 flex-[1_1_28.75rem]">
                <TemplateCard template={results[0].template} onPreview={(x, viaHover) => openPreview(x, results.map((r) => r.template), viaHover)} onUse={use} badge="Best match" className="w-full" />
              </div>
              {results.length > 1 && (
                <div className="min-w-0 flex-[1_1_22.5rem]">
                  <p className="mb-3 text-micro font-semibold text-muted-foreground">Also relevant</p>
                  <div className={compactGrid}>
                    {results.slice(1, 13).map((r) => <CompactTile key={r.template.code} template={r.template} onPreview={(x, viaHover) => openPreview(x, results.map((x) => x.template), viaHover)} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="max-w-160 rounded-2xl border border-dashed border-border px-6 py-6.5 text-sm leading-relaxed text-muted-foreground">
              No template covers that yet. Try a role (&ldquo;line producer&rdquo;), a deliverable (&ldquo;call sheet&rdquo;) or what you&rsquo;re shooting (&ldquo;music video&rdquo;).
            </p>
          )}
        </section>
      ) : (
        <>
          {/* Phones: the suggested templates lead (Apple Music style). */}
          <div className="md:hidden">
            <SuggestedRow
              templates={templates}
              profile={learning.profile}
              ready={learning.ready}
              onPreview={(t, list, viaHover) => openPreview(t, list, viaHover)}
              onUse={use}
            />
          </div>
          {/* Larger screens: the featured row, then Suggested for you. */}
          <div ref={row} className="flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pt-7 pb-13 [scrollbar-width:none] max-md:hidden md:scroll-px-11 md:px-11">
            {featured.map((t) => <TemplateCard key={t.code} template={t} onPreview={(x, viaHover) => openPreview(x, featured, viaHover)} onUse={use} />)}
            {featured.length === 0 && <p className="text-sm text-muted-foreground">No templates here yet.</p>}
          </div>
          <SuggestedForYou
            className="max-md:hidden"
            templates={templates}
            profile={learning.profile}
            ready={learning.ready}
            onRoleChange={learning.setRole}
            onReset={learning.reset}
            onPreview={(t, list, viaHover) => openPreview(t, list, viaHover)}
          />
          {/* Every screen: all templates by category, square gradient cards. */}
          <CategoryRows templates={visible} groups={groups} onPreview={(t, list, viaHover) => openPreview(t, list, viaHover)} />
        </>
      )}

      {/* The address says which template is open; reading it needs its own Suspense boundary. */}
      <Suspense fallback={null}>
        <PreviewFromAddress
          templates={templates}
          list={previewList}
          onView={(code) => learning.record(code, "view")}
          onNavigate={navigatePreview}
          onClose={closePreview}
          onUse={(t) => {
            closePreview();
            use(t);
          }}
        />
      </Suspense>

      <span className="sr-only" aria-live="polite">
        {results ? `${results.length} results for ${committed}` : `${visible.length} templates${filter === "All" ? "" : ` in ${filter}`}`}
      </span>
    </div>
  );
}

function PreviewFromAddress({
  templates,
  list,
  onView,
  ...actions
}: {
  templates: GalleryTemplate[];
  list: GalleryTemplate[];
  onView: (code: string) => void;
  onNavigate: (t: GalleryTemplate) => void;
  onClose: () => void;
  onUse: (t: GalleryTemplate) => void;
}) {
  const code = useSearchParams().get("preview");
  const template = code ? templates.find((t) => t.code === code) : undefined;
  // Every template shown counts as a view, however it was opened (click, hover, a shared link).
  const shown = template?.code;
  useEffect(() => {
    if (shown) onView(shown);
    // onView is a fresh function each render; only a newly shown template should record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);
  if (!template) return null;
  // A shared link opens with the whole catalogue to step through.
  const within = list.some((t) => t.code === template.code) ? list : templates;
  return <PreviewModal template={template} list={within} {...actions} />;
}

function FilterChips({ templates, filter, onChange }: { templates: GalleryTemplate[]; filter: Filter; onChange: (next: Filter) => void }) {
  return (
    <div role="group" aria-label="Filter templates" className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const on = filter === f;
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-small outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "border-foreground bg-secondary font-semibold text-foreground" : "border-border bg-white text-foreground/80 hover:border-foreground",
            )}
          >
            {f}
            <span className={cn("text-meta", on ? "text-foreground" : "text-muted-foreground")}>
              {templates.filter((t) => inFilter(t, f)).length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
