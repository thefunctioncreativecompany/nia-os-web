import { Bell } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Bell with an unread dot or count (design system Section 8.7).
export function NotificationBell({ count = 0, className }: { count?: number; className?: string }) {
  const label = count > 0 ? `${count} unread notification${count === 1 ? "" : "s"}` : "No new notifications";
  return (
    <span role="img" aria-label={label} className={cn("relative inline-flex size-6 items-center justify-center", className)}>
      <Bell aria-hidden className="size-5 text-foreground" />
      {count === 1 && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-nia-danger ring-2 ring-background" />}
      {count > 1 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-nia-danger px-1 text-meta leading-none font-bold text-white ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

// Avatar with a green dot while someone is active.
export function PresenceAvatar({
  name,
  src,
  active = false,
  className,
}: {
  name: string;
  src?: string | null;
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <Avatar className="size-9">
        {src && <AvatarImage src={src} alt="" />}
        <AvatarFallback className="bg-primary text-small font-bold text-primary-foreground">{getInitials(name, "")}</AvatarFallback>
      </Avatar>
      {active && (
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-nia-success ring-2 ring-background">
          <span className="sr-only">Active now</span>
        </span>
      )}
    </span>
  );
}
