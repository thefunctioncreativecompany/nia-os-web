"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"
import { CheckIcon, XIcon } from "lucide-react"

function Switch({
  className,
  size = "default",
  tone = "default",
  withIcon = false,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default" | "lg"
  // "danger" for switches that override safeguards (design system "Toggle with Icon").
  tone?: "default" | "danger"
  // Tick / cross inside the thumb, so the state doesn't rely on colour alone.
  withIcon?: boolean
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-tone={tone}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] data-[size=lg]:h-6 data-[size=lg]:w-11 data-[size=lg]:border-0 data-[size=lg]:p-0.5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[tone=danger]:data-checked:bg-nia-danger",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="group/thumb pointer-events-none flex items-center justify-center rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=lg]/switch:size-5 group-data-[size=lg]/switch:data-checked:translate-x-5 group-data-[size=lg]/switch:data-unchecked:translate-x-0 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
      >
        {withIcon && (
          <>
            <CheckIcon
              aria-hidden
              strokeWidth={3}
              className="hidden size-2.5 text-primary group-data-checked/thumb:block group-data-[tone=danger]/switch:text-nia-danger"
            />
            <XIcon
              aria-hidden
              strokeWidth={3}
              className="hidden size-2.5 text-muted-foreground group-data-unchecked/thumb:block"
            />
          </>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
