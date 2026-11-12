import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { formatDay } from "@/lib/dates";
import { deliverableText, shootDatesText, typeDetails, type CrewMember, type Deliverable, type ProductionType } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/nia/wordmark";
import { ScrollRow } from "@/components/nia/scroll-row";
import { PersonTile } from "@/components/nia/cast-crew-row";
import { ExploreCard, cardSpan } from "@/components/explore/title-card";
import { OpenProject } from "@/components/projects/open-project";
import { ReferenceStill } from "@/components/projects/reference-still";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROW_MAX } from "@/lib/rows";
import { exploreItem, type ExploreItem } from "@/features/explore/items";

// The references row's cells, as on the project page; landscape films get wider ones (cardSpan).
const REF_CELL = "w-[calc(42%*var(--span,1))] flex-none snap-start sm:w-[calc(28%*var(--span,1))] md:w-[calc(22%*var(--span,1))]";
const REF_SIZES = "(min-width: 48rem) 190px, (min-width: 40rem) 28vw, 42vw";

// One lookup per request, shared by the link preview and the page.
const getShared = cache(async (token: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_project", { token }).maybeSingle<SharedRow>();
  return data;
});

// Link previews (WhatsApp, iMessage, Slack, email): the project's title, summary and
// cover (or the NIA card). The page itself stays out of search engines.
export async function generateMetadata({ params }: PageProps<"/share/[token]">): Promise<Metadata> {
  // Supabase reads the clock, so this runs per request (CLAUDE.md working notes).
  await connection();
  const { token } = await params;
  const data = await getShared(token);
  if (!data) return { title: "Link off · Nia OS", robots: { index: false, follow: false } };
  const description = data.description.trim() || `A ${data.production_type ?? "production"} shared from Nia OS.`;
  // No cover yet: the NIA wordmark card stands in.
  const images = [
    data.cover_url
      ? { url: data.cover_url, width: 1600, height: 842, alt: data.title }
      : { url: "/brand/share-preview.png", width: 1200, height: 630, alt: "Nia OS" },
  ];
  return {
    title: data.title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: data.title, description, siteName: "Nia OS", type: "website", images },
    twitter: { card: "summary_large_image", title: data.title, description, images },
  };
}

// The view-only page behind a project's share link. Works without signing in, and
// stops working as soon as the owner turns the link off.
export default function Page({ params }: PageProps<"/share/[token]">) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-15">
        <Link href="/" className="inline-flex rounded-sm">
          <Wordmark />
        </Link>
        <Suspense fallback={null}>
          <OpenProjectSlot params={params} />
        </Suspense>
      </header>
      <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 py-10 md:py-15">
        <Suspense fallback={<SharedSkeleton />}>
          <SharedProject params={params} />
        </Suspense>
      </main>
      <footer className="bg-nia-footer px-4 py-5 text-center text-small text-white/50">
        Shared from Nia OS, the operating system for creative production.
      </footer>
    </div>
  );
}

type SharedRow = {
  title: string;
  description: string;
  cover_url: string | null;
  production_type: string | null;
  stage: string;
  production_date: string;
  duration: string;
  genres: string;
  owner_name: string;
  shoot_start: string | null;
  shoot_end: string | null;
  client: string;
  agency: string;
  due_date: string | null;
  deliverables: Deliverable[] | null;
  notes: string;
  logline: string;
  usage: string;
  looks: number | null;
  publication: string;
  crew: CrewMember[] | null;
};

// The header's Open project: straight in with access, else log in or ask the owner.
async function OpenProjectSlot({ params }: Pick<PageProps<"/share/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const [data, supabase] = await Promise.all([getShared(token), createClient()]);
  if (!data) return null;
  const [access, claims, me] = await Promise.all([
    supabase.rpc("shared_link_access", { token }),
    supabase.auth.getClaims(),
    supabase.rpc("shared_project_me", { token }).maybeSingle<{ project_id: string | null; my_role: string | null; asked: boolean }>(),
  ]);
  return (
    <OpenProject
      token={token}
      projectId={me.data?.project_id ?? null}
      signedIn={Boolean(claims.data?.claims)}
      canAskToEdit={access.data === "request"}
      asked={me.data?.asked ?? false}
    />
  );
}

