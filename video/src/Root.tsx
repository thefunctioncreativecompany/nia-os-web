import { Composition, Still } from "remotion";

import { DURATION, MadeInAfrica, STILL_FRAME } from "./MadeInAfrica";
import { DURATION as DEMO_DURATION, ProjectsTemplates } from "./ProjectsTemplates";

export function Root() {
  return (
    <>
      {/* 15 seconds at 30 fps: the page builds, then three study pairings in turn. */}
      <Composition id="MadeInAfrica" component={MadeInAfrica} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
      {/* The same page as one image, every part settled. */}
      <Still id="MadeInAfricaPage" component={MadeInAfrica} defaultProps={{ frame: STILL_FRAME }} width={1920} height={1080} />
      {/* A new user creates a project, then fills a call sheet and saves it there; its length
          follows the narration. */}
      <Composition id="ProjectsTemplates" component={ProjectsTemplates} durationInFrames={DEMO_DURATION} fps={30} width={1920} height={1080} />
    </>
  );
}
