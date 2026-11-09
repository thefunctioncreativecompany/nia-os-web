import { Composition, Still } from "remotion";

import { DURATION, MadeInAfrica, STILL_FRAME } from "./MadeInAfrica";
import { DURATION as DEMO_DURATION, ProjectsTemplates } from "./ProjectsTemplates";
import { EXPLORE_DURATION, ExploreFilm } from "./films/explore";
import { PROJECTS_DURATION, ProjectsFilm } from "./films/projects";
import { CREW_DURATION, CrewFilm } from "./films/crew";
import { TEMPLATES_DURATION, TemplatesFilm } from "./films/templates";
import { SHARE_DURATION, ShareFilm } from "./films/share";
import { REFERENCES_DURATION, ReferencesFilm } from "./films/references";

export function Root() {
  return (
    <>
      {/* 15 seconds at 30 fps: the page builds, then three study pairings in turn. */}
      <Composition id="MadeInAfrica" component={MadeInAfrica} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
      {/* The same page as one image, every part settled. */}
      <Still id="MadeInAfricaPage" component={MadeInAfrica} defaultProps={{ frame: STILL_FRAME }} width={1920} height={1080} />
      {/* The feature films for Coodie (Ika, 2026-11-08): one engine (Walkthrough.tsx), a film per feature. */}
      <Composition id="Explore" component={ExploreFilm} durationInFrames={EXPLORE_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="Projects" component={ProjectsFilm} durationInFrames={PROJECTS_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="CastCrew" component={CrewFilm} durationInFrames={CREW_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="Templates" component={TemplatesFilm} durationInFrames={TEMPLATES_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="Share" component={ShareFilm} durationInFrames={SHARE_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="References" component={ReferencesFilm} durationInFrames={REFERENCES_DURATION} fps={30} width={1920} height={1080} />
      {/* A new user creates a project, then fills a call sheet and saves it there; its length
          follows the narration. */}
      <Composition id="ProjectsTemplates" component={ProjectsTemplates} durationInFrames={DEMO_DURATION} fps={30} width={1920} height={1080} />
    </>
  );
}
