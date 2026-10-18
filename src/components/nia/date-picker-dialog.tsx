"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// A calendar in a dialog: pick a day, then Confirm (design system Section 16.1). Nothing
// changes until Confirm, so Cancel leaves the old date. Pass `today` when the page is
// prerendered (the calendar otherwise reads the clock).
export function DatePickerDialog({
  value,
  onChange,
  title,
  today,
  children,
}: {
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
  title: string;
  today?: Date;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-auto gap-3 p-4 sm:max-w-none" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">Choose a day, then confirm.</DialogDescription>
        <Calendar mode="single" selected={draft} defaultMonth={draft ?? today} today={today} onSelect={setDraft} />
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
          <Button
            size="sm"
            disabled={!draft}
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
