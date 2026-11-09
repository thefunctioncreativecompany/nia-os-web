// Written by scripts/capture/films/references.mjs: the references film's screenshots and cursor targets.
import s_add_popover from "../../screens/references/add-popover.png";
import s_added from "../../screens/references/added.png";
import s_details from "../../screens/references/details.png";
import s_details_filled from "../../screens/references/details-filled.png";
import s_inspiration from "../../screens/references/inspiration.png";
import s_references from "../../screens/references/references.png";
import s_title from "../../screens/references/title.png";
import targets from "../../screens/references/targets.json";

export const SHOTS: Record<string, string> = { "add-popover": s_add_popover, "added": s_added, "details": s_details, "details-filled": s_details_filled, "inspiration": s_inspiration, "references": s_references, "title": s_title };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
