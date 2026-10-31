"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Segment = { value: string; label: string; count?: number; alert?: boolean };

// Segmented control with optional counts; `alert` counts are rust so new items stand
// out (design system Sections 4.3 and 22.5). Built on <Tabs>; put <TabsContent> panels
// in `children` if the segments switch content.
export function SegmentedControl({
  segments,
  value,
  onChange,
  label,
  className,
  children,
}: {
  segments: Segment[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className={className}>
      <TabsList aria-label={label} className="h-10 w-full rounded-lg border border-border bg-card p-1">
        {segments.map((segment) => (
          <TabsTrigger
            key={segment.value}
            value={segment.value}
            className="group/segment gap-2 rounded-md text-small text-muted-foreground data-active:bg-foreground data-active:font-bold data-active:text-primary-foreground data-active:hover:text-primary-foreground"
          >
            {segment.label}
            {segment.count !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-tiny leading-4 font-bold",
                  segment.alert
                    ? "bg-chart-3 text-primary-foreground"
                    : "bg-muted text-foreground group-data-active/segment:bg-white/25 group-data-active/segment:text-primary-foreground",
                )}
              >
                {segment.count}
                {segment.alert && <span className="sr-only"> new</span>}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
