"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Wanted = "viewer" | "editor";

// "Open project" in a shared page's top right corner (Ika, 2026-11-11). Someone with access goes
// straight to the full project; signed out, they log in and come back here; otherwise they ask the
// owner for access (to view, or to edit when the link takes edit requests). Once the owner says
// yes, the button opens the project: it checks again when the page comes back into view.
// Rules and requests: 20261111000000_link_access_requests.sql.
export function OpenProject({
  token,
  projectId: initialId,
  signedIn,
  canAskToEdit,
  asked: initialAsked,
}: {
  token: string;
  /** Set when the visitor already has the project. */
  projectId: string | null;
  signedIn: boolean;
  canAskToEdit: boolean;
  asked: boolean;
}) {
  const [projectId, setProjectId] = useState(initialId);
  const [asked, setAsked] = useState(initialAsked);
  const [wanted, setWanted] = useState<Wanted>("viewer");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  // After asking: look again when they return to the tab, so an approval opens the way in.
  const check = useCallback(async () => {
    const { data } = await createClient().rpc("shared_project_me", { token }).maybeSingle<{ project_id: string | null; asked: boolean }>();
    if (data?.project_id) setProjectId(data.project_id);
    else if (data) setAsked(data.asked);
  }, [token]);
  useEffect(() => {
    if (!asked || projectId) return;
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [asked, projectId, check]);

  if (projectId)
    return (
      <Button asChild>
        <Link href={`/projects/${projectId}`}>
          Open project <ArrowUpRight aria-hidden />
        </Link>
      </Button>
    );
  if (!signedIn)
    return (
      <Button asChild>
        <Link href={`/login?next=${encodeURIComponent(`/share/${token}`)}`}>
          Open project <ArrowUpRight aria-hidden />
        </Link>
      </Button>
    );

  const ask = async () => {
    setBusy(true);
    const { data, error } = await createClient().rpc("request_project_access", { token, note: "", wanted });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (data === "member") return void (await check());
    setAsked(true);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={asked ? "outline" : "default"}>{asked ? "Asked for access" : "Open project"}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-4 rounded-2xl p-4">
        {asked ? (
          <p className="text-sm text-muted-foreground">You&rsquo;ll get a note when the owner lets you in. This button opens the project then.</p>
        ) : (
          <>
            <h2 className="text-subtitle font-semibold text-foreground">Ask for access</h2>
            {canAskToEdit && (
              <div role="radiogroup" aria-label="Ask to" className="grid grid-cols-2 gap-2">
                {([
                  ["viewer", "View"],
                  ["editor", "Edit"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={wanted === value}
                    onClick={() => setWanted(value)}
                    className={cn(
                      "rounded-2xl border p-3 text-left text-small font-semibold text-foreground outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
                      wanted === value ? "border-foreground bg-secondary" : "border-border hover:border-ring",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <Button type="button" disabled={busy} onClick={() => void ask()}>
              {busy ? "Asking…" : "Send request"}
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
