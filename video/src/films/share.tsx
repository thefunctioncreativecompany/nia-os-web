import { Walkthrough, plan, type FilmDef } from "../Walkthrough";
import film from "./share.json";
import { SHOTS, TARGETS } from "./share-screens";
import { VOICE } from "./share-voice";

// The Share and collaborate film (Ika, 2026-11-08, for Coodie): invite by email to view or edit,
// a view-only link and what a client sees through it, and working together.
const def = film as FilmDef;
export const SHARE_DURATION = plan(def, VOICE).duration;
export const ShareFilm = () => <Walkthrough film={def} voice={VOICE} screens={SHOTS} targets={TARGETS} />;
