"use client";

import Link from "next/link";
import { FilePlus2, FolderPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// The navbar's + (Ika, 2026-11-19): a small menu under the button, not a full pop-up, with the two
// ways to start as grey pills like Home's Get started with. From template goes to Templates,
// where each template opens ready to fill in. Wrap the button that opens it.
export function NewProjectMenu({ children, align = "center" }: { children: React.ReactNode; align?: "start" | "center" | "end" }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="flex w-auto min-w-52 flex-col gap-1.5 rounded-2xl p-2">
        <DropdownMenuItem asChild className={pill}>
          <Link href="/projects/new">
            <FolderPlus aria-hidden /> Blank project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={pill}>
          <Link href="/templates">
            <FilePlus2 aria-hidden /> From template
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const pill = cn(buttonVariants({ variant: "secondary" }), "w-full cursor-pointer justify-start focus:bg-accent data-highlighted:bg-accent");
