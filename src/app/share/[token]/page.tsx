import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { formatDay } from "@/lib/dates";
import { PRODUCTION_INFO } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/nia/wordmark";

// One lookup per request, shared by the link preview and the page.
const getShared = cache(async (token: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_project", { token }).maybeSingle<SharedRow>();
  return data;
});

// Link previews (WhatsApp, iMessage, Slack, email): the project's title, summary and
// cover (or the NIA card). The page itself stays out of search engines.
export async function generateMetadata({ params }: PageProps<"/share/[token]">): Promise<Metadata> {
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
      <header className="border-b border-border px-4 py-6 md:px-15">
        <Link href="/" className="inline-flex rounded-sm">
          <Wordmark />
        </Link>
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
  director: string;
  writers: string;
  genres: string;
  stars: string;
  owner_name: string;
};

const COLUMN_FOR: Record<string, keyof SharedRow> = {
  productionDate: "production_date",
  duration: "duration",
  director: "director",
  writers: "writers",
  genres: "genres",
  stars: "stars",
};

async function SharedProject({ params }: Pick<PageProps<"/share/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const data = await getShared(token);
  // A link that was turned off (or never existed) says so plainly, instead of a blank page. The
  // page has already started streaming, so the status stays 200; it's kept out of search engines.
  if (!data) return <LinkOff />;
  // Signed-in visitors find it again under Shared with you (audit #11). Does nothing when
  // signed out.
  const supabase = await createClient();
  await supabase.rpc("remember_shared_link", { token });

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
        <h1 className="text-h1 font-bold text-foreground">{data.title || "Untitled project"}</h1>
        {data.description && <p className="text-lead whitespace-pre-line text-muted-foreground">{data.description}</p>}
      </div>
      <section aria-labelledby="shared-info" className="flex flex-col gap-4">
        <h2 id="shared-info" className="text-lg leading-[1.4] font-bold text-foreground">
          Production info
        </h2>
        <dl className="flex flex-col gap-3 text-sm">
          {PRODUCTION_INFO.map((row) => (
            <div key={row.field} className="flex gap-4">
              <dt className="w-[120px] shrink-0 leading-[1.4] font-bold text-muted-foreground">{row.label}</dt>
              <dd className="leading-normal font-medium text-foreground">{(row.field === "productionDate" ? formatDay(data.production_date) : data[COLUMN_FOR[row.field]]) || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}

function LinkOff() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-15 text-center">
      <h1 className="text-h2 font-bold text-foreground">This link is off</h1>
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
