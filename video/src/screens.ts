// Screenshots of the real app, taken with the clean test account (Test Crew) on 2026-10-22 by
// going through the flow in headless Chrome at 1440×810, saved at 1920×1080. Each file is one
// step; name-N and title-N are the fields after N letters typed.
import cropper from "../screens/projects-templates/cropper.png";
import dialog from "../screens/projects-templates/dialog.png";
import editor from "../screens/projects-templates/editor.png";
import filesDone from "../screens/projects-templates/files-done.png";
import filesEmpty from "../screens/projects-templates/files-empty.png";
import form from "../screens/projects-templates/form.png";
import formBottom from "../screens/projects-templates/form-bottom.png";
import formCover from "../screens/projects-templates/form-cover.png";
import formFilled from "../screens/projects-templates/form-filled.png";
import name1 from "../screens/projects-templates/name-1.png";
import name10 from "../screens/projects-templates/name-10.png";
import name11 from "../screens/projects-templates/name-11.png";
import name12 from "../screens/projects-templates/name-12.png";
import name13 from "../screens/projects-templates/name-13.png";
import name14 from "../screens/projects-templates/name-14.png";
import name15 from "../screens/projects-templates/name-15.png";
import name2 from "../screens/projects-templates/name-2.png";
import name3 from "../screens/projects-templates/name-3.png";
import name4 from "../screens/projects-templates/name-4.png";
import name5 from "../screens/projects-templates/name-5.png";
import name6 from "../screens/projects-templates/name-6.png";
import name7 from "../screens/projects-templates/name-7.png";
import name8 from "../screens/projects-templates/name-8.png";
import name9 from "../screens/projects-templates/name-9.png";
import preview from "../screens/projects-templates/preview.png";
import project from "../screens/projects-templates/project.png";
import projectFinal from "../screens/projects-templates/project-final.png";
import projects from "../screens/projects-templates/projects.png";
import saveDialog from "../screens/projects-templates/save-dialog.png";
import saved from "../screens/projects-templates/saved.png";
import templates from "../screens/projects-templates/templates.png";
import title1 from "../screens/projects-templates/title-1.png";
import title10 from "../screens/projects-templates/title-10.png";
import title11 from "../screens/projects-templates/title-11.png";
import title12 from "../screens/projects-templates/title-12.png";
import title13 from "../screens/projects-templates/title-13.png";
import title14 from "../screens/projects-templates/title-14.png";
import title15 from "../screens/projects-templates/title-15.png";
import title16 from "../screens/projects-templates/title-16.png";
import title17 from "../screens/projects-templates/title-17.png";
import title18 from "../screens/projects-templates/title-18.png";
import title19 from "../screens/projects-templates/title-19.png";
import title2 from "../screens/projects-templates/title-2.png";
import title20 from "../screens/projects-templates/title-20.png";
import title21 from "../screens/projects-templates/title-21.png";
import title22 from "../screens/projects-templates/title-22.png";
import title3 from "../screens/projects-templates/title-3.png";
import title4 from "../screens/projects-templates/title-4.png";
import title5 from "../screens/projects-templates/title-5.png";
import title6 from "../screens/projects-templates/title-6.png";
import title7 from "../screens/projects-templates/title-7.png";
import title8 from "../screens/projects-templates/title-8.png";
import title9 from "../screens/projects-templates/title-9.png";
import titlePreview from "../screens/projects-templates/title-preview.png";
import typeOpen from "../screens/projects-templates/type-open.png";
import uploadDone from "../screens/projects-templates/upload-done.png";
import uploadStart from "../screens/projects-templates/upload-start.png";

export const screens = {
  "cropper": cropper,
  "dialog": dialog,
  "editor": editor,
  "files-done": filesDone,
  "files-empty": filesEmpty,
  "form": form,
  "form-bottom": formBottom,
  "form-cover": formCover,
  "form-filled": formFilled,
  "name-1": name1,
  "name-10": name10,
  "name-11": name11,
  "name-12": name12,
  "name-13": name13,
  "name-14": name14,
  "name-15": name15,
  "name-2": name2,
  "name-3": name3,
  "name-4": name4,
  "name-5": name5,
  "name-6": name6,
  "name-7": name7,
  "name-8": name8,
  "name-9": name9,
  "preview": preview,
  "project": project,
  "project-final": projectFinal,
  "projects": projects,
  "save-dialog": saveDialog,
  "saved": saved,
  "templates": templates,
  "title-1": title1,
  "title-10": title10,
  "title-11": title11,
  "title-12": title12,
  "title-13": title13,
  "title-14": title14,
  "title-15": title15,
  "title-16": title16,
  "title-17": title17,
  "title-18": title18,
  "title-19": title19,
  "title-2": title2,
  "title-20": title20,
  "title-21": title21,
  "title-22": title22,
  "title-3": title3,
  "title-4": title4,
  "title-5": title5,
  "title-6": title6,
  "title-7": title7,
  "title-8": title8,
  "title-9": title9,
  "title-preview": titlePreview,
  "type-open": typeOpen,
  "upload-done": uploadDone,
  "upload-start": uploadStart,
} as const;

export type Screen = keyof typeof screens;
