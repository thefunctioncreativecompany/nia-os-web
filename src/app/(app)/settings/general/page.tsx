import { Suspense } from "react";
import type { Metadata } from "next";

import { getGeneralSettings } from "@/lib/settings-data";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";

export const metadata: Metadata = {
  title: "General settings · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<SettingsSkeleton cards={3} />}>
      <General />
    </Suspense>
  );
}

async function General() {
  const { userId, settings } = await getGeneralSettings();
  return <GeneralSettingsForm userId={userId} initial={settings} />;
}
