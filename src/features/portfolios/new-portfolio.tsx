"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { slugFor } from "./types";

// The dashed New portfolio tile: makes an untitled portfolio in your workspace and opens its editor.
export function NewPortfolioTile() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const make = async () => {
    setBusy(true);
    const supabase = createClient();
    const { data: workspaceId, error: wsError } = await supabase.rpc("my_workspace_id");
    const { data, error } = wsError
      ? { data: null, error: wsError }
      : await supabase.from("portfolios").insert({ workspace_id: workspaceId, title: "Untitled portfolio", slug: slugFor("portfolio") }).select("id").single();
    if (error || !data) {
      setBusy(false);
      // The table comes from supabase/migrations/20261114000000_portfolios.sql.
      return void toast.error(error?.code === "42P01" || error?.code === "PGRST205" ? "Portfolios aren't set up in the database yet." : "Couldn't make a portfolio. Try again.");
    }
    router.push(`/projects/portfolios/${data.id}`);
  };
  return (
    <button
      type="button"
      onClick={make}
      disabled={busy}
      className="flex aspect-[19/10] w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border text-nia-placeholder outline-none transition-colors duration-fast hover:bg-muted hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
    >
      <Plus aria-hidden className="size-9" strokeWidth={1} />
      <span className="text-sm font-semibold">{busy ? "Making…" : "New portfolio"}</span>
    </button>
  );
}
