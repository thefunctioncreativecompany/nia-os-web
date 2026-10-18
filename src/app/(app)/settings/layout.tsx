import Link from "next/link";

import { SettingsDescription, SettingsTabs } from "@/components/settings/settings-tabs";

// Shared header and tab bar for every settings tab.
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-15 md:px-15">
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/home"
          className="pb-4 text-sm leading-[1.4] font-bold text-muted-foreground hover:text-foreground"
        >
          ← Back to Home
        </Link>
        <h1 className="text-h2 font-bold text-foreground">Settings</h1>
        <SettingsDescription />
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
