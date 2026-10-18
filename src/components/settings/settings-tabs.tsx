"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

// segment is the folder under /settings; href is null until that tab's screen is built.
const tabs = [
  { label: "General", segment: "general", href: null },
  { label: "Profile", segment: "profile", href: "/settings/profile" },
  { label: "Notifications", segment: "notifications", href: null },
  { label: "Connected Apps", segment: "connected-apps", href: null },
  { label: "Security", segment: "security", href: null },
  { label: "Shortcuts", segment: "shortcuts", href: null },
] as const;

export function SettingsTabs() {
  const segment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Settings"
      className="-mx-4 flex h-12 items-end gap-8 overflow-x-auto border-b border-nia-line px-4 whitespace-nowrap md:mx-0 md:px-0"
    >
      {tabs.map((tab) =>
        tab.href && tab.segment === segment ? (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current="page"
            className="flex h-full flex-col justify-end gap-3 text-sm leading-[1.4] font-bold text-nia-ink"
          >
            {tab.label}
            <span className="h-[3px] w-full rounded-[1.5px] bg-nia-ink" />
          </Link>
        ) : tab.href ? (
          <Link
            key={tab.label}
            href={tab.href}
            className="pb-[3px] text-sm leading-normal font-medium text-nia-ink-muted hover:text-nia-ink"
          >
            {tab.label}
          </Link>
        ) : (
          <span
            key={tab.label}
            aria-disabled="true"
            title="Coming soon"
            className="cursor-not-allowed pb-[3px] text-sm leading-normal font-medium text-nia-ink-muted"
          >
            {tab.label}
          </span>
        ),
      )}
    </nav>
  );
}
