'use client';

import { useEffect, useState } from 'react';
import { Check, FolderPlus, Search } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentProject } from './use-document';

type Choice = DocumentProject & { coverUrl: string | null };

// Projects the person can add documents to: their own, and ones shared with them to edit.
async function editableProjects(): Promise<Choice[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const [{ data: own }, { data: shared }] = await Promise.all([
    supabase.from('projects').select('id, title, cover_url, updated_at').eq('owner_id', user.id).is('deleted_at', null),
    supabase.from('project_members').select('projects(id, title, cover_url, updated_at, deleted_at)').eq('user_id', user.id).eq('role', 'editor'),
  ]);
  type Row = { id: string; title: string; cover_url: string | null; updated_at: string; deleted_at?: string | null };
  const rows: Row[] = [
    ...((own ?? []) as Row[]),
    ...((shared ?? []) as unknown as { projects: Row | null }[]).map((m) => m.projects).filter((p): p is Row => !!p && !p.deleted_at),
  ];
  return rows
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((p) => ({ id: p.id, title: p.title || 'Untitled project', coverUrl: p.cover_url }));
}

async function createProject(title: string): Promise<DocumentProject | null> {
  const supabase = createClient();
  const { data: workspaceId, error: wsError } = await supabase.rpc('my_workspace_id');
  if (wsError) return null;
  const { data, error } = await supabase.from('projects').insert({ workspace_id: workspaceId, title, description: '' }).select('id, title').single();
  return error ? null : { id: data.id, title: data.title };
}

// "Save to project" (build step 8, Ika 2026-10-19): file the document under one of your
// projects, or a new one named here. Picking the project it's already in does nothing.
export function SaveToProjectDialog({
  open,
  onOpenChange,
  current,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: DocumentProject | null;
  onPick: (project: DocumentProject) => Promise<boolean>;
}) {
  const [projects, setProjects] = useState<Choice[] | null>(null);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void editableProjects().then((list) => live && setProjects(list));
    return () => {
      live = false;
    };
  }, [open]);

  const pick = async (project: DocumentProject) => {
    if (project.id === current?.id) return onOpenChange(false);
    setBusy(true);
    const ok = await onPick(project);
    setBusy(false);
    if (ok) onOpenChange(false);
  };

  const createAndPick = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newName.trim();
    if (!title) return;
    setBusy(true);
    const project = await createProject(title);
    if (project) {
      const ok = await onPick(project);
      if (ok) {
        setNewName('');
        onOpenChange(false);
      }
    }
    setBusy(false);
  };

  const shown = (projects ?? []).filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[480px] flex-col gap-5 rounded-2xl p-6 sm:max-w-[480px]">
        <DialogTitle className="text-subtitle font-bold">{current ? 'Move to another project' : 'Save to project'}</DialogTitle>
        <DialogDescription className="-mt-3 text-small text-muted-foreground">
          It appears under the project&rsquo;s documents, for everyone on the project.
        </DialogDescription>

        <form onSubmit={createAndPick} className="flex gap-2">
          <Input
            aria-label="New project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name"
            className="h-10 flex-1 rounded-lg"
          />
          <Button type="submit" size="compact" disabled={busy || !newName.trim()} className="h-10 rounded-lg px-4">
            <FolderPlus aria-hidden /> Create
          </Button>
        </form>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Find a project" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project" className="h-10 rounded-lg pl-9" />
          </div>
          <ul className="flex max-h-[40svh] flex-col gap-1 overflow-y-auto">
            {projects === null &&
              Array.from({ length: 3 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-14 rounded-lg" />
                </li>
              ))}
            {projects !== null && shown.length === 0 && (
              <li className="px-2 py-4 text-small text-muted-foreground">{projects.length ? 'No project by that name.' : 'No projects yet. Name one above.'}</li>
            )}
            {shown.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                >
                  <span className="aspect-[19/10] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small cover thumbnails */}
                    {p.coverUrl && <img src={p.coverUrl} alt="" className="size-full object-cover" />}
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate text-sm font-semibold text-foreground')}>{p.title}</span>
                  {p.id === current?.id && <Check aria-label="Saved here" className="size-4 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
