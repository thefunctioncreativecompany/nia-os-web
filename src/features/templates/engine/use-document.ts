'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import type { TemplateSchema } from '../types';
import { filledCount, type SectionValue } from './sections';

/*
 * A document's state in the editor (TEMPLATE_ENGINE.md §5): Undo / Redo, where typing in one
 * place within 0.7s is a single step (~80 steps kept), and autosave 0.8s after the last change.
 * Nothing is stored until something is filled in, so opening a template and leaving creates
 * no empty document. The first save adds `?doc=` to the address, so a refresh reopens it.
 *
 * Save to project (build step 8): a document belongs to one project or none. `fileTo` puts it
 * in a project (creating it first if nothing was typed yet) or takes it out (null).
 */

export type DocumentProject = { id: string; title: string };

const GROUP_MS = 700;
const SAVE_MS = 800;
const MAX_STEPS = 80;

type History = { past: SectionValue[][]; present: SectionValue[]; future: SectionValue[][] };

export function useDocument(schema: TemplateSchema, documentId: string | null, initial: SectionValue[], initialPaid = false, initialProject: DocumentProject | null = null) {
  const [project, setProject] = useState<DocumentProject | null>(initialProject);
  const projectRef = useRef(initialProject);
  const [history, setHistory] = useState<History>({ past: [], present: initial, future: [] });
  // Invoices: Mark paid (TEMPLATE_ENGINE.md §5) is the document's status, saved like any change.
  const [paid, setPaidState] = useState(initialPaid);
  const paidRef = useRef(initialPaid);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const lastEdit = useRef<{ key: string; at: number } | null>(null);
  const id = useRef(documentId);
  const changed = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef(initial);
  useEffect(() => {
    latest.current = history.present;
  }, [history.present]);

  /** `key` names the place being typed in (section and field), for grouping keystrokes. */
  const update = useCallback((index: number, value: SectionValue, key = String(index)) => {
    const now = Date.now();
    const typing = lastEdit.current && lastEdit.current.key === key && now - lastEdit.current.at < GROUP_MS;
    lastEdit.current = { key, at: now };
    changed.current = true;
    setHistory((h) => {
      const present = h.present.map((v, i) => (i === index ? value : v));
      if (typing) return { ...h, present, future: [] };
      return { past: [...h.past, h.present].slice(-MAX_STEPS), present, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    lastEdit.current = null;
    changed.current = true;
    setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = null;
    changed.current = true;
    setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);

  // Saves run one after another, so the first save's new id is there for the next.
  const save = useCallback(() => {
    changed.current = false;
    queue.current = queue.current.then(async () => {
      const data = latest.current;
      const filled = filledCount(schema, data);
      const status = paidRef.current ? 'paid' : filled > 0 ? 'ready' : 'draft';
      const supabase = createClient();
      if (!id.current) {
        if (filled === 0) return;
        const { data: row, error } = await supabase
          .from('documents')
          .insert({ template_code: schema.code, title: schema.name, data, added: [], status, schema_version: schema.version, project_id: projectRef.current?.id ?? null })
          .select('id')
          .single();
        if (error) return void toast.error(`Couldn't save: ${error.message}`);
        id.current = row.id;
        window.history.replaceState(window.history.state, '', `?doc=${row.id}`);
      } else {
        const { error } = await supabase.from('documents').update({ data, status }).eq('id', id.current);
        if (error) return void toast.error(`Couldn't save: ${error.message}`);
      }
      setSavedAt(Date.now());
    });
  }, [schema]);

  useEffect(() => {
    if (!changed.current) return;
    const timer = window.setTimeout(save, SAVE_MS);
    return () => window.clearTimeout(timer);
  }, [history.present, paid, save]);

  /** Put the document in a project, or take it out (null). Resolves to whether it worked. */
  const fileTo = useCallback(
    (next: DocumentProject | null) =>
      new Promise<boolean>((resolve) => {
        queue.current = queue.current.then(async () => {
          const supabase = createClient();
          const data = latest.current;
          let error: { message: string } | null = null;
          if (!id.current) {
            const filled = filledCount(schema, data);
            const result = await supabase
              .from('documents')
              .insert({ template_code: schema.code, title: schema.name, data, added: [], status: paidRef.current ? 'paid' : filled > 0 ? 'ready' : 'draft', schema_version: schema.version, project_id: next?.id ?? null })
              .select('id')
              .single();
            error = result.error;
            if (result.data) {
              id.current = result.data.id;
              window.history.replaceState(window.history.state, '', `?doc=${result.data.id}`);
            }
          } else {
            ({ error } = await supabase.from('documents').update({ project_id: next?.id ?? null }).eq('id', id.current));
          }
          if (error) {
            toast.error(`Couldn't ${next ? 'save to the project' : 'remove it from the project'}: ${error.message}`);
            return resolve(false);
          }
          projectRef.current = next;
          setProject(next);
          setSavedAt(Date.now());
          resolve(true);
        });
      }),
    [schema],
  );

  const setPaid = useCallback((next: boolean) => {
    paidRef.current = next;
    changed.current = true;
    setPaidState(next);
  }, []);

  // Leaving the page within the wait still saves the last change.
  useEffect(() => {
    const flush = () => {
      if (changed.current) save();
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [save]);

  return {
    data: history.present,
    update,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    savedAt,
    paid,
    setPaid,
    project,
    fileTo,
    filled: filledCount(schema, history.present),
  };
}
