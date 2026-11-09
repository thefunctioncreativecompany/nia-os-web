// Written by scripts/capture/films/crew.mjs: the crew film's screenshots and cursor targets.
import s_add_form from "../../screens/crew/add-form.png";
import s_confirmed from "../../screens/crew/confirmed.png";
import s_empty from "../../screens/crew/empty.png";
import s_grid from "../../screens/crew/grid.png";
import s_list from "../../screens/crew/list.png";
import s_profile from "../../screens/crew/profile.png";
import s_project_crew_row from "../../screens/crew/project-crew-row.png";
import s_status_open from "../../screens/crew/status-open.png";
import targets from "../../screens/crew/targets.json";

export const SHOTS: Record<string, string> = { "add-form": s_add_form, "confirmed": s_confirmed, "empty": s_empty, "grid": s_grid, "list": s_list, "profile": s_profile, "project-crew-row": s_project_crew_row, "status-open": s_status_open };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
