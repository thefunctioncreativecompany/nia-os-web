import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./projects.json";
import { SHOTS, TARGETS } from "./projects-screens";
import { VOICE } from "./projects-voice";

// The Projects film (Ika, 2026-11-08, for Coodie): start a project with a cover, its type and the
// first files; the project page; files tagged by what they're for; final assets up front.
const def = film as FilmDef;
export const PROJECTS_DURATION = plan(def, VOICE).duration;
export const ProjectsFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
