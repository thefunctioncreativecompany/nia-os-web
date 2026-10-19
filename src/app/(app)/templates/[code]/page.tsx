import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchema } from "@/features/templates/catalog";
import { canEdit, restoreDocument } from "@/features/templates/engine/sections";
import { TemplateEditor } from "@/features/templates/engine/template-editor";

export async function generateMetadata({ params }: PageProps<"/templates/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `${getSchema(code)?.name ?? "Template"} · Nia OS` };
}

// A document template in the editor (TEMPLATE_ENGINE.md, build step 7). A new draft, or with
// `?doc=` the saved one, which Row Level Security only returns to people who may see it.
export default function Page({ params, searchParams }: PageProps<"/templates/[code]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: Pick<PageProps<"/templates/[code]">, "params" | "searchParams">) {
  const { code } = await params;
  const schema = getSchema(code);
  if (!canEdit(schema)) notFound();

  const { doc } = await searchParams;
  let saved: { id: string; data: unknown } | null = null;
  if (typeof doc === "string") {
    if (!/^[0-9a-f-]{36}$/.test(doc)) notFound();
    // Supabase checks token expiry with Date.now(), so keep this out of the prerendered shell.
    await connection();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data } = await supabase
      .from("documents")
      .select("id, data")
      .eq("id", doc)
      .eq("template_code", schema.code)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) notFound();
    saved = data;
  }

  return <TemplateEditor key={saved?.id ?? "new"} schema={schema} documentId={saved?.id ?? null} initialData={restoreDocument(schema, saved?.data)} />;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-1 flex-wrap" aria-busy="true" aria-label="Loading template">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-4 pt-10 md:pr-10 md:pl-15">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <div className="flex flex-[1_1_360px] flex-col gap-6 bg-nia-panel px-4 pt-10 md:pr-15 md:pl-10 lg:max-w-[540px]">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
