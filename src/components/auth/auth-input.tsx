"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputClassName =
  "h-auto rounded-lg border-nia-line bg-white px-4 py-3.5 text-sm leading-normal text-nia-ink placeholder:text-nia-ink-muted md:text-sm";

// Placeholder-only field from the design; the label stays for screen readers.
export function AuthInput({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="w-full">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Input
        id={id}
        placeholder={label}
        className={cn(inputClassName, className)}
        {...props}
      />
    </div>
  );
}

export function AuthPasswordInput({
  id,
  label,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type"> & {
  id: string;
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={label}
        className={cn(inputClassName, "pr-11")}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-4 flex items-center rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Image src="/auth/eye.svg" alt="" width={16} height={16} />
      </button>
    </div>
  );
}
