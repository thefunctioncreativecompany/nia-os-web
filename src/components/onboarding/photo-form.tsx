"use client";

import { useRef, useState } from "react";
import { Crop, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";

import { AVATAR_BUCKET, MAX_AVATAR_BYTES, avatarPath, initials } from "@/lib/avatars";
import { nextStepHref } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  OnboardingActions,
  OnboardingStep,
} from "@/components/onboarding/onboarding-primitives";
import {
  DEFAULT_ADJUSTMENTS,
  PhotoEditor,
  type PhotoAdjustments,
} from "@/components/onboarding/photo-editor";
import { useStepSubmit } from "@/components/onboarding/use-step-submit";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"];

const toolButtonClassName =
  "h-9 min-w-0 flex-1 gap-2 rounded-md sm:w-[120px] sm:flex-none border-border bg-muted px-3 text-[13px] leading-normal font-medium text-foreground";

export function PhotoForm({
  userId,
  fullName,
  email,
  avatarUrl,
}: {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The original photo they picked (re-edited from scratch each time) and how it's framed.
  const [source, setSource] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [editor, setEditor] = useState<"Edit photo" | "Crop photo" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isPending, submit } = useStepSubmit("photo");

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("That image is over 5MB. Choose a smaller one.");
      return;
    }
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setEditor("Crop photo");
  };

  const applyEdit = ({ blob, adjustments }: { blob: Blob; adjustments: PhotoAdjustments }) => {
    if (result) URL.revokeObjectURL(result.url);
    setResult({ blob, url: URL.createObjectURL(blob) });
    setAdjustments(adjustments);
    setEditor(null);
  };

  const cancelEdit = () => {
    setEditor(null);
    // Cancelled straight after picking: forget that photo.
    if (!result && source) {
      URL.revokeObjectURL(source);
      setSource(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(async () => {
      if (!result) return;
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, result.blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;

      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (error) throw error;

      // Remove the photo this one replaced, if it was one of ours.
      const oldPath = avatarPath(avatarUrl, userId);
      if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
    });
  };

  const preview = result?.url ?? avatarUrl;

  return (
    <OnboardingStep centered step="photo" title="Add a profile photo" description="Help your team recognize you">
      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          aria-label="Choose a profile photo"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex size-[140px] items-center justify-center rounded-full border-2 border-dashed bg-white p-2 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            isDragging ? "border-primary bg-muted" : "border-border hover:border-ring",
          )}
        >
          <Avatar className="size-full after:hidden">
            {preview && <AvatarImage src={preview} alt="" className="object-cover" />}
            <AvatarFallback className="bg-primary text-2xl leading-[1.3] font-bold text-primary-foreground">
              {initials(fullName, email)}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex flex-col gap-1 text-muted-foreground">
          <p className="text-sm leading-normal">
            Drag &amp; drop or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-sm text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              browse files
            </button>
          </p>
          <p className="text-xs leading-normal">JPG, PNG or GIF. Max 5MB</p>
        </div>

        <div className="flex w-full justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className={toolButtonClassName}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden />
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            className={toolButtonClassName}
            disabled={!source}
            onClick={() => setEditor("Edit photo")}
          >
            <Pencil aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className={toolButtonClassName}
            disabled={!source}
            onClick={() => setEditor("Crop photo")}
          >
            <Crop aria-hidden />
            Crop
          </Button>
        </div>

        <OnboardingActions skipHref={nextStepHref("photo")} skipLabel="Skip" isPending={isPending} className="gap-4" />
      </form>

      {source && editor && (
        <PhotoEditor
          open
          key={`${source}-${editor}`}
          title={editor}
          src={source}
          initial={adjustments}
          onCancel={cancelEdit}
          onApply={applyEdit}
        />
      )}
    </OnboardingStep>
  );
}
