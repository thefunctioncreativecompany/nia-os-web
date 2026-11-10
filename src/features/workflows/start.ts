import { getSchema, getTemplate } from "@/features/templates/catalog";
import { restoreDocument } from "@/features/templates/engine/sections";
import { projectLimitReached } from "@/lib/plan-client";
import { recordEvent } from "@/lib/product-events";
import { createClient } from "@/lib/supabase/client";
import type { Workflow } from "./workflows";

export type Started = { ok: true; projectId: string; documents: number } | { ok: false; reason: "limit" | "error"; message?: string };

// Starts a workflow: a new project of the workflow's kind, with a blank draft of each of its
// documents in it. Runs as the signed-in person, so the database's own rules apply (their
// workspace, the free plan's limits). If a document can't be added, the project still opens
// with the ones that were.
export async function startWorkflow(workflow: Workflow, title: string): Promise<Started> {
  const supabase = createClient();
  const { data: workspaceId, error: wsError } = await supabase.rpc("my_workspace_id");
  if (wsError) return { ok: false, reason: "error", message: wsError.message };
  if (await projectLimitReached(supabase, workspaceId)) return { ok: false, reason: "limit" };
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ workspace_id: workspaceId, title: title.trim() || workflow.name, description: workflow.does, production_type: workflow.productionType })
    .select("id")
    .single();
  if (error) return { ok: false, reason: "error", message: error.message };
  recordEvent("project_created", { projectId: project.id, props: { from: "workflow", workflow: workflow.id } });

  const rows = workflow.templates.flatMap((code) => {
    const template = getTemplate(code);
    const schema = template && getSchema(template.schema ?? template.code);
    return schema ? [{ template_code: schema.code, title: schema.name, data: restoreDocument(schema, null), added: [], status: "draft", schema_version: schema.version, project_id: project.id }] : [];
  });
  // One at a time, in order, so they list in the order you'd fill them in.
  let documents = 0;
  for (const row of rows) {
    const { error: docError } = await supabase.from("documents").insert(row);
    if (docError) continue;
    documents += 1;
    recordEvent("document_created", { projectId: project.id, props: { template: row.template_code, from: "workflow" } });
  }
  return { ok: true, projectId: project.id, documents };
}
