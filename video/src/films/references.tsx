import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./references.json";
import { SHOTS, TARGETS } from "./references-screens";
import { VOICE } from "./references-voice";

// The References and production details film (Ika, 2026-11-08, for Coodie): Explore titles added to
// the project as references (Coodie & Chike's Jeen-Yuhs and Benji), Instagram links, Inspiration,
// and the production details.
const def = film as FilmDef;
export const REFERENCES_DURATION = plan(def, VOICE).duration;
export const ReferencesFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
