import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary actions are Nia Blue with a soft halo, stronger on hover (Ika, 2026-11-11: "a light
        // blue highlight on primary CTAs"; 2026-11-12: "Nia blue should be the background color of
        // main CTAs"). Grey when disabled.
        default: "bg-nia-blue text-nia-blue-foreground ring-3 ring-nia-blue/20 shadow-md shadow-nia-blue/25 transition-[background-color,box-shadow] hover:bg-nia-blue/90 hover:ring-nia-blue/35 disabled:bg-border disabled:text-nia-placeholder disabled:opacity-100 disabled:ring-0 disabled:shadow-none",
        outline:
          "border-border bg-background hover:border-foreground hover:bg-background hover:text-foreground active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Solid red for actions that remove things (design system "Destructive Buttons").
        danger: "bg-nia-danger text-background hover:bg-nia-danger/90 active:bg-nia-danger focus-visible:ring-destructive/30 disabled:bg-status-cancelled disabled:text-nia-danger/50 disabled:opacity-100",
      },
      size: {
        // Nia's main button (Figma "Continue Pill Button"): 44px, fully rounded, bold.
        pill: "h-11 gap-2 rounded-full px-6 text-sm leading-[1.4] font-bold has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        // Every button is a pill and every icon button a circle (Ika, 2026-11-11: "some are pill
        // shaped, some not"). Buttons joined in a group keep the group's shape.
        compact:
          "h-8 gap-1.5 rounded-full px-3 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-full px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        // Design system scales (Section 1.8): 32 / 40 / 48px, now pills like the rest.
        sm: "h-8 gap-1.5 rounded-full px-3.5 in-data-[slot=button-group]:rounded-lg text-caption font-bold [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-10 gap-2 rounded-full px-5 in-data-[slot=button-group]:rounded-lg text-sm leading-[1.4] font-bold",
        lg: "h-12 gap-2 rounded-full px-6 in-data-[slot=button-group]:rounded-lg text-base font-bold [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8 rounded-full in-data-[slot=button-group]:rounded-lg",
        "icon-xs":
          "size-6 rounded-full in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-full in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9 rounded-full in-data-[slot=button-group]:rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "pill",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "pill",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
