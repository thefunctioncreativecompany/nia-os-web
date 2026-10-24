"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { PRODUCTION_TYPES } from "@/lib/projects";
import { parseInstagramLink } from "@/lib/instagram";
import { recordEvent } from "@/lib/product-events";
import { addInstagramReference, readInstagramPost, type InstagramDraft } from "@/lib/instagram-post";
import type { Credit } from "@/features/explore/creators";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { fieldClassName, fieldLabelClassName, selectTriggerClassName } from "@/components/projects/project-form";

const NO_TYPE = "none";

// Paste an Instagram link into a project's references (Ika, 2026-10-22). Nia reads the post and
// opens a draft (cover, title, account, date, the caption's credits) to check; nothing is saved
// until "Add to references". A post Instagram won't share can still be added with a title.
export function AddInstagramReference({ projectId, held, onAdded }: { projectId: string; held: Set<string>; onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // The draft being checked; `draft: null` with a link is a post Instagram wouldn't share.
  const [checking, setChecking] = useState<{ link: string; draft: InstagramDraft | null; reason?: string } | null>(null);

  const read = async (value: string) => {
    if (reading || !value.trim()) return;
    setProblem(null);
    const link = parseInstagramLink(value);
    if (!link) {
      setProblem("That isn't a link to an Instagram post or reel. Copy it from the post's Share or ⋯ menu.");
      return;
    }
    if (held.has(link.code)) {
      setProblem("This post is already in the project's references.");
      return;
    }
    setReading(true);
    const result = await readInstagramPost(value).catch(() => ({ ok: false as const, error: "Couldn't reach Instagram. Try again.", link: undefined }));
    setReading(false);
    if (result.ok) setChecking({ link: result.draft.link, draft: result.draft });
    else if (result.link) setChecking({ link: result.link, draft: null, reason: result.error });
    else setProblem(result.error);
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        // Links are checked here, so "instagram.com/reel/…" without https:// is fine.
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void read(url);
        }}
        className="flex max-w-xl gap-3"
      >
        <Label htmlFor={`instagram-link-${projectId}`} className="sr-only">
          Instagram link
        </Label>
        <Input
          id={`instagram-link-${projectId}`}
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setProblem(null);
          }}
          // A pasted link is read straight away.
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (parseInstagramLink(text)) {
              e.preventDefault();
              setUrl(text.trim());
              void read(text);
            }
          }}
          placeholder="Paste an Instagram link..."
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `instagram-link-problem-${projectId}` : undefined}
          className="h-auto flex-1 rounded-lg border-border px-4 py-3 text-sm md:text-sm"
        />
        <Button type="submit" variant="outline" disabled={reading || !url.trim()} className="h-auto rounded-lg px-4 py-3 text-small font-bold">
          {reading ? (
            <>
              <Spinner aria-hidden /> Reading…
            </>
          ) : (
            "Add"
          )}
        </Button>
      </form>
      <p id={`instagram-link-problem-${projectId}`} aria-live="polite" className={cn("text-small", problem ? "text-destructive" : "text-muted-foreground")}>
        {problem ?? "Only people on this project can see links you add."}
      </p>

      {checking && (
        <CheckDraft
          projectId={projectId}
          link={checking.link}
          draft={checking.draft}
          reason={checking.reason}
          onClose={() => setChecking(null)}
          onAdded={() => {
            setChecking(null);
            setUrl("");
            recordEvent("reference_added", { projectId, props: { from: "instagram" } });
            onAdded();
          }}
        />
      )}
    </div>
  );
}

function CheckDraft({
  projectId,
  link,
  draft,
  reason,
  onClose,
  onAdded,
}: {
  projectId: string;
  link: string;
  draft: InstagramDraft | null;
  reason?: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState(draft?.title ?? "");
  const [productionType, setProductionType] = useState(NO_TYPE);
  const [note, setNote] = useState("");
  const [credits, setCredits] = useState<Credit[]>(draft?.credits ?? []);
  const [saving, setSaving] = useState(false);
  const posted = draft?.postedOn ? new Date(`${draft.postedOn}T12:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await addInstagramReference(projectId, {
      link,
      title,
      productionType: productionType === NO_TYPE ? null : productionType,
      note,
      credits,
    }).catch(() => ({ ok: false as const, error: "Couldn't add it. Try again." }));
    setSaving(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(`Added ${title.trim()} to references.`);
    onAdded();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[760px] flex-col gap-7 overflow-y-auto rounded-2xl p-6 sm:max-w-[760px] sm:p-10">
        <DialogTitle className="text-h2 font-bold">Add to references</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {draft
            ? "Check what Nia read from the post. Only people on this project will see it."
            : `${reason ?? "Instagram didn't share this post."} You can still add the link with a title of your own.`}
        </DialogDescription>
        <form onSubmit={save} className="flex flex-col gap-7">
          <div className={cn("grid gap-7", draft?.preview && "sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]")}>
            {draft?.preview && (
              <div className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- a draft's cover, sent inline before anything is saved */}
                <img src={draft.preview} alt="" className="w-full rounded-lg bg-muted object-cover" style={{ aspectRatio: draft.aspect ?? undefined }} />
                <p className="text-caption text-muted-foreground">
                  {[draft.account && `@${draft.account}`, posted].filter(Boolean).join(" · ")}
                </p>
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reference-title" className={fieldLabelClassName}>
                  Title
                </Label>
                <Input id="reference-title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClassName} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reference-type" className={fieldLabelClassName}>
                  Production type
                </Label>
                <Select value={productionType} onValueChange={setProductionType}>
                  <SelectTrigger id="reference-type" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={NO_TYPE}>Not set</SelectItem>
                    {PRODUCTION_TYPES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reference-note" className={fieldLabelClassName}>
                  Note <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="reference-note"
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What to take from it: the light, the edit, the casting..."
                  className={cn(fieldClassName, "field-sizing-fixed h-20 min-h-20 resize-none")}
                />
              </div>
            </div>
          </div>

          {credits.length > 0 && (
            <section aria-labelledby="reference-credits" className="flex flex-col gap-3">
              <h3 id="reference-credits" className="text-sm font-bold text-foreground">
                Credits from the caption <span className="text-micro font-normal text-muted-foreground">{credits.length}</span>
              </h3>
              <p className="-mt-1 text-small text-muted-foreground">Remove any that aren&rsquo;t credits.</p>
              <ul className="flex max-h-60 flex-col overflow-y-auto rounded-lg border border-border">
                {credits.map((c, i) => (
                  <li key={`${c.role}-${i}`} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                    <span className="w-36 shrink-0 truncate text-small font-bold text-foreground">{c.role}</span>
                    <span className="min-w-0 flex-1 truncate text-small text-muted-foreground">{c.handle && c.name === c.handle ? `@${c.name}` : c.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${c.role}: ${c.name}`}
                      onClick={() => setCredits((list) => list.filter((_, j) => j !== i))}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <X aria-hidden className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-auto rounded-lg px-6 py-3 text-lead font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()} className="h-auto rounded-lg px-6 py-3 text-lead font-semibold">
              {saving ? "Adding…" : "Add to references"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
