'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Download, Eye, FileText, FileType, FolderCheck, FolderPlus, Plus, Printer, Redo2, Trash2, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { myPlan, projectPlan } from '@/lib/plan-client';
import { toast } from 'sonner';

import { DocumentHeader, DocumentPreviewHeader } from '@/components/nia/document-header';
import { SavedIndicator } from '@/components/nia/saved-indicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { openUpgrade } from '@/components/nia/upgrade-dialog';
import { SplitButton } from '@/components/arc/split-button/split-button';
import type { NextTemplate } from '../catalog';
import type { TemplateSchema } from '../types';
import { downloadFile, fileName, toMarkdown, toPdf, toPlainText, toWord } from './export';
import { SectionView } from './section-views';
import { blankRow, documentCurrency, resolveDocument, type SectionValue, type TableRow } from './sections';
import { DocumentContext } from './document-context';
import { LivePreview } from './live-preview';
import { SaveToProjectDialog } from './save-to-project';
import { SectionOutline } from './section-outline';
import { useDocument, type DocumentProject } from './use-document';
import { WhatsNext } from './whats-next';

// The one editor every document template uses (TEMPLATE_ENGINE.md §3), from the Filming Notice
// editor in Figma (840:29449): the document on the left, preview and downloads on the right.
// Toolbar shows only actions that work (Ika, 2026-10-19); Save into a project comes in step 8.
// The filter-bar pill (FilterChip's look), for the editor's tools.
const toolPill =
  'inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition-colors duration-fast hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-45';

