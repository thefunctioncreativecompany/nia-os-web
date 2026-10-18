import Link from "next/link";

import { describeActivity, timeAgo, type ActivityItem } from "@/lib/projects";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/nia/empty-state";
import { FileText } from "lucide-react";

// Recent Activity rows (Figma: Home "Recent Activity", project "Activity Feed").
// `bordered` is Home's stacked-card look; the project page uses the plain list.
export function ActivityList({
  items,
  now,
  bordered = false,
  linkProjects = false,
}: {
  items: ActivityItem[];
  now: number;
  bordered?: boolean;
  linkProjects?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        message="No activity yet. Your recent actions will appear here."
        className={cn(!bordered && "border-0 bg-transparent p-6 md:p-6")}
      />
    );
  }

  return (
    <ul className={cn("flex flex-col", bordered ? "overflow-hidden rounded-xl border border-border" : "gap-4")}>
      {items.map((item) => {
        const { verb, object } = describeActivity(item);
        const who = item.isYou ? "You" : item.actorName || "Someone";
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3",
              bordered && "justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className={bordered ? "size-9" : "size-8"}>
                <AvatarFallback className="bg-accent text-micro font-bold text-foreground">
                  {getInitials(who === "You" ? item.actorName : who, who)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className={cn("text-foreground", bordered ? "text-sm" : "text-small")}>
                  <strong className="font-bold">{who}</strong> {verb}{" "}
                  {linkProjects && item.action !== "deleted" ? (
                    <Link href={`/projects/${item.projectId}`} className="font-bold hover:underline">
                      {object}
                    </Link>
                  ) : (
                    <strong className="font-bold">{object}</strong>
                  )}
                </p>
                {!bordered && <p className="text-micro text-muted-foreground">{timeAgo(item.createdAt, now)}</p>}
              </div>
            </div>
            {bordered && (
              <span className="shrink-0 text-small text-muted-foreground">{timeAgo(item.createdAt, now)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
