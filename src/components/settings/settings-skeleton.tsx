import { Skeleton } from "@/components/ui/skeleton";

// Placeholder while a settings tab loads from Supabase.
export function SettingsSkeleton({ cards }: { cards: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading settings">
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  );
}
