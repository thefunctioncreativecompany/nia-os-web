"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PRODUCTION_TYPES, STAGES, type Project } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fieldClassName,
  fieldLabelClassName,
  selectTriggerClassName,
} from "@/components/projects/project-form";

// "Edit Project Details" from Project Actions: the fields that aren't edited in place.
export function EditDetailsDialog({ project, children }: { project: Project; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [productionType, setProductionType] = useState<string>(project.productionType ?? "Film");
  const [stage, setStage] = useState<string>(project.stage);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next) {
      setTitle(project.title);
      setDescription(project.description);
      setProductionType(project.productionType ?? "Film");
      setStage(project.stage);
    }
    setOpen(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await createClient()
      .from("projects")
      .update({
        title: title.trim(),
        description: description.trim(),
        production_type: productionType,
        stage,
      })
      .eq("id", project.id);
    setIsSaving(false);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      return;
    }
    toast.success("Project details saved");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[600px] flex-col gap-7 overflow-y-auto rounded-2xl p-6 sm:max-w-[600px] sm:p-10">
        <DialogTitle className="text-h2 font-bold">Edit project details</DialogTitle>
        <DialogDescription className="sr-only">Change this project&apos;s name, summary, type and stage.</DialogDescription>
        <form onSubmit={save} className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name" className={fieldLabelClassName}>
              Project Name
            </Label>
            <Input
              id="edit-name"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description" className={fieldLabelClassName}>
              Description
            </Label>
            <Textarea
              id="edit-description"
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(fieldClassName, "field-sizing-fixed h-24 min-h-24 resize-none")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-type" className={fieldLabelClassName}>
                Production Type
              </Label>
              <Select value={productionType} onValueChange={setProductionType}>
                <SelectTrigger id="edit-type" className={selectTriggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {PRODUCTION_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-stage" className={fieldLabelClassName}>
                Stage
              </Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger id="edit-stage" className={selectTriggerClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {STAGES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-auto rounded-lg px-6 py-3 text-lead font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="h-auto rounded-lg px-6 py-3 text-lead font-semibold"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
