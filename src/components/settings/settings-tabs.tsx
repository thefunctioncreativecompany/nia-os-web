"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

// segment is the folder under /settings; built: false until that tab's screen exists.
const tabs = [
  {
    label: "General",
    segment: "general",
    built: true,
    description: "Manage your workspace and preferences",
  },
  {
    label: "Profile",
    segment: "profile",
    built: true,
    description: "Manage your workspace and preferences",
  },
  {
    label: "Notifications",
    segment: "notifications",
    built: false,
    description: "Choose what Nia tells you about, and where",
  },
  {
    label: "Connected Apps",
    segment: "connected-apps",
    built: false,
    description: "Manage your workspace and preferences",
  },
  {
    label: "Security",
    segment: "security",
    built: false,
    description: "Manage your security credentials, sessions, and data privacy",
  },
  {
    label: "Shortcuts",
    segment: "shortcuts",
    built: false,
    description: "Learn core screen keyboard controls and production hotkeys",
  },
] as const;

// The subtitle under "Settings" changes per tab in the Figma.
export function SettingsDescription() {
  const segment = useSelectedLayoutSegment();
  const tab = tabs.find((t) => t.segment === segment) ?? tabs[0];
  return <p className="text-lead text-muted-foreground">{tab.description}</p>;
}

export function SettingsTabs() {
  const segment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Settings"
      className="-mx-4 flex h-12 items-end gap-8 overflow-x-auto border-b border-border px-4 whitespace-nowrap md:mx-0 md:px-0"
    >
      {tabs.map((tab) =>
        !tab.built ? (
          <span
            key={tab.label}
            aria-disabled="true"
            title="Coming soon"
            className="cursor-not-allowed pb-[3px] text-sm leading-normal font-medium text-muted-foreground/70"
          >
            {tab.label}
          </span>
        ) : tab.segment === segment ? (
          <Link
            key={tab.label}
            href={`/settings/${tab.segment}`}
            aria-current="page"
            className="flex h-full flex-col justify-end gap-3 text-sm leading-[1.4] font-bold text-foreground"
          >
            {tab.label}
            <span className="h-[3px] w-full rounded-[1.5px] bg-gold" />
          </Link>
        ) : (
          <Link
            key={tab.label}
            href={`/settings/${tab.segment}`}
            className="pb-[3px] text-sm leading-normal font-medium text-muted-foreground hover:text-foreground"
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}
