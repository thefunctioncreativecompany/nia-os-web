"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, CircleAlertIcon, InfoIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SoundCue } from "@/components/nia/sound-cue"

function ToastIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("flex size-6 items-center justify-center rounded-full [&_svg]:size-3.5 [&_svg]:stroke-[2.5]", className)}>
      {children}
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  // Sonner's own theme stays light: its colours come from Nia's tokens below, which follow dark mode.
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      icons={{
        // Success and error toasts carry their sound (Ika, 2026-10-22), so every one plays it.
        success: <ToastIcon className="bg-status-confirmed text-nia-success"><CheckIcon /><SoundCue cue="success" /></ToastIcon>,
        info: <ToastIcon className="bg-status-on-hold text-status-on-hold-foreground"><InfoIcon /></ToastIcon>,
        warning: <ToastIcon className="bg-status-pending text-status-pending-foreground"><TriangleAlertIcon /></ToastIcon>,
        error: <ToastIcon className="bg-status-cancelled text-nia-danger"><CircleAlertIcon /><SoundCue cue="problem" /></ToastIcon>,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      // Design system Section 8: white card, coloured left edge per tone, link-style action.
      toastOptions={{
        classNames: {
          toast: "cn-toast gap-3! rounded-xl! border! border-border! border-l-4! py-3.5! pr-10! shadow-menu! font-sans!",
          title: "text-sm! font-medium! text-foreground!",
          description: "text-small! text-muted-foreground!",
          success: "border-l-nia-success!",
          error: "border-l-nia-danger!",
          warning: "border-l-status-pending-foreground!",
          info: "border-l-status-on-hold-foreground!",
          actionButton: "bg-transparent! p-0! h-auto! text-small! font-bold! text-foreground! underline! underline-offset-2!",
          closeButton: "left-auto! right-2! top-1/2! -translate-y-1/2! translate-x-0! border-0! bg-transparent! text-muted-foreground! hover:text-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