async function SharedProject({ params }: Pick<PageProps<"/share/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const data = await getShared(token);
  // A link that was turned off (or never existed) says so plainly, instead of a blank page. The
  // page has already started streaming, so the status stays 200; it's kept out of search engines.
  if (!data) return <LinkOff />;
  const supabase = await createClient();
  // Signed-in visitors find it again under Shared with you (audit #11; does nothing when signed
  // out). Then the References row under the crew.
  const [, references] = await Promise.all([supabase.rpc("remember_shared_link", { token }), sharedReferences(supabase, token)]);

  // The same details as the project page, never the budget; type-specific ones only when set.
  const type = data.production_type as ProductionType | null;
  const extras = typeDetails(type);
  const details: [string, string][] = [
    ["Shoot dates", shootDatesText(data.shoot_start, data.shoot_end)],
    ["Client", data.client],
    ["Agency", data.agency],
    ["Deliverables", (data.deliverables ?? []).map(deliverableText).join("\n")],
    ["Due", data.due_date ? formatDay(data.due_date) : ""],
    ...(extras.includes("looks") ? [] : ([["Duration", data.duration]] as [string, string][])),
    ["Genres", data.genres],
    ...(extras.includes("logline") ? ([["Logline", data.logline]] as [string, string][]) : []),
    ...(extras.includes("usage") ? ([["Usage", data.usage]] as [string, string][]) : []),
    ...(extras.includes("looks") ? ([["Looks", data.looks === null ? "" : String(data.looks)]] as [string, string][]) : []),
    ...(extras.includes("publication") ? ([["Publication", data.publication]] as [string, string][]) : []),
    ["Notes", data.notes],
  ];
  const crew = data.crew ?? [];

  return (
    <article className="flex flex-col gap-9">
      {data.cover_url && (
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-muted">
          <Image src={data.cover_url} alt="" fill preload sizes="(min-width: 900px) 860px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-small font-medium text-muted-foreground">
          {[data.production_type, data.stage].filter(Boolean).join(" · ")}
          {data.owner_name ? ` · Shared by ${data.owner_name}` : ""}
        </p>
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">{data.title || "Untitled project"}</h1>
        {data.description && <p className="text-lead whitespace-pre-line text-muted-foreground">{data.description}</p>}
      </div>
      <section aria-labelledby="shared-info" className="flex flex-col gap-4">
        <h2 id="shared-info" className="text-subtitle font-semibold text-foreground">
          Details
        </h2>
        <dl className="flex flex-col gap-3 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-4">
              <dt className="w-[120px] shrink-0 leading-[1.4] font-bold text-muted-foreground">{label}</dt>
              <dd className="leading-normal font-medium whitespace-pre-line text-foreground">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
      {crew.length > 0 && (
        <section aria-labelledby="shared-crew" className="flex flex-col gap-4">
          <h2 id="shared-crew" className="text-subtitle font-semibold text-foreground">
            Crew &amp; talent <span className="text-micro font-normal text-muted-foreground">{crew.length}</span>
          </h2>
          <ScrollRow label="Crew & talent">
            {crew.map((c, i) => (
              <li key={`${i}-${c.name}`} className="w-24 flex-none snap-start sm:w-28">
                <PersonTile person={{ key: `${i}-${c.name}`, name: c.name, role: c.role }} small />
              </li>
            ))}
          </ScrollRow>
        </section>
      )}
      {references.length > 0 && (
        <section aria-labelledby="shared-references" className="flex flex-col gap-4">
          <h2 id="shared-references" className="text-subtitle font-semibold text-foreground">
            References <span className="text-micro font-normal text-muted-foreground">{references.length}</span>
          </h2>
          <ScrollRow label="References">
            {/* The ten newest (rows.ts); the count above says how many there are. */}
            {references.slice(0, ROW_MAX).map((ref) =>
              ref.kind === "explore" ? (
                <li key={ref.item.slug} className={REF_CELL} style={cardSpan(ref.item)}>
                  <ExploreCard item={ref.item} href={ref.item.href()} sizes={REF_SIZES} />
                </li>
              ) : (
                <ReferenceStill key={ref.path} url={ref.url} name={ref.name} className={REF_CELL} />
              ),
            )}
          </ScrollRow>
        </section>
      )}
    </article>
  );
}

type SharedReference = { kind: "explore"; item: ExploreItem } | { kind: "still"; path: string; name: string; url: string };
type ReferenceRow = { kind: "explore" | "still"; slug: string | null; path: string | null; name: string | null };

// The project's Explore titles and its stills tagged Reference, newest first. The stills sit in
// the private file store: the database has checked the link, then the server opens each one with
// a link that lasts an hour (needs SUPABASE_SECRET_KEY; without it, the titles show alone).
// Before 20261111010000_shared_reference_stills.sql is run, the titles come on their own.
async function sharedReferences(supabase: Awaited<ReturnType<typeof createClient>>, token: string): Promise<SharedReference[]> {
  let rows: ReferenceRow[];
  const items = await supabase.rpc("shared_project_reference_items", { token });
  if (items.error) {
    const titles = await supabase.rpc("shared_project_references", { token });
    rows = ((titles.data as string[] | null) ?? []).map((slug) => ({ kind: "explore", slug, path: null, name: null }));
  } else rows = (items.data as ReferenceRow[] | null) ?? [];

  const paths = rows.flatMap((r) => (r.kind === "still" && r.path ? [r.path] : []));
  const admin = paths.length ? createAdminClient() : null;
  const signed = admin ? ((await admin.storage.from("project-files").createSignedUrls(paths, 60 * 60)).data ?? []) : [];
  const urls = new Map(signed.flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])));

  return rows.flatMap((r): SharedReference[] => {
    if (r.kind === "explore") {
      const item = r.slug ? exploreItem(r.slug) : null;
      return item ? [{ kind: "explore", item }] : [];
    }
    const url = r.path ? urls.get(r.path) : undefined;
    return url && r.path ? [{ kind: "still", path: r.path, name: r.name ?? "Reference still", url }] : [];
  });
}

function LinkOff() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-15 text-center">
      <h1 className="text-h2 font-semibold tracking-tight text-foreground">This link is off</h1>
      <p className="max-w-110 text-lead text-muted-foreground">
        The project&rsquo;s owner has turned off its share link, or the link has changed. Ask them for a new one.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to Nia</Link>
      </Button>
    </div>
  );
}

function SharedSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="aspect-[16/7] w-full rounded-2xl" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
