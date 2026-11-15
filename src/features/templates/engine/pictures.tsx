'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, FolderPlus, ImagePlus, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { uploadProjectFile } from '@/components/projects/project-files';
import { pictureLinks, projectPictures, type Picture } from '../picture-actions';
import type { TemplateSchema } from '../types';
import { fieldLabel, pictureColumn, type SectionValue, type TableRow } from './sections';

// Pictures in a document (Ika, 2026-11-15: shot lists where a team "may only have references").
// A picture is one of the project's files, tagged Reference, so it shows in the project's Files
// too; the document keeps its id. Links come from the server (picture-actions.ts). Pictures need
// the document to be in a project; until then the controls offer Save to project.

const MAX_MB = 25;

type Pictures = {
  projectId: string | null;
  readOnly: boolean;
  /** What's known so far, by file id (a new upload shows from the computer straight away). */
  known: Map<string, Picture>;
  /** Uploads pictures to the project as references; their ids, in order. */
  upload: (files: File[]) => Promise<string[]>;
  /** The project's pictures, loaded the first time they're asked for. */
  library: () => Promise<Picture[]>;
  /** Opens Save to project. */
  askProject: () => void;
};

export const PicturesContext = createContext<Pictures | null>(null);
export const usePictures = () => useContext(PicturesContext);

/** The picture ids a document uses (every table's picture column). */
function idsIn(schema: TemplateSchema, data: SectionValue[]) {
  return schema.sections.flatMap((s, i) => {
    if (s.type !== 'table') return [];
    const column = pictureColumn(s);
    if (!column) return [];
    return ((data[i] as TableRow[]) ?? []).flatMap((row) => {
      const id = row[fieldLabel(column)];
      return typeof id === 'string' && id ? [id] : [];
    });
  });
}

/** The document's pictures, for PicturesContext (the editor also reads `known` for the PDF). */
export function usePictureStore({ schema, data, projectId, readOnly, onAskProject }: { schema: TemplateSchema; data: SectionValue[]; projectId: string | null; readOnly: boolean; onAskProject: () => void }): Pictures {
  const [known, setKnown] = useState<Map<string, Picture>>(new Map());
  const asked = useRef(new Set<string>());
  const key = [...new Set(idsIn(schema, data))].join(',');

  // Links for pictures the document has and we haven't asked about yet (one trip for all of them).
  useEffect(() => {
    const want = key ? key.split(',').filter((id) => !asked.current.has(id)) : [];
    if (!want.length) return;
    for (const id of want) asked.current.add(id);
    void pictureLinks(want).then((found) => {
      if (!found.length) return;
      setKnown((was) => {
        const next = new Map(was);
        for (const p of found) next.set(p.id, p);
        return next;
      });
    });
  }, [key]);

  const libraryOf = useRef<{ project: string; list: Promise<Picture[]> } | null>(null);
  const library = useCallback(async () => {
    if (!projectId) return [];
    if (libraryOf.current?.project !== projectId) libraryOf.current = { project: projectId, list: projectPictures(projectId) };
    const list = await libraryOf.current.list;
    // Only when something's new: a new map each time would redraw everything that reads it.
    setKnown((was) => {
      const fresh = list.filter((p) => !was.has(p.id));
      if (!fresh.length) return was;
      const next = new Map(was);
      for (const p of fresh) next.set(p.id, p);
      return next;
    });
    return list;
  }, [projectId]);

  const upload = useCallback(
    async (files: File[]) => {
      if (!projectId) return [];
      const pictures = files.filter((f) => f.type.startsWith('image/'));
      const tooBig = pictures.filter((f) => f.size > MAX_MB * 1024 * 1024);
      if (pictures.length < files.length) toast('Only pictures go in here.');
      if (tooBig.length) toast(`Pictures up to ${MAX_MB} MB: ${tooBig.map((f) => f.name).join(', ')} left out.`);
      const ok = pictures.filter((f) => f.size <= MAX_MB * 1024 * 1024);
      if (!ok.length) return [];
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error('Sign in again to add pictures.');
        return [];
      }
      const ids: string[] = [];
      for (const file of ok) {
        try {
          const id = await uploadProjectFile(projectId, file, token, 'reference');
          ids.push(id);
          // Shown from the computer until the next visit brings the stored copy.
          setKnown((was) => new Map(was).set(id, { id, name: file.name, url: URL.createObjectURL(file), tag: 'reference' }));
          asked.current.add(id);
        } catch (e) {
          toast.error(`Couldn't add ${file.name}. ${e instanceof Error ? e.message : ''}`.trim());
        }
      }
      // The project's pictures now include these.
      libraryOf.current = null;
      return ids;
    },
    [projectId],
  );

  return useMemo(() => ({ projectId, readOnly, known, upload, library, askProject: onAskProject }), [projectId, readOnly, known, upload, library, onAskProject]);
}

