'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Download, Eye, FileText, FileType, FolderCheck, FolderPlus, Plus, Printer, Redo2, Trash2, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { DocumentHeader, DocumentPreviewHeader } from '@/components/nia/document-header';
import { SavedIndicator } from '@/components/nia/saved-indicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SplitButton } from '@/components/arc/split-button/split-button';
import type { TemplateSchema } from '../types';
import { downloadFile, fileName, toMarkdown, toPlainText, toWord } from './export';
import { SectionView } from './section-views';
import { blankRow, documentCurrency, resolveDocument, type SectionValue, type TableRow } from './sections';
import { DocumentContext } from './document-context';
import { SaveToProjectDialog } from './save-to-project';
import { useDocument, type DocumentProject } from './use-document';

// The one editor every document template uses (TEMPLATE_ENGINE.md §3), from the Filming Notice
// editor in Figma (840:29449): the document on the left, preview and downloads on the right.
// Toolbar shows only actions that work (Ika, 2026-10-19); Save into a project comes in step 8.
export function TemplateEditor({
  schema,
  documentId,
  initialData,
  initialPaid = false,
  initialProject = null,
  readOnly = false,
  canDelete = false,
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

  const download = async (kind: 'md' | 'docx' | 'txt') => {
    try {
      if (kind === 'md') downloadFile(fileName(schema, 'md'), toMarkdown(schema, doc.data), 'text/markdown;charset=utf-8');
      if (kind === 'txt') downloadFile(fileName(schema, 'txt'), toPlainText(schema, doc.data));
      if (kind === 'docx') downloadFile(fileName(schema, 'docx'), await toWord(schema, doc.data));
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

        <div
          role="toolbar"
          aria-label="Document tools"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-nia-panel px-4 py-2 print:hidden"
        >
          {!readOnly && (
          <>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={doc.undo} disabled={!doc.canUndo}>
              <Undo2 aria-hidden /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={doc.redo} disabled={!doc.canRedo}>
              <Redo2 aria-hidden /> Redo
            </Button>
          </div>
          <Separator orientation="vertical" className="h-4" />
          {addRowTo >= 0 && (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus aria-hidden /> {addRowLabel}
            </Button>
          )}
          {schema.actions.includes('Mark Paid') && (
            <Button variant="outline" size="sm" aria-pressed={doc.paid} onClick={() => doc.setPaid(!doc.paid)}>
              <BadgeCheck aria-hidden /> {doc.paid ? 'Mark unpaid' : 'Mark paid'}
            </Button>
          )}
          </>
          )}
          {schema.actions.includes('Print') && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden /> Print
            </Button>
          )}
        </div>

        {/* A disabled fieldset locks every control at once for view-only people, but keeps
            the answers fully readable (no faded inputs). */}
        <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-7 [&_:disabled]:cursor-default [&_:disabled]:bg-transparent [&_:disabled]:opacity-100">
        {schema.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`section-${index}`} className="flex flex-col gap-3">
            <h2 id={`section-${index}`} className="text-base leading-normal font-bold text-foreground">
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
      </div>

      <aside
        aria-label="Preview and download"
        className="flex flex-[1_1_360px] flex-col border-border bg-nia-panel px-4 pt-10 pb-15 md:border-l md:pr-15 md:pl-10 lg:max-w-[540px] print:hidden"
      >
        <div className="flex flex-col gap-6 md:sticky md:top-6">
          <DocumentPreviewHeader status={doc.paid ? 'Paid' : ready ? 'Ready to export' : 'Draft'} />
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6 shadow-card">
            <div className="flex flex-col gap-1.5">
              <p className="text-micro font-bold text-nia-placeholder">Template preview</p>
              <p className="text-lead leading-[1.4] font-bold text-foreground">{schema.name}</p>
              <Separator />
            </div>
            <p className="text-small leading-normal text-muted-foreground">{schema.description}</p>
            <ul className="flex flex-col gap-3 text-small leading-normal text-foreground">
              {schema.contents.map((item) => {
                const [head, ...rest] = item.split(':');
                return (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>
                      {rest.length ? <><span className="font-bold">{head}:</span>{rest.join(':')}</> : item}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-small text-muted-foreground">
              {doc.filled} of {total} {total === 1 ? 'section' : 'sections'} filled
            </p>
            <div className="flex items-center justify-between text-meta text-nia-placeholder">
              <span>Generated by Nia</span>
              <span>{schema.version}</span>
            </div>
          </div>
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
            onClick={() => window.print()}
            actions={[
              { label: 'Word (.docx)', icon: <FileType />, onSelect: () => void download('docx') },
              { label: 'Markdown (.md)', icon: <FileText />, onSelect: () => void download('md') },
              { label: 'Plain text (.txt)', icon: <FileText />, onSelect: () => void download('txt') },
            ]}
          />
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
