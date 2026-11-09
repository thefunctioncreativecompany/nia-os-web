import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./crew.json";
import { SHOTS, TARGETS } from "./crew-screens";
import { VOICE } from "./crew-voice";

// The Cast & crew film (Ika, 2026-11-08, for Coodie): add people by role, grouped by department,
// confirmed in a tap, each with a profile; the whole team as a grid.
const def = film as FilmDef;
export const CREW_DURATION = plan(def, VOICE).duration;
export const CrewFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