/** Choose pictures: the project's own (references first) or new ones from the computer. */
function Chooser({ multiple, onPick, onRemove, close }: { multiple: boolean; onPick: (ids: string[]) => void; onRemove?: () => void; close: () => void }) {
  const pictures = usePictures();
  const [list, setList] = useState<Picture[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const library = pictures?.library;
  useEffect(() => {
    let live = true;
    void library?.().then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, [library]);
  if (!pictures) return null;

  if (!pictures.projectId) {
    return (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm text-muted-foreground">Pictures are kept with a project. Save this to one first.</p>
        <Button
          variant="secondary"
          className="w-fit"
          onClick={() => {
            close();
            pictures.askProject();
          }}
        >
          <FolderPlus aria-hidden /> Save to project
        </Button>
      </div>
    );
  }

  const fromComputer = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const ids = await pictures.upload([...files]);
    setBusy(false);
    if (ids.length) {
      onPick(ids);
      close();
    }
  };
  const toggle = (id: string) => {
    if (!multiple) {
      onPick([id]);
      close();
      return;
    }
    setChosen((was) => (was.includes(id) ? was.filter((x) => x !== id) : [...was, id]));
  };

  return (
    <div className="flex flex-col gap-3">
      {list === null ? (
        <p className="px-1 py-4 text-small text-muted-foreground">Loading the project&rsquo;s pictures…</p>
      ) : list.length ? (
        <ul aria-label="The project's pictures" className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto">
          {list.map((p) => {
            const on = chosen.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={multiple ? on : undefined}
                  aria-label={p.name}
                  onClick={() => toggle(p.id)}
                  className={cn('relative block aspect-video w-full overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on && 'ring-3 ring-nia-blue')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts a while */}
                  <img src={p.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  {on && (
                    <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-nia-blue text-nia-blue-foreground">
                      <Check aria-hidden className="size-3" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-1 py-2 text-small text-muted-foreground">No pictures in this project yet.</p>
      )}
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => void fromComputer(e.target.files)} />
      <div className="flex flex-wrap items-center gap-2">
        {multiple && chosen.length > 0 && (
          <Button
            onClick={() => {
              onPick(chosen);
              close();
            }}
          >
            Add {chosen.length} {chosen.length === 1 ? 'shot' : 'shots'}
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
          <Upload aria-hidden /> {busy ? 'Adding…' : 'From your computer'}
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            onClick={() => {
              onRemove();
              close();
            }}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/** A table cell holding one picture: its thumbnail, or Add. */
export function PictureCell({
  id,
  label,
  value,
  onChange,
  fill = false,
  onShape,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** A card's picture (card-row.tsx): fills the box it's in, which is shaped to the picture. */
  fill?: boolean;
  /** The picture's size once loaded, so a card can take its shape. */
  onShape?: (width: number, height: number) => void;
}) {
  const pictures = usePictures();
  const [open, setOpen] = useState(false);
  const picture = value ? pictures?.known.get(value) : undefined;
  const thumb = picture ? (
    // eslint-disable-next-line @next/next/no-img-element -- a private file's link that lasts a while
    <img
      src={picture.url}
      alt={picture.name}
      onLoad={(e) => onShape?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
      className="absolute inset-0 size-full object-cover"
    />
  ) : (
    <ImagePlus aria-hidden className={cn(fill ? 'size-6' : 'size-4', 'text-muted-foreground print:hidden')} />
  );
  const box = cn('relative flex items-center justify-center overflow-hidden bg-muted', fill ? 'absolute inset-0 size-full rounded-lg' : 'aspect-video w-24 rounded-md');
  if (!pictures || pictures.readOnly) return value ? <span className={box}>{thumb}</span> : <span className="text-nia-placeholder">—</span>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} aria-label={picture ? `${label}: ${picture.name}. Change` : `${label}: add a picture`} className={cn(box, 'outline-none hover:ring-2 hover:ring-border focus-visible:ring-3 focus-visible:ring-ring/50')}>
        {thumb}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <Chooser multiple={false} onPick={([next]) => onChange(next)} onRemove={value ? () => onChange('') : undefined} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** "Add from pictures": each chosen picture becomes a shot (filling empty rows first). */
export function AddFromPictures({ onAdd }: { onAdd: (ids: string[]) => void }) {
  const pictures = usePictures();
  const [open, setOpen] = useState(false);
  if (!pictures || pictures.readOnly) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-fit print:hidden">
          <ImagePlus aria-hidden /> Add from pictures
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <Chooser multiple onPick={onAdd} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** Dropping pictures on a table with a picture column: uploads them and adds a shot for each. */
export function usePictureDrop(onAdd: (ids: string[]) => void) {
  const pictures = usePictures();
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  if (!pictures || pictures.readOnly) return { over: false, handlers: {} };
  const hasFiles = (e: React.DragEvent) => [...e.dataTransfer.types].includes('Files');
  return {
    over,
    handlers: {
      onDragEnter: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      },
      onDragOver: (e: React.DragEvent) => hasFiles(e) && e.preventDefault(),
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      },
      onDrop: async (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (!pictures.projectId) {
          toast('Pictures are kept with a project. Save this to one first.');
          pictures.askProject();
          return;
        }
        const ids = await pictures.upload([...e.dataTransfer.files]);
        if (ids.length) onAdd(ids);
      },
    },
  };
}

/** Drop pictures here: the outline shown while dragging over a table. */
export function DropHint({ over }: { over: boolean }) {
  if (!over) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-nia-blue bg-nia-blue/5 text-sm font-semibold text-foreground">
      Drop pictures to add shots
    </div>
  );
}

