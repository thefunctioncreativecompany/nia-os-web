"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@/lib/utils";

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
    label: "Connected apps",
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
      {tabs.map((tab) => {
        const active = tab.built && tab.segment === segment;
        // Every tab has the same shape (its name over a 3px underline, Nia Blue on the active one),
        // so the names line up whichever tab is open.
        const inner = (
          <>
            {tab.label}
            <span aria-hidden className={cn("h-0.75 w-full rounded-full", active ? "bg-nia-blue" : "bg-transparent")} />
          </>
        );
        const shape = "flex h-full flex-col justify-end gap-3 text-sm leading-[1.4] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
        if (!tab.built) {
          return (
            <span key={tab.label} aria-disabled="true" title="Coming soon" className={cn(shape, "cursor-not-allowed font-medium text-muted-foreground/70")}>
              {inner}
            </span>
          );
        }
        return (
          <Link
            key={tab.label}
            href={`/settings/${tab.segment}`}
            aria-current={active ? "page" : undefined}
            className={cn(shape, active ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground")}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
