"use client";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export type Frame = { x: number; y: number; width: number; height: number; opacity: number; color: string };

const FIELDS: { key: "x" | "y" | "width" | "height"; label: string }[] = [
  { key: "x", label: "X" },
  { key: "y", label: "Y" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
];

// Position, size, opacity and colour of the selected element (design system Section
// 23.5), for layout tools like the call sheet and storyboard editors.
export function PropertyInspector({
  name,
  value,
  onChange,
  className,
}: {
  name: string;
  value: Frame;
  onChange: (next: Frame) => void;
  className?: string;
}) {
  return (
    <section aria-label={`${name} properties`} className={cn("flex flex-col gap-3.5 rounded-xl border border-border bg-white p-4", className)}>
      <header className="flex items-baseline justify-between gap-2">
        <h4 className="truncate text-small font-bold text-foreground">{name}</h4>
        <span className="text-micro text-muted-foreground">Layer</span>
      </header>
      <div className="grid grid-cols-2 gap-2.5">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-micro font-bold tracking-wide text-muted-foreground uppercase">{label}</span>
            <span className="flex h-9 items-center rounded-md border border-border pr-2.5 focus-within:border-foreground">
              <input
                type="number"
                inputMode="numeric"
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) || 0 })}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-small outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-micro text-muted-foreground">px</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-micro font-bold tracking-wide text-muted-foreground uppercase">
          <span id="inspector-opacity">Opacity</span>
          <span className="text-foreground">{value.opacity}%</span>
        </div>
        <Slider
          aria-labelledby="inspector-opacity"
          value={[value.opacity]}
          max={100}
          step={1}
          onValueChange={([opacity]) => onChange({ ...value, opacity })}
        />
      </div>
      <label className="flex items-center gap-2.5">
        <input
          type="color"
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value.toUpperCase() })}
          className="size-7 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <span className="font-mono text-small font-bold text-foreground">{value.color}</span>
        <span className="sr-only">Fill colour</span>
      </label>
    </section>
  );
}
