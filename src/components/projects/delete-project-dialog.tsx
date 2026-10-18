"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// "Delete Project?" (Figma 798:804). A soft delete: the project leaves everyone's list
// but its data is kept, so it can be restored from Trash later.
export function DeleteProjectDialog({
  projectId,
  title,
  children,
}: {
  projectId: string;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    setIsDeleting(true);
    const { error } = await createClient().rpc("soft_delete_project", { pid: projectId });
    if (error) {
      toast.error(error.message);
      setIsDeleting(false);
      return;
    }
    toast.success(`Deleted "${title || "Untitled project"}"`);
    router.push("/projects");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100%-2rem)] max-w-[420px] flex-col items-center gap-6 rounded-2xl p-8 text-center sm:max-w-[420px]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-status-cancelled text-nia-danger">
          <AlertTriangle aria-hidden className="size-6" />
        </span>
        <div className="flex flex-col gap-3">
          <DialogTitle className="text-subtitle font-bold">Delete Project?</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-muted-foreground">
            <strong className="font-bold text-foreground">&ldquo;{title || "Untitled project"}&rdquo;</strong> will be
            removed from your projects, and everyone it&apos;s shared with will lose access.
          </DialogDescription>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-auto rounded-lg p-3 text-small font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={remove}
            className="h-auto rounded-lg bg-nia-danger p-3 text-small font-bold text-white hover:bg-nia-danger/85"
          >
            {isDeleting ? "Deleting…" : "Delete Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
