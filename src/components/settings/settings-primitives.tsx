import { cn } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Restyled shadcn pieces shared by the settings tabs (Figma "Settings / Account & Preferences").

export const settingsInputClassName =
  "h-auto rounded-[8px] border-nia-line bg-white px-4 py-3 text-sm leading-normal text-nia-ink placeholder:text-nia-placeholder md:text-sm";

export function SettingsCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "gap-6 rounded-[12px] border border-nia-line bg-white p-6 text-nia-ink ring-0",
        className,
      )}
    >
      <CardTitle className="text-base leading-normal font-bold text-nia-ink">{title}</CardTitle>
      {children}
    </Card>
  );
}

export function SettingsField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-[13px] leading-normal font-bold text-nia-ink">
        {label}
      </Label>
      {children}
    </div>
  );
}
