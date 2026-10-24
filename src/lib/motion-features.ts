// Everything Motion animates with (layout animations and dragging included), in its own download:
// `MotionProvider` loads it once the page is up, so it never holds up the first paint.
import { domMax } from "framer-motion";

export default domMax;
