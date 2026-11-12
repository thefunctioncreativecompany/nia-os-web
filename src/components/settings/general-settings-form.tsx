"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { GeneralSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { playSound, setSoundsOn, soundsOn, subscribeSounds } from "@/lib/sounds";
import { setTheme, subscribeTheme, THEME_CHOICES, themeChoice } from "@/lib/theme";
import { ChoicePills } from "@/components/nia/choice-pills";
import { Input } from "@/components/ui/input";
import {
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
  SettingsToggleRow,
  settingsInputClassName,
} from "@/components/settings/settings-primitives";

// Only settings that work (Ika, 2026-11-12). Notifications, weekly digest, default view, language,
// time zone, auto-save and version history were removed until they do something: git tag
// parked-2026-11-12-settings; their `user_settings` columns are still in the database.
export function GeneralSettingsForm({
  userId,
  initial,
}: {
  userId: string;
  initial: GeneralSettings;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  // Appearance and sounds are choices for this device, so they act at once rather than on Save.
  const sounds = useSyncExternalStore(subscribeSounds, soundsOn, () => true);
  const theme = useSyncExternalStore(subscribeTheme, themeChoice, () => "system" as const);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const workspaceName = settings.workspaceName.trim();
    if (!workspaceName) return;
    setIsSaving(true);

    try {
      let workspaceId = settings.workspaceId;
      if (workspaceId) {
        const { error } = await supabase
          .from("workspaces")
          .update({ name: workspaceName })
          .eq("id", workspaceId);
        if (error) throw error;
      } else {
        // First save with a name: create the workspace and join it.
        const { data, error } = await supabase
          .from("workspaces")
          .insert({ name: workspaceName, owner_id: userId })
          .select("id")
          .single();
        if (error) throw error;
        workspaceId = data.id;
        const { error: memberError } = await supabase
          .from("workspace_members")
          .insert({ workspace_id: workspaceId, user_id: userId });
        if (memberError) throw memberError;
      }

      setSettings({ workspaceId, workspaceName });
      toast.success("Settings saved");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave}>
        <SettingsCard title="Workspace" className="gap-5">
          <SettingsField id="workspace-name" label="Workspace name">
            <Input
              id="workspace-name"
              maxLength={80}
              value={settings.workspaceName}
              onChange={(e) => setSettings((s) => ({ ...s, workspaceName: e.target.value }))}
              placeholder="e.g. Nia Productions"
              required
              className={settingsInputClassName}
            />
          </SettingsField>
          <SettingsSaveButton isSaving={isSaving}>Save name</SettingsSaveButton>
        </SettingsCard>
      </form>

      <SettingsCard title="Appearance" className="gap-3">
        <p className="text-small text-muted-foreground">Light or dark, on this device.</p>
        <ChoicePills label="Appearance" options={THEME_CHOICES} value={theme} onChange={setTheme} />
      </SettingsCard>

      <SettingsCard title="Sound" className="gap-4">
        <SettingsToggleRow
          id="interface-sounds"
          title="Interface sounds"
          description="Soft sounds when something saves, when you switch tabs or something needs a look, and quiet ambience on Explore all. On this device."
          checked={sounds}
          onCheckedChange={(checked) => {
            setSoundsOn(checked);
            if (checked) playSound("success");
          }}
        />
      </SettingsCard>
    </div>
  );
}
