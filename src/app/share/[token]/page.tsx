import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { formatDay } from "@/lib/dates";
import { PRODUCTION_INFO } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";

// One lookup per request, shared by the link preview and the page.
const getShared = cache(async (token: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_project", { token }).maybeSingle<SharedRow>();
  return data;
});

// Link previews (WhatsApp, iMessage, Slack, email): the project's title, summary and
// cover. The page itself stays out of search engines.
export async function generateMetadata({ params }: PageProps<"/share/[token]">): Promise<Metadata> {
  const { token } = await params;
  const data = await getShared(token);
  if (!data) return { title: "Shared project · Nia OS", robots: { index: false, follow: false } };
  const description = data.description.trim() || `A ${data.production_type ?? "production"} shared from Nia OS.`;
  const images = data.cover_url ? [{ url: data.cover_url, width: 1600, height: 842, alt: data.title }] : undefined;
  return {
    title: data.title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: data.title, description, siteName: "Nia OS", type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: data.title, description, images },
  };
}

// The view-only page behind a project's share link. Works without signing in, and
// stops working as soon as the owner turns the link off.
export default function Page({ params }: PageProps<"/share/[token]">) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border px-4 py-6 md:px-15">
        <Link href="/" className="font-wordmark text-wordmark font-bold text-foreground">
          NIA
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
  if (!data) notFound();

  return (
    <article className="flex flex-col gap-9">
      {data.cover_url && (
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[20px] bg-muted">
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
          Production Info
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

function SharedSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="aspect-[16/7] w-full rounded-[20px]" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