export function TemplateEditor({
  schema,
  documentId,
  initialData,
  initialPaid = false,
  initialProject = null,
  readOnly = false,
  canDelete = false,
  next = [],
}: {
  schema: TemplateSchema;
  documentId: string | null;
  initialData: SectionValue[];
  initialPaid?: boolean;
  /** The project it's filed under (a saved document, or `?project=` when started from a project). */
  initialProject?: DocumentProject | null;
  /** View-only (audit #2): someone with view access to the project. Nothing can be changed. */
  readOnly?: boolean;
  /** The person who made it, or the project's owner (audit #3). */
  canDelete?: boolean;
  /** "What's next": the documents this one leads to. */
  next?: NextTemplate[];
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const doc = useDocument(schema, documentId, initialData, initialPaid, initialProject);
  const [choosing, setChoosing] = useState(false);
  const currency = documentCurrency(schema, doc.data);
  // Letters as they read, with [placeholders] filled from the answers above (T5).
  const shown = resolveDocument(schema, doc.data);
  const total = schema.sections.length;
  // The toolbar's Add row adds to the template's (first) table.
  const addRowTo = schema.actions.some((a) => a === 'Add Row' || a === 'Add Line Item') ? schema.sections.findIndex((s) => s.type === 'table') : -1;
  const addRowLabel = schema.actions.includes('Add Line Item') ? 'Add line item' : 'Add row';
  const addRow = () => {
    const section = schema.sections[addRowTo];
    if (section?.type !== 'table') return;
    doc.update(addRowTo, [...(doc.data[addRowTo] as TableRow[]), blankRow(section)], `add-${crypto.randomUUID()}`);
  };
  const ready = doc.filled > 0;

  // The Nia footer on downloads: always on for Free (turning it off offers the upgrade).
  const [branded, setBranded] = useState(true);
  const [paidPlan, setPaidPlan] = useState(false);
  const projectId = doc.project?.id ?? null;
  useEffect(() => {
    let live = true;
    const supabase = createClient();
    void (projectId ? projectPlan(supabase, projectId) : myPlan(supabase)).then((plan) => live && setPaidPlan(plan !== 'free'));
    return () => {
      live = false;
    };
  }, [projectId]);

  const download = async (kind: 'pdf' | 'md' | 'docx' | 'txt') => {
    try {
      if (kind === 'pdf') downloadFile(fileName(schema, 'pdf'), await toPdf(schema, doc.data, branded));
      if (kind === 'md') downloadFile(fileName(schema, 'md'), toMarkdown(schema, doc.data, branded), 'text/markdown;charset=utf-8');
      if (kind === 'txt') downloadFile(fileName(schema, 'txt'), toPlainText(schema, doc.data, branded));
      if (kind === 'docx') downloadFile(fileName(schema, 'docx'), await toWord(schema, doc.data, branded));
    } catch {
      toast.error("Couldn't make that file. Try again.");
    }
  };

  return (
    <DocumentContext.Provider value={{ schema, data: doc.data }}>
    <div className="flex flex-1 flex-wrap">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 px-4 pt-10 pb-15 md:pr-10 md:pl-15 print:p-0">
        <DocumentHeader
          backHref={doc.project ? `/projects/${doc.project.id}` : '/templates'}
          backLabel={doc.project ? `Back to ${doc.project.title}` : 'Back to Templates'}
          title={schema.name}
          description={schema.description}
          status={doc.savedAt ? <SavedIndicator savedAt={doc.savedAt} className="print:hidden" /> : undefined}
        />

        {readOnly && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-nia-panel px-4 py-3 text-small text-muted-foreground print:hidden">
            <Eye aria-hidden className="size-4 shrink-0" />
            You can view this document. Ask the project owner for edit access to change it.
          </p>
        )}

        {doc.paid && (
          <p role="status" className="w-fit -rotate-2 rounded-md border-2 border-status-confirmed-foreground px-3 py-1 text-lead font-bold text-status-confirmed-foreground">
            Paid
          </p>
        )}

        {/* Editing tools as pills, in the platform's filter look (Ika, 2026-10-21); getting the
            document out (downloads and Print) is one menu beside the preview. */}
        {!readOnly && (
          <div role="toolbar" aria-label="Document tools" className="flex flex-wrap items-center gap-2 print:hidden">
            <button type="button" onClick={doc.undo} disabled={!doc.canUndo} className={toolPill}>
              <Undo2 aria-hidden className="size-4" /> Undo
            </button>
            <button type="button" onClick={doc.redo} disabled={!doc.canRedo} className={toolPill}>
              <Redo2 aria-hidden className="size-4" /> Redo
            </button>
            {addRowTo >= 0 && (
              <button type="button" onClick={addRow} className={toolPill}>
                <Plus aria-hidden className="size-4" /> {addRowLabel}
              </button>
            )}
            {schema.actions.includes('Mark Paid') && (
              <button type="button" aria-pressed={doc.paid} onClick={() => doc.setPaid(!doc.paid)} className={cn(toolPill, doc.paid && 'border-foreground bg-secondary')}>
                <BadgeCheck aria-hidden className="size-4" /> {doc.paid ? 'Mark unpaid' : 'Mark paid'}
              </button>
            )}
          </div>
        )}
        {total >= 3 && <SectionOutline schema={schema} data={doc.data} filled={doc.filled} />}
        {/* A disabled fieldset locks every control at once for view-only people, but keeps
            the answers fully readable (no faded inputs). */}
        <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-7 [&_:disabled]:cursor-default [&_:disabled]:bg-transparent [&_:disabled]:opacity-100">
        {schema.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`section-${index}`} className="flex flex-col gap-3">
            <h2 id={`section-${index}`} className="scroll-mt-20 text-base leading-normal font-bold text-foreground">
              {section.title}
            </h2>
            <SectionView
              section={section}
              value={shown[index]}
              onChange={(value, key) => doc.update(index, value, `${index}:${key}`)}
              currency={currency}
            />
          </section>
        ))}
        </fieldset>
        {!readOnly && <WhatsNext items={next} projectId={doc.project?.id ?? null} />}
      </div>

      <aside
        aria-label="Preview and download"
        className="flex min-w-0 flex-[1_1_360px] flex-col border-border bg-nia-panel px-4 pt-10 pb-15 md:border-l md:pr-15 md:pl-10 lg:max-w-[540px] print:hidden"
      >
        <div className="flex flex-col gap-6 md:sticky md:top-6">
          <DocumentPreviewHeader status={doc.paid ? 'Paid' : ready ? 'Ready to export' : 'Draft'} />
          <LivePreview schema={schema} data={doc.data} branded={branded} />
          {total < 3 && (
            <p className="-mt-3 text-small text-muted-foreground">
              {doc.filled} of {total} {total === 1 ? 'section' : 'sections'} filled
            </p>
          )}
          {doc.project ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-nia-panel">
                  <FolderCheck aria-hidden className="size-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-caption text-muted-foreground">Saved to</span>
                  <Link href={`/projects/${doc.project.id}`} className="block truncate text-sm font-bold text-foreground hover:underline">
                    {doc.project.title}
                  </Link>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="compact" className="rounded-lg">
                  <Link href={`/projects/${doc.project.id}`}>Open project</Link>
                </Button>
                {!readOnly && (
                <>
                <Button variant="outline" size="compact" className="rounded-lg" onClick={() => setChoosing(true)}>
                  Move
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  className="rounded-lg text-muted-foreground"
                  onClick={async () => {
                    const was = doc.project;
                    if (await doc.fileTo(null)) toast.success(`Removed from ${was?.title}. It stays in your drafts.`);
                  }}
                >
                  Remove from project
                </Button>
                </>
                )}
              </div>
            </div>
          ) : readOnly ? null : (
            <Button className="w-full rounded-xl" onClick={() => setChoosing(true)}>
              <FolderPlus aria-hidden /> Save to project
            </Button>
          )}
          <SaveToProjectDialog
            open={choosing}
            onOpenChange={setChoosing}
            current={doc.project}
            templateCode={schema.code}
            templateName={schema.name}
            onPick={async (project) => {
              const ok = await doc.fileTo(project);
              if (ok) toast.success(`Saved to ${project.title}`);
              return ok;
            }}
          />
          <SplitButton
            variant="secondary"
            className="w-full"
            label="Download PDF"
            icon={<Download />}
            onClick={() => void download('pdf')}
            actions={[
              { label: 'Word (.docx)', icon: <FileType />, onSelect: () => void download('docx') },
              { label: 'Markdown (.md)', icon: <FileText />, onSelect: () => void download('md') },
              { label: 'Plain text (.txt)', icon: <FileText />, onSelect: () => void download('txt') },
              ...(schema.actions.includes('Print') ? [{ label: 'Print', icon: <Printer />, onSelect: () => window.print() }] : []),
            ]}
          />
          <label className="-mt-2 flex items-center justify-between gap-3 px-1 text-small text-muted-foreground">
            Nia footer on downloads
            <Switch
              checked={branded}
              onCheckedChange={(on) => {
                if (!on && !paidPlan) return openUpgrade('branding');
                setBranded(on);
              }}
              aria-label="Nia footer on downloads"
            />
          </label>
          {canDelete && doc.id && (
            <div className="flex flex-col gap-2">
              {confirmDelete ? (
                <div role="alert" className="flex flex-col gap-2 rounded-xl bg-destructive/8 p-3">
                  <span className="text-small text-foreground">Delete this {schema.name.toLowerCase()}? It&rsquo;s removed for everyone{doc.project ? ' on the project' : ''}.</span>
                  <span className="flex gap-2">
                    <Button variant="ghost" size="compact" onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </Button>
                    <Button
                      variant="destructive"
                      size="compact"
                      onClick={async () => {
                        const { error } = await createClient().rpc('soft_delete_document', { doc_id: doc.id });
                        if (error) return void toast.error(`Couldn't delete it: ${error.message}`);
                        toast.success(`${schema.name} deleted`);
                        router.push(doc.project ? `/projects/${doc.project.id}` : '/templates');
                      }}
                    >
                      Delete document
                    </Button>
                  </span>
                </div>
              ) : (
                <Button variant="ghost" size="compact" className="w-fit self-center text-muted-foreground" onClick={() => setConfirmDelete(true)}>
                  <Trash2 aria-hidden /> Delete document
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
    </DocumentContext.Provider>
  );
}
