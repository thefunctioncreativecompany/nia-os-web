"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { timeAgo } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { Button } from "@/components/ui/button";
import { FlatIcon } from "@/features/templates/components/flat-icon";

type Draft = { id: string; template_code: string; title: string; status: string; updated_at: string };

// "Your drafts" (audit #3): documents you started from a template that aren't in a project yet,
// so they can always be found again, opened, saved to a project from the editor, or deleted.
// Hidden when there are none.
export function MyDrafts({ icons }: { icons: Record<string, string> }) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const supabase = createClient();
      const user = await currentUser(supabase);
      if (!user) return;
      const { data } = await supabase
        .from("documents")
        .select("id, template_code, title, status, updated_at")
        .is("project_id", null)
        .is("deleted_at", null)
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(12);
      if (!live) return;
      setNow(Date.now());
      setDrafts((data ?? []) as Draft[]);
    })();
    return () => {
      live = false;
    };
  }, []);

  if (!drafts?.length) return null;

  const remove = async (draft: Draft) => {
    const { error } = await createClient().rpc("soft_delete_document", { doc_id: draft.id });
    if (error) return void toast.error(`Couldn't delete it: ${error.message}`);
    setDrafts((list) => (list ?? []).filter((d) => d.id !== draft.id));
    setConfirming(null);
    toast.success(`${draft.title} deleted`);
  };

  return (
    <section aria-labelledby="drafts" className="px-4 md:px-11">
      <div className="mb-3.5">
        <h2 id="drafts" className="text-lg font-extrabold text-foreground">Your drafts</h2>
        <p className="text-small text-muted-foreground">Documents you started that aren&rsquo;t in a project yet.</p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-3">
        {drafts.map((d) => (
          <li key={d.id} className="hover-sweep flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                <FlatIcon name={icons[d.template_code] ?? "file"} size="sm" className="size-5" />
              </span>
              <Link href={`/templates/${d.template_code}?doc=${d.id}`} className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="block truncate text-sm font-bold text-foreground hover:underline">{d.title}</span>
                <span className="block truncate text-caption text-muted-foreground">Draft · {timeAgo(d.updated_at, now)}</span>
              </Link>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${d.title}`} onClick={() => setConfirming(d.id)}>
                <Trash2 />
              </Button>
            </div>
            {confirming === d.id && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/8 p-2">
                <span className="text-small text-foreground">Delete this draft?</span>
                <span className="flex gap-2">
                  <Button variant="ghost" size="compact" onClick={() => setConfirming(null)}>
                    Keep
                  </Button>
                  <Button variant="destructive" size="compact" onClick={() => remove(d)}>
                    Delete
                  </Button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
