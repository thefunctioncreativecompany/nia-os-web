// Written by scripts/capture/films/projects.mjs: the projects film's screenshots and cursor targets.
import s_cropper from "../../screens/projects/cropper.png";
import s_dialog from "../../screens/projects/dialog.png";
import s_files from "../../screens/projects/files.png";
import s_form from "../../screens/projects/form.png";
import s_form_cover from "../../screens/projects/form-cover.png";
import s_form_files from "../../screens/projects/form-files.png";
import s_form_ready from "../../screens/projects/form-ready.png";
import s_form_typed from "../../screens/projects/form-typed.png";
import s_project from "../../screens/projects/project.png";
import s_project_final from "../../screens/projects/project-final.png";
import s_projects from "../../screens/projects/projects.png";
import s_tag_open from "../../screens/projects/tag-open.png";
import s_tagged from "../../screens/projects/tagged.png";
import s_type_open from "../../screens/projects/type-open.png";
import targets from "../../screens/projects/targets.json";

export const SHOTS: Record<string, string> = { "cropper": s_cropper, "dialog": s_dialog, "files": s_files, "form": s_form, "form-cover": s_form_cover, "form-files": s_form_files, "form-ready": s_form_ready, "form-typed": s_form_typed, "project": s_project, "project-final": s_project_final, "projects": s_projects, "tag-open": s_tag_open, "tagged": s_tagged, "type-open": s_type_open };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
