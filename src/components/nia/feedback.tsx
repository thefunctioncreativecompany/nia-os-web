"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ImagePlus, MessageSquare, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { currentUser } from "@/lib/supabase/current-user";
import { PULSES, PULSE_EVENT, markAsked, type ProductEvent } from "@/lib/product-events";
import { playSound } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChoicePills } from "@/components/nia/choice-pills";
import { CountedTextarea } from "@/components/nia/counted-textarea";

// Feedback for the MVP pilot (Ika, 2026-10-23), saved to `feedback`
// (supabase/migrations/20261105000000_feedback.sql) with the page it came from. The team reads it
// in the SQL Editor (`feedback_review`, with each tester's profession).

type Kind = "broken" | "confusing" | "idea" | "other";
const KINDS: { value: Kind; label: string }[] = [
  { value: "broken", label: "Something's broken" },
  { value: "confusing", label: "Something's confusing" },
  { value: "idea", label: "An idea" },
  { value: "other", label: "Something else" },
];
const MAX = 2000;
const SHOT_MB = 10;
const EVENT = "nia:feedback";

/** Opens "Send feedback" from anywhere (the profile menu, the Feedback button). */
export function openFeedback() {
  window.dispatchEvent(new Event(EVENT));
}

// Mounted once in the app shell: the dialog, a Feedback button in the corner on wide screens
// (phones send it from the profile menu), and the question asked after a job is first done.
export function Feedback() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="compact"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-white shadow-elevation-2 max-lg:hidden print:hidden"
      >
        <MessageSquare aria-hidden /> Feedback
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
      <PulsePrompt />
    </>
  );
}

function FeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const page = usePathname();
  const [kind, setKind] = useState<Kind | null>(null);
  const [message, setMessage] = useState("");
  const [shot, setShot] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    setKind(null);
    setMessage("");
    setShot(null);
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Attach a picture, like a screenshot.");
    if (file.size > SHOT_MB * 1e6) return void toast.error(`Screenshots can be up to ${SHOT_MB} MB.`);
    setShot(file);
  };

  const send = async () => {
    if (!kind || !message.trim()) return;
    setSending(true);
    const supabase = createClient();
    const user = await currentUser(supabase);
    if (!user) {
      setSending(false);
      return void toast.error("Sign in again to send feedback.");
    }
    let screenshot: string | null = null;
    if (shot) {
      const path = `${user.id}/${crypto.randomUUID()}.${shot.name.split(".").pop()?.toLowerCase() || "png"}`;
      const { error } = await supabase.storage.from("feedback").upload(path, shot, { contentType: shot.type });
      if (!error) screenshot = path;
    }
    const { error } = await supabase.from("feedback").insert({ kind, message: message.trim(), page, screenshot_path: screenshot });
    setSending(false);
    if (error) return void toast.error("Couldn't send it. Try again in a moment.");
    toast.success("Thanks, the Nia team will read it.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (onOpenChange(next), !next && reset())}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-120 gap-5 rounded-2xl p-6 sm:max-w-120 sm:p-7">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-h3 font-semibold tracking-tight">Send feedback</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">Tell us what happened or what would help. We read every one.</DialogDescription>
        </DialogHeader>
        <ChoicePills label="What is it about?" options={KINDS} value={kind} onChange={setKind} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="feedback-message">What happened, or what would help?</Label>
          <CountedTextarea
            id="feedback-message"
            value={message}
            onChange={setMessage}
            maxLength={MAX}
            rows={5}
            placeholder="e.g. I couldn't find where to add the call time for day 2."
          />
        </div>
        <div className="flex items-center gap-3">
          <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
          {shot ? (
            <span className="flex min-w-0 items-center gap-2 rounded-full bg-muted py-1 pr-1 pl-3 text-small text-foreground">
              <span className="truncate">{shot.name}</span>
              <Button variant="ghost" size="icon-xs" aria-label="Remove screenshot" onClick={() => setShot(null)}>
                <X aria-hidden />
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="compact" onClick={() => input.current?.click()}>
              <ImagePlus aria-hidden /> Attach a screenshot
            </Button>
          )}
        </div>
        <DialogFooter className="flex-row justify-end gap-2.5 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!kind || !message.trim() || sending} onClick={() => void send()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The one question after someone first does a job (a project made, a document downloaded, crew
// invited): thumbs up or down, then an optional line on why. Asked once per job; closing it
// counts as asked.
function PulsePrompt() {
  const page = usePathname();
  const [job, setJob] = useState<ProductEvent | null>(null);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [why, setWhy] = useState("");

  useEffect(() => {
    const ask = (e: Event) => {
      const next = (e as CustomEvent<{ job: ProductEvent }>).detail.job;
      setJob((current) => current ?? next);
      setRating(null);
      setWhy("");
    };
    window.addEventListener(PULSE_EVENT, ask);
    return () => window.removeEventListener(PULSE_EVENT, ask);
  }, []);

  if (!job) return null;
  const question = PULSES[job]!;

  const done = () => {
    markAsked(job);
    setJob(null);
  };
  const send = async (answer: 1 | -1, note: string) => {
    done();
    const { error } = await createClient().from("feedback").insert({ kind: "pulse", job, rating: answer, message: note.trim() || null, page });
    if (!error) playSound("success");
  };

  return (
    <section
      aria-label="A quick question"
      className={cn(
        "fixed right-4 bottom-28 z-40 flex w-[min(22rem,calc(100%-2rem))] flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-elevation-2 lg:right-6 lg:bottom-20 print:hidden",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-base ease-out motion-reduce:animate-none",
      )}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-semibold text-foreground">{question}</p>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={done}>
          <X aria-hidden />
        </Button>
      </div>
      {rating === null ? (
        <div className="flex gap-2">
          <Button variant="outline" size="compact" onClick={() => setRating(1)}>
            <ThumbsUp aria-hidden /> Yes
          </Button>
          <Button variant="outline" size="compact" onClick={() => setRating(-1)}>
            <ThumbsDown aria-hidden /> Not really
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="pulse-why" className="text-small text-muted-foreground">
            {rating === 1 ? "What worked well? (optional)" : "What would have made it better? (optional)"}
          </Label>
          <CountedTextarea id="pulse-why" value={why} onChange={setWhy} maxLength={MAX} rows={3} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="compact" onClick={() => void send(rating, "")}>
              Skip
            </Button>
            <Button size="compact" onClick={() => void send(rating, why)}>
              Send
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
