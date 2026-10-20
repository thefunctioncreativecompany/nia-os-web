"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { UserIdentity } from "@supabase/supabase-js";
import { toast } from "sonner";

import {
  COMMUNICATION_STYLES,
  TRAIT_PRESETS,
  type ProfileSettings,
} from "@/lib/settings";
import { AVATAR_BUCKET, MAX_AVATAR_BYTES, avatarPath } from "@/lib/avatars";
import { PhotoEditor } from "@/components/nia/photo-editor";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
  SettingsToggleRow,
  settingsInputClassName,
  settingsSelectClassName,
} from "@/components/settings/settings-primitives";

const AVATAR_TYPES = ["image/jpeg", "image/png"];

const pillClassName =
  "rounded-full px-4 py-2 text-small leading-[1.4] font-semibold transition-colors";

export function ProfileSettingsForm({
  userId,
  email,
  identities,
  initial,
}: {
  userId: string;
  email: string;
  identities: UserIdentity[];
  initial: ProfileSettings;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const set = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsSaving(true);

    try {
      const previousAvatarUrl = profile.avatarUrl;
      let avatarUrl = previousAvatarUrl;

      if (avatarFile) {
        // Each user uploads into their own folder: avatars/<user id>/...
        const extension = avatarFile.type === "image/png" ? "png" : "jpg";
        const path = `${userId}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, avatarFile, { contentType: avatarFile.type });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.fullName.trim(),
          role: profile.role.trim(),
          phone: profile.phone.trim(),
          bio: profile.bio.trim(),
          avatar_url: avatarUrl,
          assistant_name: profile.assistantName.trim(),
          assistant_traits: profile.assistantTraits,
          communication_style: profile.communicationStyle,
          ai_suggestions: profile.aiSuggestions,
        })
        .eq("id", userId);
      if (error) throw error;

      // Remove the photo this one replaced, if it was one of ours.
      const oldPath = avatarPath(previousAvatarUrl, userId);
      if (avatarFile && oldPath && avatarUrl !== previousAvatarUrl) {
        await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
      }

      setProfile((p) => ({ ...p, avatarUrl }));
      setAvatarFile(null);
      toast.success("Profile saved");
      // Re-load server data so the navbar shows the new name and photo.
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SettingsCard title="Personal identity">
          <AvatarPicker
            preview={preview}
            onPick={(file, url) => {
              setAvatarFile(file);
              setPreview(url);
            }}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField id="full-name" label="Full name">
              <Input
                id="full-name"
                autoComplete="name"
                maxLength={80}
                value={profile.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Your name"
                className={settingsInputClassName}
              />
            </SettingsField>
            <SettingsField id="role" label="Role">
              <Input
                id="role"
                maxLength={80}
                value={profile.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. Executive Producer"
                className={settingsInputClassName}
              />
            </SettingsField>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField id="email" label="Email">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  readOnly
                  aria-describedby="email-locked"
                  value={email}
                  className={cn(
                    settingsInputClassName,
                    "bg-muted pr-11 text-muted-foreground focus-visible:border-border focus-visible:ring-0",
                  )}
                />
                <Image
                  src="/app/lock.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                />
                <span id="email-locked" className="sr-only">
                  Your sign-in email can&apos;t be changed here.
                </span>
              </div>
            </SettingsField>
            <SettingsField id="phone" label="Phone">
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                value={profile.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (310) 555-0142"
                className={settingsInputClassName}
              />
            </SettingsField>
          </div>
          <SettingsField id="bio" label="Bio">
            <Textarea
              id="bio"
              maxLength={500}
              value={profile.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="A line or two about your work"
              className={cn(
                settingsInputClassName,
                "field-sizing-fixed h-20 min-h-20 resize-none p-3",
              )}
            />
          </SettingsField>
        </SettingsCard>

        <SettingsCard title="AI assistant customization" className="gap-5">
          <SettingsField id="assistant-name" label="What should Nia call you?">
            <Input
              id="assistant-name"
              maxLength={40}
              value={profile.assistantName}
              onChange={(e) => set("assistantName", e.target.value)}
              placeholder="Your first name or a nickname"
              className={settingsInputClassName}
            />
          </SettingsField>
          <TraitPicker
            traits={profile.assistantTraits}
            onChange={(traits) => set("assistantTraits", traits)}
          />
          <SettingsField id="communication-style" label="Communication style">
            <Select
              value={profile.communicationStyle}
              onValueChange={(value) => set("communicationStyle", value)}
            >
              <SelectTrigger id="communication-style" className={settingsSelectClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {COMMUNICATION_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsToggleRow
            id="ai-suggestions"
            title="Enable AI suggestions"
            description="Receive predictive notes during scripts breakdown imports"
            checked={profile.aiSuggestions}
            onCheckedChange={(checked) => set("aiSuggestions", checked)}
          />
        </SettingsCard>

        <SettingsCard title="Linked identity credentials" className="gap-4">
          <LinkedAccounts identities={identities} />
        </SettingsCard>
      </div>

      <SettingsSaveButton isSaving={isSaving}>Save profile</SettingsSaveButton>
    </form>
  );
}

// "https://…/storage/v1/object/public/avatars/<user id>/avatar-1.png" → "<user id>/avatar-1.png"
function AvatarPicker({
  preview,
  onPick,
}: {
  preview: string | null;
  onPick: (file: File, previewUrl: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  // The picked photo waiting in the cropper.
  const [editing, setEditing] = useState<string | null>(null);

  // Free the temporary preview URL when it's replaced.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Please choose an image smaller than 5 MB.");
      return;
    }
    setEditing(URL.createObjectURL(file));
  };

  const closeEditor = () => {
    if (editing) URL.revokeObjectURL(editing);
    setEditing(null);
  };

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        aria-label="Change profile picture"
        className="relative size-20 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-20 after:border-border">
          <AvatarImage src={preview ?? undefined} alt="" />
          {/* No photo yet: just the camera over a plain circle. */}
          <AvatarFallback className="bg-accent" />
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(26,26,26,0.4)]">
          <Image src="/app/camera.svg" alt="" width={18} height={18} />
        </span>
      </button>
      <div className="flex flex-col gap-1">
        <span className="text-sm leading-[1.4] font-bold text-foreground">Profile picture</span>
        <span className="text-xs leading-normal text-muted-foreground">JPG or PNG. Max 5MB.</span>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        className="hidden"
        onChange={handleFile}
      />
      {editing && (
        <PhotoEditor
          open
          title="Frame your photo"
          src={editing}
          onCancel={closeEditor}
          onApply={({ blob }) => {
            closeEditor();
            onPick(new File([blob], "avatar.jpg", { type: "image/jpeg" }), URL.createObjectURL(blob));
          }}
        />
      )}
    </div>
  );
}

// Selected traits as dark pills (tap to remove). "+ Add trait" offers the
// remaining presets and a box for your own.
function TraitPicker({
  traits,
  onChange,
}: {
  traits: string[];
  onChange: (traits: string[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [custom, setCustom] = useState("");
  const remaining = TRAIT_PRESETS.filter((t) => !traits.includes(t));

  const add = (trait: string) => {
    const value = trait.trim();
    if (
      value &&
      traits.length < 20 &&
      !traits.some((t) => t.toLowerCase() === value.toLowerCase())
    ) {
      onChange([...traits, value]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span id="traits-label" className="text-small leading-normal font-bold text-foreground">
        What traits should the assistant have?
      </span>
      <div role="group" aria-labelledby="traits-label" className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <button
            key={trait}
            type="button"
            onClick={() => onChange(traits.filter((t) => t !== trait))}
            aria-label={`Remove ${trait}`}
            className={cn(pillClassName, "bg-primary text-primary-foreground hover:bg-primary/85")}
          >
            {trait}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          aria-expanded={isAdding}
          className={cn(
            pillClassName,
            "border border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {isAdding ? "Done" : "+ Add trait"}
        </button>
      </div>
      {isAdding && (
        <div className="flex flex-wrap items-center gap-2">
          {remaining.map((trait) => (
            <button
              key={trait}
              type="button"
              onClick={() => add(trait)}
              className={cn(pillClassName, "border border-border text-foreground hover:bg-muted")}
            >
              + {trait}
            </button>
          ))}
          <Input
            aria-label="Add your own trait"
            placeholder="Your own trait"
            maxLength={30}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(custom);
                setCustom("");
              }
            }}
            className="h-auto w-40 rounded-full border-border px-4 py-2 text-small leading-[1.4] md:text-small"
          />
        </div>
      )}
    </div>
  );
}

const providers = [
  { id: "google", name: "Google Workspace", logo: "/auth/google.svg", width: 16, height: 16 },
  { id: "apple", name: "Apple Account", logo: "/auth/apple.svg", width: 13, height: 16 },
] as const;

// Google and Apple sign-in linked to this account, via Supabase identity linking.
// Linking needs "Allow manual linking" on in Supabase → Authentication → Sign In / Providers.
function LinkedAccounts({ identities }: { identities: UserIdentity[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const connect = async (provider: "google" | "apple") => {
    setBusy(provider);
    const { error } = await createClient().auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/confirm?next=/settings/profile`,
      },
    });
    // On success the browser is already leaving for the provider.
    if (error) {
      toast.error(error.message);
      setBusy(null);
    }
  };

  const disconnect = async (identity: UserIdentity) => {
    setBusy(identity.provider);
    const { error } = await createClient().auth.unlinkIdentity(identity);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account disconnected");
    router.refresh();
  };

  return (
    <div className="flex flex-col">
      {providers.map((provider, i) => {
        const identity = identities.find((id) => id.provider === provider.id);
        const identityEmail = identity?.identity_data?.email as string | undefined;
        // Supabase won't remove the only way left to sign in.
        const canDisconnect = Boolean(identity) && identities.length > 1;

        return (
          <div
            key={provider.id}
            className={cn(
              "flex items-center justify-between gap-4 py-3",
              i < providers.length - 1 && "border-b border-border",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent">
                <Image src={provider.logo} alt="" width={provider.width} height={provider.height} />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm leading-[1.4] font-bold text-foreground">
                  {provider.name}
                </span>
                <span className="truncate text-small leading-normal text-muted-foreground">
                  {identity ? (identityEmail ?? "Connected") : "Not connected"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {identity ? (
                <>
                  <Badge className="h-auto rounded-full border-nia-success bg-nia-success-bg px-3 py-1 text-xs leading-normal font-bold text-nia-success">
                    Connected
                  </Badge>
                  {canDisconnect && (
                    <button
                      type="button"
                      onClick={() => disconnect(identity)}
                      disabled={busy !== null}
                      className="text-small leading-normal font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {busy === provider.id ? "Disconnecting..." : "Disconnect"}
                    </button>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => connect(provider.id)}
                  disabled={busy !== null}
                  className="h-auto rounded-full border-border px-4 py-2 text-small leading-[1.4] font-bold"
                >
                  {busy === provider.id ? "Redirecting..." : "Connect"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
