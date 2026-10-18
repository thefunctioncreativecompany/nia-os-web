"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsCard,
  SettingsField,
  settingsInputClassName,
} from "@/components/settings/settings-primitives";
import {
  COMMUNICATION_STYLES,
  TRAIT_PRESETS,
  type LinkedAccount,
  type ProfileSettings,
} from "@/components/settings/sample-profile";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB, per the design
const AVATAR_TYPES = ["image/jpeg", "image/png"];

const pillClassName =
  "rounded-[20px] px-4 py-2 text-[13px] leading-[1.4] font-semibold transition-colors";

export function ProfileSettingsForm({ initial }: { initial: ProfileSettings }) {
  const [profile, setProfile] = useState(initial);
  const set = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Saving is wired to Supabase in the next step.
    toast.info("Saving isn't connected yet.");
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SettingsCard title="Personal Identity">
          <AvatarPicker
            url={profile.avatarUrl}
            onChange={(url) => set("avatarUrl", url)}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField id="full-name" label="Full Name">
              <Input
                id="full-name"
                autoComplete="name"
                maxLength={80}
                value={profile.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={settingsInputClassName}
              />
            </SettingsField>
            <SettingsField id="role" label="Role">
              <Input
                id="role"
                maxLength={80}
                value={profile.role}
                onChange={(e) => set("role", e.target.value)}
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
                  value={profile.email}
                  className={cn(
                    settingsInputClassName,
                    "bg-nia-field-muted pr-11 text-nia-ink-muted focus-visible:border-nia-line focus-visible:ring-0",
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
                value={profile.phone}
                onChange={(e) => set("phone", e.target.value)}
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
              className={cn(
                settingsInputClassName,
                "field-sizing-fixed h-20 min-h-20 resize-none p-3",
              )}
            />
          </SettingsField>
        </SettingsCard>

        <SettingsCard title="AI Assistant Customization" className="gap-5">
          <SettingsField id="assistant-name" label="What should Nia call you?">
            <Input
              id="assistant-name"
              maxLength={40}
              value={profile.assistantName}
              onChange={(e) => set("assistantName", e.target.value)}
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
              <SelectTrigger
                id="communication-style"
                className={cn(settingsInputClassName, "w-full data-[size=default]:h-auto")}
              >
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
          <div className="flex items-center justify-between gap-6 border-b border-nia-line py-3">
            <label htmlFor="ai-suggestions" className="flex max-w-[400px] flex-col gap-1">
              <span className="text-sm leading-[1.4] font-bold text-nia-ink">
                Enable AI suggestions
              </span>
              <span className="text-[13px] leading-normal text-nia-ink-muted">
                Receive predictive notes during scripts breakdown imports
              </span>
            </label>
            <Switch
              id="ai-suggestions"
              size="lg"
              checked={profile.aiSuggestions}
              onCheckedChange={(checked) => set("aiSuggestions", checked)}
              className="data-checked:bg-nia-ink data-unchecked:bg-nia-line [&_[data-slot=switch-thumb]]:bg-[#fbfbfa]"
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Linked Identity Credentials" className="gap-4">
          <div className="flex flex-col">
            {profile.linkedAccounts.map((account, i) => (
              <LinkedAccountRow
                key={account.provider}
                account={account}
                divider={i < profile.linkedAccounts.length - 1}
              />
            ))}
          </div>
        </SettingsCard>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="h-auto rounded-[24px] bg-nia-ink px-8 py-3 text-sm leading-[1.4] font-bold text-white hover:bg-nia-ink/85"
        >
          Save Profile
        </Button>
      </div>
    </form>
  );
}

function AvatarPicker({
  url,
  onChange,
}: {
  url: string | null;
  onChange: (url: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the temporary preview URL when it's replaced.
  useEffect(() => {
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [url]);

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
    onChange(URL.createObjectURL(file));
  };

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        aria-label="Change profile picture"
        className="relative size-20 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-20 after:border-nia-line">
          <AvatarImage src={url ?? undefined} alt="" />
          {/* No photo yet: just the camera over a plain circle. */}
          <AvatarFallback className="bg-nia-chip" />
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(26,26,26,0.4)]">
          <Image src="/app/camera.svg" alt="" width={18} height={18} />
        </span>
      </button>
      <div className="flex flex-col gap-1">
        <span className="text-sm leading-[1.4] font-bold text-nia-ink">Profile Picture</span>
        <span className="text-xs leading-normal text-nia-ink-muted">JPG or PNG. Max 5MB.</span>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// Selected traits as dark pills (tap to remove). "+ Add Trait" offers the
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
    if (value && !traits.some((t) => t.toLowerCase() === value.toLowerCase())) {
      onChange([...traits, value]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span id="traits-label" className="text-[13px] leading-normal font-bold text-nia-ink">
        What traits should the assistant have?
      </span>
      <div role="group" aria-labelledby="traits-label" className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <button
            key={trait}
            type="button"
            onClick={() => onChange(traits.filter((t) => t !== trait))}
            aria-label={`Remove ${trait}`}
            className={cn(pillClassName, "bg-nia-ink text-white hover:bg-nia-ink/85")}
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
            "border border-nia-line text-nia-ink-muted hover:text-nia-ink",
          )}
        >
          {isAdding ? "Done" : "+ Add Trait"}
        </button>
      </div>
      {isAdding && (
        <div className="flex flex-wrap items-center gap-2">
          {remaining.map((trait) => (
            <button
              key={trait}
              type="button"
              onClick={() => add(trait)}
              className={cn(
                pillClassName,
                "border border-nia-line text-nia-ink hover:bg-nia-field-muted",
              )}
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
            className="h-auto w-40 rounded-[20px] border-nia-line px-4 py-2 text-[13px] leading-[1.4] md:text-[13px]"
          />
        </div>
      )}
    </div>
  );
}

const providers = {
  google: { name: "Google Workspace", logo: "/auth/google.svg", width: 16, height: 16 },
  apple: { name: "Apple Account", logo: "/auth/apple.svg", width: 13, height: 16 },
};

function LinkedAccountRow({ account, divider }: { account: LinkedAccount; divider: boolean }) {
  const provider = providers[account.provider];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        divider && "border-b border-nia-line",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nia-chip">
          <Image src={provider.logo} alt="" width={provider.width} height={provider.height} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm leading-[1.4] font-bold text-nia-ink">{provider.name}</span>
          <span className="truncate text-[13px] leading-normal text-nia-ink-muted">
            {account.email}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <Badge className="h-auto rounded-[12px] border-nia-success bg-nia-success-bg px-3 py-1 text-xs leading-normal font-bold text-nia-success">
          Connected
        </Badge>
        {account.canDisconnect && (
          <button
            type="button"
            className="text-[13px] leading-normal font-bold text-nia-ink-muted hover:text-nia-ink"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
