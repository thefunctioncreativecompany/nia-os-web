import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Restyled shadcn pieces shared by the settings tabs (Figma "Settings / Account & Preferences").

export const settingsInputClassName =
  "h-auto rounded-md border-border bg-white px-4 py-3 text-sm leading-normal text-foreground placeholder:text-nia-placeholder md:text-sm";

// For a shadcn SelectTrigger, so dropdowns look like the text fields.
export const settingsSelectClassName = cn(
  settingsInputClassName,
  "w-full data-[size=default]:h-auto",
);

// Label + description on the left, Figma's 44x24 toggle on the right.
export function SettingsToggleRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-3">
      <label htmlFor={id} className="flex max-w-[400px] flex-col gap-1">
        <span className="text-sm leading-[1.4] font-bold text-foreground">{title}</span>
        <span className="text-[13px] leading-normal text-muted-foreground">{description}</span>
      </label>
      <Switch
        id={id}
        size="lg"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-checked:bg-primary data-unchecked:bg-border [&_[data-slot=switch-thumb]]:bg-[#fbfbfa]"
      />
    </div>
  );
}

export function SettingsSaveButton({
  isSaving,
  children,
}: {
  isSaving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-4">
      <Button
        type="submit"
        disabled={isSaving}
        className="h-auto rounded-[24px] px-8 py-3 text-sm leading-[1.4] font-bold hover:bg-primary/85"
      >
        {isSaving ? "Saving..." : children}
      </Button>
    </div>
  );
}

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
        "gap-6 rounded-lg border border-border bg-white p-6 text-foreground ring-0",
        className,
      )}
    >
      <CardTitle className="text-base leading-normal font-bold text-foreground">{title}</CardTitle>
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
      <Label htmlFor={id} className="text-[13px] leading-normal font-bold text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
