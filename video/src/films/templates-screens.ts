// Written by scripts/capture/films/templates.mjs: the templates film's screenshots and cursor targets.
import s_downloads from "../../screens/templates/downloads.png";
import s_editor from "../../screens/templates/editor.png";
import s_filled from "../../screens/templates/filled.png";
import s_gallery from "../../screens/templates/gallery.png";
import s_gallery_card from "../../screens/templates/gallery-card.png";
import s_preview from "../../screens/templates/preview.png";
import s_save_dialog from "../../screens/templates/save-dialog.png";
import s_saved from "../../screens/templates/saved.png";
import s_search from "../../screens/templates/search.png";
import targets from "../../screens/templates/targets.json";

export const SHOTS: Record<string, string> = { "downloads": s_downloads, "editor": s_editor, "filled": s_filled, "gallery": s_gallery, "gallery-card": s_gallery_card, "preview": s_preview, "save-dialog": s_save_dialog, "saved": s_saved, "search": s_search };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
