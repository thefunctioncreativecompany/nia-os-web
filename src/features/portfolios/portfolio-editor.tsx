"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackLink } from "@/components/nia/back-link";
import { ChoicePills } from "@/components/nia/choice-pills";
import { SegmentedControl } from "@/components/nia/segmented-control";
import { BACKGROUNDS, TEMPLATES, type Portfolio, type PortfolioProject, type PortfolioTemplate } from "./types";

type Step = "sequence" | "look" | "details";

// Building a portfolio (beta, PORTFOLIOS_BUILD.md P5, cut down for slice 1): Sequence (which
// projects, in what order), Look (gallery, background, cover) and Details (title, name, link).
// Every change saves as it's made; Publish is the screen's one main action. Preview opens the
// page as visitors will see it, published or not (people in the workspace only until published).
export function PortfolioEditor({ initial, initialChosen, projects }: { initial: Portfolio; initialChosen: string[]; projects: PortfolioProject[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [portfolio, setPortfolio] = useState(initial);
  const [chosen, setChosen] = useState(initialChosen);
  const [step, setStep] = useState<Step>("sequence");
  const byId = new Map(projects.map((p) => [p.id, p]));
  const inOrder = chosen.map((id) => byId.get(id)).filter((p): p is PortfolioProject => Boolean(p));
  const others = projects.filter((p) => !chosen.includes(p.id));
  const pictures = inOrder.flatMap((p) => p.pieces.filter((x) => x.kind === "image"));
  const href = `/p/${portfolio.slug}`;

  const save = async (patch: Partial<Record<"title" | "byline" | "template" | "background" | "cover_file_id" | "published_at" | "deleted_at", string | null>>, next: Partial<Portfolio>) => {
    const before = portfolio;
    setPortfolio((p) => ({ ...p, ...next }));
    const { error } = await supabase.from("portfolios").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", portfolio.id);
    if (error) {
      setPortfolio(before);
      toast.error("Couldn't save that. Try again.");
      return false;
    }
    return true;
  };

  // The order is saved as positions 0, 1, 2… for the projects on the page.
  const saveOrder = async (next: string[]) => {
    const before = chosen;
    setChosen(next);
    const results = await Promise.all(next.map((id, position) => supabase.from("portfolio_projects").update({ position }).eq("portfolio_id", portfolio.id).eq("project_id", id)));
    if (results.some((r) => r.error)) {
      setChosen(before);
      toast.error("Couldn't save the order. Try again.");
    }
  };
  const add = async (id: string) => {
    const { error } = await supabase.from("portfolio_projects").insert({ portfolio_id: portfolio.id, project_id: id, position: chosen.length });
    if (error) return void toast.error("Couldn't add that project. Try again.");
    setChosen((c) => [...c, id]);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("portfolio_projects").delete().eq("portfolio_id", portfolio.id).eq("project_id", id);
    if (error) return void toast.error("Couldn't take that project off. Try again.");
    setChosen((c) => c.filter((x) => x !== id));
  };
  const move = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= chosen.length) return;
    const next = [...chosen];
    [next[index], next[to]] = [next[to], next[index]];
    void saveOrder(next);
  };

  const publish = async () => {
    if (!inOrder.length) return void toast.error("Add a project with final assets first.");
    if (await save({ published_at: new Date().toISOString() }, { publishedAt: new Date().toISOString() })) toast.success("Published");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${href}`);
    toast.success("Link copied");
  };
  const deletePortfolio = async () => {
    if (await save({ deleted_at: new Date().toISOString() }, {})) router.push("/projects/portfolios");
  };

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-15 md:px-page">
      <BackLink href="/projects/portfolios" className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        ← Back to Portfolios
      </BackLink>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-h2 font-semibold tracking-tight text-foreground">{portfolio.title}</h1>
          <p className="text-small text-muted-foreground">{portfolio.publishedAt ? "Published" : "Not published"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={href} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden /> Preview
            </Link>
          </Button>
          {portfolio.publishedAt ? (
            <Button variant="secondary" onClick={copyLink}>
              <Copy aria-hidden /> Copy link
            </Button>
          ) : (
            <Button onClick={publish}>Publish</Button>
          )}
        </div>
      </header>

      <SegmentedControl
        label="Portfolio steps"
        value={step}
        onChange={(v) => setStep(v as Step)}
        segments={[
          { value: "sequence", label: "Sequence" },
          { value: "look", label: "Look" },
          { value: "details", label: "Details" },
        ]}
        className="max-w-md"
      />

      {step === "sequence" && (
        <div className="flex max-w-3xl flex-col gap-10">
          <section aria-labelledby="on-the-page" className="flex flex-col gap-3">
            <h2 id="on-the-page" className="text-subtitle font-semibold text-foreground">On the page</h2>
            {inOrder.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a project below.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {inOrder.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
                    <Thumb url={p.pieces[0]?.url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{p.title}</span>
                      <span className="text-small text-muted-foreground">{p.pieces.length} {p.pieces.length === 1 ? "piece" : "pieces"}</span>
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label={`Move ${p.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Move ${p.title} down`} disabled={i === inOrder.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Take ${p.title} off the page`} onClick={() => remove(p.id)}>
                      <X />
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="from-projects" className="flex flex-col gap-3">
            <h2 id="from-projects" className="text-subtitle font-semibold text-foreground">From your projects</h2>
            {others.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {projects.length ? "Every project with final assets is on the page." : "Tag files Final in a project's Files to use them here."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {others.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                    <Thumb url={p.pieces[0]?.url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{p.title}</span>
                      <span className="text-small text-muted-foreground">{p.pieces.length} {p.pieces.length === 1 ? "piece" : "pieces"}</span>
                    </span>
                    <Button variant="secondary" size="compact" onClick={() => add(p.id)}>
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {step === "look" && (
        <div className="flex max-w-3xl flex-col gap-10">
          <section aria-labelledby="gallery" className="flex flex-col gap-3">
            <h2 id="gallery" className="text-subtitle font-semibold text-foreground">Gallery</h2>
            <ChoicePills label="Gallery" options={[...TEMPLATES]} value={portfolio.template} onChange={(v: PortfolioTemplate) => void save({ template: v }, { template: v })} />
          </section>
          <section aria-labelledby="background" className="flex flex-col gap-3">
            <h2 id="background" className="text-subtitle font-semibold text-foreground">Background</h2>
            <ChoicePills label="Background" options={[...BACKGROUNDS]} value={portfolio.background as (typeof BACKGROUNDS)[number]["value"]} onChange={(v) => void save({ background: v }, { background: v })} />
          </section>
          <section aria-labelledby="cover" className="flex flex-col gap-3">
            <h2 id="cover" className="text-subtitle font-semibold text-foreground">Cover</h2>
            {pictures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a project with pictures first.</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
                {pictures.map((x) => {
                  const on = portfolio.coverFileId === x.id || (!portfolio.coverFileId && x.id === pictures[0].id);
                  return (
                    <li key={x.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`Use ${x.name} as the cover`}
                        onClick={() => void save({ cover_file_id: x.id }, { coverFileId: x.id })}
                        className={cn("relative block aspect-square w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on && "ring-3 ring-nia-blue")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour */}
                        <img src={x.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                        {on && (
                          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-nia-blue text-nia-blue-foreground">
                            <Check aria-hidden className="size-3.5" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {step === "details" && (
        <div className="flex max-w-xl flex-col gap-6">
          <Field id="portfolio-title" label="Title" value={portfolio.title} max={120} onSave={(v) => save({ title: v || "Untitled portfolio" }, { title: v || "Untitled portfolio" })} />
          <Field id="portfolio-byline" label="Your name" value={portfolio.byline} max={120} onSave={(v) => save({ byline: v }, { byline: v })} />
          <div className="flex flex-col gap-2">
            <Label className="text-small font-bold text-foreground">Link</Label>
            <p className="truncate text-sm text-muted-foreground">{href}</p>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            {portfolio.publishedAt && (
              <Button variant="outline" onClick={() => void save({ published_at: null }, { publishedAt: null })}>
                Unpublish
              </Button>
            )}
            <Button variant="ghost" onClick={deletePortfolio}>
              Delete portfolio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Thumb({ url }: { url?: string }) {
  return (
    <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts an hour */}
      {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
    </span>
  );
}

// A text field that saves when you leave it.
function Field({ id, label, value, max, onSave }: { id: string; label: string; value: string; max: number; onSave: (v: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-small font-bold text-foreground">
        {label}
      </Label>
      <Input id={id} value={draft} maxLength={max} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft.trim() !== value && void onSave(draft.trim())} className="h-11" />
    </div>
  );
}
