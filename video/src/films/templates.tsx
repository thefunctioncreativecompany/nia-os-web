import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./templates.json";
import { SHOTS, TARGETS } from "./templates-screens";
import { VOICE } from "./templates-voice";

// The Templates film (Ika, 2026-11-08, for Coodie): search for the call sheet, preview it, fill it
// in with its live PDF, save it to the project and download it.
const def = film as FilmDef;
export const TEMPLATES_DURATION = plan(def, VOICE).duration;
export const TemplatesFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
