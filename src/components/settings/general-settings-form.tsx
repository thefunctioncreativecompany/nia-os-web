"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AUTO_SAVE_INTERVALS,
  DEFAULT_VIEWS,
  LANGUAGES,
  type GeneralSettings,
} from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { playSound, setSoundsOn, soundsOn, subscribeSounds } from "@/lib/sounds";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SettingsCard,
  SettingsField,
  SettingsSaveButton,
  SettingsToggleRow,
  settingsInputClassName,
  settingsSelectClassName,
} from "@/components/settings/settings-primitives";

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
  // Sounds are a choice for this device, so the switch acts at once rather than on Save.
  const sounds = useSyncExternalStore(subscribeSounds, soundsOn, () => true);
  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  // No saved time zone yet: show the browser's (unknown during server rendering).
  const browserTimeZone = useSyncExternalStore(
    noSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
  const timeZone = settings.timeZone ?? browserTimeZone;
  const timeZones = useTimeZoneOptions(timeZone);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const workspaceName = settings.workspaceName.trim();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          default_view: settings.defaultView,
          language: settings.language,
          time_zone: timeZone,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          weekly_digest: settings.weeklyDigest,
          auto_save_interval: settings.autoSaveInterval,
          version_history: settings.versionHistory,
        })
        .eq("user_id", userId);
      if (error) throw error;

      let workspaceId = settings.workspaceId;
      if (workspaceId && workspaceName) {
        const { error } = await supabase
          .from("workspaces")
          .update({ name: workspaceName })
          .eq("id", workspaceId);
        if (error) throw error;
      } else if (!workspaceId && workspaceName) {
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

      setSettings((s) => ({ ...s, workspaceId, workspaceName }));
      toast.success("Settings saved");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SettingsCard title="Workspace preferences" className="gap-5">
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField id="workspace-name" label="Workspace name">
              <Input
                id="workspace-name"
                maxLength={80}
                value={settings.workspaceName}
                onChange={(e) => set("workspaceName", e.target.value)}
                placeholder="e.g. Nia Productions"
                required={Boolean(settings.workspaceId)}
                className={settingsInputClassName}
              />
            </SettingsField>
            <SettingsField id="default-view" label="Default view">
              <Select
                value={settings.defaultView}
                onValueChange={(value) => set("defaultView", value as GeneralSettings["defaultView"])}
              >
                <SelectTrigger id="default-view" className={settingsSelectClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {DEFAULT_VIEWS.map((view) => (
                    <SelectItem key={view.value} value={view.value}>
                      {view.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <SettingsField id="language" label="Language">
              <Select value={settings.language} onValueChange={(value) => set("language", value)}>
                <SelectTrigger id="language" className={settingsSelectClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>
            <SettingsField id="time-zone" label="Time zone">
              <Select
                value={timeZone ?? undefined}
                onValueChange={(value) => set("timeZone", value)}
              >
                <SelectTrigger id="time-zone" className={settingsSelectClassName}>
                  <SelectValue placeholder="Choose a time zone" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {timeZones.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>
          </div>
        </SettingsCard>

        <SettingsCard title="Notification rules" className="gap-4">
          <div className="flex flex-col gap-2">
            <SettingsToggleRow
              id="email-notifications"
              title="Email notifications"
              description="Receive project updates via email"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => set("emailNotifications", checked)}
            />
            <SettingsToggleRow
              id="push-notifications"
              title="Push notifications"
              description="Real-time alerts for changes"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => set("pushNotifications", checked)}
            />
            <SettingsToggleRow
              id="weekly-digest"
              title="Weekly digest"
              description="Summary of weekly activity"
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => set("weeklyDigest", checked)}
            />
          </div>
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

        <SettingsCard title="System backups" className="gap-5">
          <SettingsField id="auto-save" label="Auto-save interval">
            <Select
              value={String(settings.autoSaveInterval)}
              onValueChange={(value) => set("autoSaveInterval", Number(value))}
            >
              <SelectTrigger id="auto-save" className={settingsSelectClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {AUTO_SAVE_INTERVALS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes === 1 ? "Every minute" : `Every ${minutes} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsToggleRow
            id="version-history"
            title="Version history"
            description="Store historical drafts and backups automatically"
            checked={settings.versionHistory}
            onCheckedChange={(checked) => set("versionHistory", checked)}
          />
        </SettingsCard>
      </div>

      <SettingsSaveButton isSaving={isSaving}>Save changes</SettingsSaveButton>
    </form>
  );
}

const noSubscribe = () => () => {};
// Generic zone names ("Pacific Time") don't change with the date, so any fixed day works.
const REFERENCE_DATE = new Date(Date.UTC(2026, 0, 1));

// Every IANA time zone, labelled like "Pacific Time — Los Angeles".
function useTimeZoneOptions(current: string | null) {
  return useMemo(() => {
    const zones = Intl.supportedValuesOf("timeZone");
    if (current && !zones.includes(current)) zones.push(current);
    return zones.map((zone) => {
      const city = zone.split("/").pop()?.replaceAll("_", " ") ?? zone;
      const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longGeneric" })
        .formatToParts(REFERENCE_DATE)
        .find((part) => part.type === "timeZoneName")?.value;
      return { value: zone, label: name && name !== city ? `${name} — ${city}` : city };
    });
  }, [current]);
}
