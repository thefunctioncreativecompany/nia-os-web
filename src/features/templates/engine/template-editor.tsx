'use client';

import { Download, FileText, FileType, Printer, Redo2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { DocumentHeader, DocumentPreviewHeader } from '@/components/nia/document-header';
import { SavedIndicator } from '@/components/nia/saved-indicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SplitButton } from '@/components/arc/split-button/split-button';
import type { TemplateSchema } from '../types';
import { downloadFile, fileName, toMarkdown, toPlainText, toWord } from './export';
import { SectionView } from './section-views';
import type { SectionValue } from './sections';
import { useDocument } from './use-document';

// The one editor every document template uses (TEMPLATE_ENGINE.md §3), from the Filming Notice
// editor in Figma (840:29449): the document on the left, preview and downloads on the right.
// Toolbar shows only actions that work (Ika, 2026-10-19); Save into a project comes in step 8.
export function TemplateEditor({
  schema,
  documentId,
  initialData,
}: {
  schema: TemplateSchema;
  documentId: string | null;
  initialData: SectionValue[];
}) {
  const doc = useDocument(schema, documentId, initialData);
  const total = schema.sections.length;
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
    <div className="flex flex-1 flex-wrap">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 px-4 pt-10 pb-15 md:pr-10 md:pl-15 print:p-0">
        <DocumentHeader
          backHref="/templates"
          backLabel="Back to Templates"
          title={schema.name}
          description={schema.description}
          status={doc.savedAt ? <SavedIndicator savedAt={doc.savedAt} className="print:hidden" /> : undefined}
        />

        <div
          role="toolbar"
          aria-label="Document tools"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-nia-panel px-4 py-2 print:hidden"
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={doc.undo} disabled={!doc.canUndo}>
              <Undo2 aria-hidden /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={doc.redo} disabled={!doc.canRedo}>
              <Redo2 aria-hidden /> Redo
            </Button>
          </div>
          <Separator orientation="vertical" className="h-4" />
          {schema.actions.includes('Print') && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden /> Print
            </Button>
          )}
        </div>

        {schema.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`section-${index}`} className="flex flex-col gap-3">
            <h2 id={`section-${index}`} className="text-base leading-normal font-bold text-foreground">
              {section.title}
            </h2>
            <SectionView
              section={section}
              value={doc.data[index]}
              onChange={(value, key) => doc.update(index, value, `${index}:${key}`)}
            />
          </section>
        ))}
      </div>

      <aside
        aria-label="Preview and download"
        className="flex flex-[1_1_360px] flex-col border-border bg-nia-panel px-4 pt-10 pb-15 md:border-l md:pr-15 md:pl-10 lg:max-w-[540px] print:hidden"
      >
        <div className="flex flex-col gap-6 md:sticky md:top-6">
          <DocumentPreviewHeader status={ready ? 'Ready to export' : 'Draft'} />
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
        </div>
      </aside>
    </div>
  );
}
