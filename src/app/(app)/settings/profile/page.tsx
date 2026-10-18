import type { Metadata } from "next";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { sampleProfile } from "@/components/settings/sample-profile";

export const metadata: Metadata = {
  title: "Profile settings · Nia OS",
};

export default function Page() {
  // Sample data for now; loaded from Supabase in the next step.
  return <ProfileSettingsForm initial={sampleProfile} />;
}
