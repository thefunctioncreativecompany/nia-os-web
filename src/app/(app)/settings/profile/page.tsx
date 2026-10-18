import { Suspense } from "react";
import type { Metadata } from "next";

import { getProfileSettings } from "@/lib/settings-data";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";

export const metadata: Metadata = {
  title: "Profile settings · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<SettingsSkeleton cards={3} />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const { userId, email, identities, profile } = await getProfileSettings();
  return (
    <ProfileSettingsForm userId={userId} email={email} identities={identities} initial={profile} />
  );
}
