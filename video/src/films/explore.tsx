import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./explore.json";
import { SHOTS, TARGETS } from "./explore-screens";
import { VOICE } from "./explore-voice";

// The Explore film (Ika, 2026-11-08, for Coodie): Explore, the canvas, the timeline, search by
// style and by filmmaker, a title page and its press kit, and adding a title to a project.
const def = film as FilmDef;
export const EXPLORE_DURATION = plan(def, VOICE).duration;
export const ExploreFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
