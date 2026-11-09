// Written by scripts/capture/films/explore.mjs: the explore film's screenshots and cursor targets.
import s_add_to_project from "../../screens/explore/add-to-project.png";
import s_canvas from "../../screens/explore/canvas.png";
import s_canvas_dragged from "../../screens/explore/canvas-dragged.png";
import s_explore from "../../screens/explore/explore.png";
import s_explore_scrolled from "../../screens/explore/explore-scrolled.png";
import s_search_coodie from "../../screens/explore/search-coodie.png";
import s_search_documentary from "../../screens/explore/search-documentary.png";
import s_timeline from "../../screens/explore/timeline.png";
import s_timeline_century from "../../screens/explore/timeline-century.png";
import s_timeline_coodie from "../../screens/explore/timeline-coodie.png";
import s_title from "../../screens/explore/title.png";
import s_title_cast from "../../screens/explore/title-cast.png";
import s_title_press from "../../screens/explore/title-press.png";
import targets from "../../screens/explore/targets.json";

export const SHOTS: Record<string, string> = { "add-to-project": s_add_to_project, "canvas": s_canvas, "canvas-dragged": s_canvas_dragged, "explore": s_explore, "explore-scrolled": s_explore_scrolled, "search-coodie": s_search_coodie, "search-documentary": s_search_documentary, "timeline": s_timeline, "timeline-century": s_timeline_century, "timeline-coodie": s_timeline_coodie, "title": s_title, "title-cast": s_title_cast, "title-press": s_title_press };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
