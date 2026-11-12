
import { SettingsDescription, SettingsTabs } from "@/components/settings/settings-tabs";
import { BackLink } from "@/components/nia/back-link";

// Shared header and tab bar for every settings tab.
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-15 md:px-page">
      <div className="flex flex-col items-start gap-3">
        <BackLink
          href="/home"
          className="pb-4 text-sm leading-[1.4] font-bold text-muted-foreground hover:text-foreground"
        >
          ← Back to Home
        </BackLink>
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">Settings</h1>
        <SettingsDescription />
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
