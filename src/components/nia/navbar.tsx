"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Tab = {
  label: string;
  icon: string;
  // null until the screen is built.
  href: string | null;
  // Paths that show this tab as active.
  match: string[];
};

const tabs: Tab[] = [
  { label: "Home", icon: "/app/home.svg", href: "/dashboard", match: ["/dashboard", "/settings"] },
  { label: "Projects", icon: "/app/folder.svg", href: null, match: [] },
  { label: "Templates", icon: "/app/file-text.svg", href: null, match: [] },
  { label: "Explore", icon: "/app/explore.svg", href: null, match: [] },
  { label: "Inbox", icon: "/app/inbox.svg", href: null, match: [] },
];

// Top bar on every signed-in page (Figma "Navbar"). `user` is the avatar menu,
// passed in from the server so it can stream in.
export function Navbar({ user }: { user: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (tab: Tab) =>
    tab.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-nia-line bg-white px-4 md:px-15">
      <nav aria-label="Main" className="flex items-center gap-5 md:gap-8">
        {tabs.map((tab) => {
          const icon = <Image src={tab.icon} alt="" width={18} height={18} />;

          if (isActive(tab) && tab.href) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                aria-current="page"
                className="flex h-[38px] w-[100px] items-center justify-center gap-[5px] rounded-[20px] bg-gold/15 text-lead font-medium text-foreground"
              >
                {icon}
                {tab.label}
              </Link>
            );
          }

          return (
            <Tooltip key={tab.label}>
              <TooltipTrigger asChild>
                {tab.href ? (
                  <Link href={tab.href} aria-label={tab.label} className="flex h-[37px] items-center">
                    {icon}
                  </Link>
                ) : (
                  <span
                    role="link"
                    aria-disabled="true"
                    aria-label={`${tab.label} (coming soon)`}
                    tabIndex={0}
                    className="flex h-[37px] cursor-not-allowed items-center"
                  >
                    {icon}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent>{tab.href ? tab.label : `${tab.label} · coming soon`}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Visual only until search is built. */}
        <div className="relative hidden w-[280px] lg:block">
          <Image
            src="/app/search.svg"
            alt=""
            width={16}
            height={16}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
          />
          <Input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            className={cn(
              "h-auto rounded-[30px] border-nia-line bg-white py-2.5 pr-4 pl-11 text-small leading-normal text-nia-ink placeholder:text-nia-placeholder md:text-small",
            )}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="compact"
          aria-label="Create"
          className="h-8 w-9 rounded-[6px] border-nia-line bg-white p-0 text-lg leading-[1.4] font-medium text-nia-ink hover:bg-nia-field-muted hover:text-nia-ink"
        >
          +
        </Button>
        {user}
      </div>
    </header>
  );
}
