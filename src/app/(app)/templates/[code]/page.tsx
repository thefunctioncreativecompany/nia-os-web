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

type Saved = { id: string; data: unknown; status: string; created_by: string; project: { id: string; title: string } | null };

async function Editor({ params, searchParams }: Pick<PageProps<"/templates/[code]">, "params" | "searchParams">) {
  const { code } = await params;
  const schema = getSchema(code);
  if (!canEdit(schema)) notFound();

  const { doc } = await searchParams;
  let saved = null as Saved | null;
  let readOnly = false;
  let canDelete = true;
  let startIn: { id: string; title: string } | null = null;
  const { project: projectParam } = await searchParams;
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
      .select("id, data, status, created_by, project:projects(id, title)")
      .eq("id", doc)
      .eq("template_code", schema.code)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) notFound();
    saved = data as unknown as Saved;
    // View-only people get a read-only document; the maker or the project owner can delete it.
    if (saved.project) {
      const [{ data: edit }, { data: owner }] = await Promise.all([
        supabase.rpc("can_edit_project", { pid: saved.project.id }),
        supabase.rpc("is_project_owner", { pid: saved.project.id }),
      ]);
      readOnly = !edit;
      canDelete = saved.created_by === user.id || !!owner;
    } else {
      readOnly = saved.created_by !== user.id;
      canDelete = saved.created_by === user.id;
    }
  } else if (typeof projectParam === "string" && /^[0-9a-f-]{36}$/.test(projectParam)) {
    // Started from a project ("Add document"): it's filed there on the first save, if they can edit it.
    await connection();
    const supabase = await createClient();
    const [{ data: project }, { data: canEditIt }] = await Promise.all([
      supabase.from("projects").select("id, title").eq("id", projectParam).is("deleted_at", null).maybeSingle(),
      supabase.rpc("can_edit_project", { pid: projectParam }),
    ]);
    // One of each template per project (free plan): open the one it already has. Paid workspaces
    // can ask for another (`another=1` from Add document).
    const { data: ws } = await supabase.from("projects").select("workspaces(plan)").eq("id", projectParam).maybeSingle();
    const paid = ((ws as unknown as { workspaces: { plan?: string } | null } | null)?.workspaces?.plan ?? "free") !== "free";
    const another = paid && (await searchParams).another === "1";
    const { data: existing } = another ? { data: null } : await supabase
      .from("documents")
      .select("id")
      .eq("project_id", projectParam)
      .eq("template_code", schema.code)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) redirect(`/templates/${schema.code}?doc=${existing.id}`);
    if (project && canEditIt) startIn = { id: project.id, title: project.title || "Untitled project" };
  }

  return <TemplateEditor key={saved?.id ?? "new"} schema={schema} documentId={saved?.id ?? null} initialData={restoreDocument(schema, saved?.data)} initialPaid={saved?.status === "paid"} initialProject={saved?.project ?? startIn} readOnly={readOnly} canDelete={canDelete} />;
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
