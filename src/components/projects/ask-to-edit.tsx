"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// "Ask to edit" on a shared project's page (Ika, 2026-11-11), when its owner lets the link take
// requests. Signed out: log in first, then come back here. The owner approves in Share project;
// nothing changes until they do (20261111000000_link_access_requests.sql).
export function AskToEdit({ token, signedIn }: { token: string; signedIn: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "asked" | "member">("idle");

  if (!signedIn)
    return (
      <Button asChild variant="outline" className="w-fit">
        <Link href={`/login?next=${encodeURIComponent(`/share/${token}`)}`}>Log in to ask to edit</Link>
      </Button>
    );
  if (state === "asked") return <p className="text-sm text-muted-foreground">Asked. You&rsquo;ll get a note when they let you edit.</p>;
  if (state === "member") return <p className="text-sm text-muted-foreground">You can already edit this project.</p>;

  const ask = async () => {
    setState("busy");
    const { data, error } = await createClient().rpc("request_project_access", { token, note: "" });
    if (error) {
      setState("idle");
      return void toast.error(error.message);
    }
    setState(data === "member" ? "member" : "asked");
  };

  return (
    <Button type="button" variant="outline" className="w-fit" disabled={state === "busy"} onClick={() => void ask()}>
      {state === "busy" ? "Asking…" : "Ask to edit"}
    </Button>
  );
}
