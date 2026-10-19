"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// Keeps an open project up to date (Fix 8): when anyone changes the project, its activity, its
// documents or its files, the page quietly refreshes. Row Level Security only sends changes to
// people who can open it. A field being typed in keeps its text (EditableText holds its own draft).
export function ProjectLive({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer = 0;
    // One refresh for a burst of changes (a save writes the project and an activity row).
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 300);
    };
    const channel = supabase
      .channel(`project-${projectId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity", filter: `project_id=eq.${projectId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `project_id=eq.${projectId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_files", filter: `project_id=eq.${projectId}` }, refresh)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  return null;
}
