import type { StaticImageData } from "next/image";

import sinnersChurch from "@/assets/hero/01-sinners-bts-church.png";
import sinnersPortrait from "@/assets/hero/02-sinners-portrait.png";
import sinnersCamera from "@/assets/hero/03-sinners-bts-camera.png";
import sinnersCrane from "@/assets/hero/04-sinners-bts-crane.png";
import sinnersDance from "@/assets/hero/05-sinners-dance.png";
import backrooms from "@/assets/hero/06-backrooms.webp";
import blackPanther from "@/assets/hero/08-black-panther.jpg";
import studioFitting from "@/assets/hero/10-studio-fitting.jpg";
import showroom from "@/assets/hero/11-showroom.jpg";
import studioTeam from "@/assets/hero/12-studio-team.jpg";

export type HeroSlide = {
  src: StaticImageData;
  // Credit shown bottom-left; omit to show none.
  caption?: string;
  // CSS object-position: which part stays in frame in the tall hero panel.
  position?: string;
};

// The rotating images behind the auth and onboarding screens, in order.
export const heroSlides: HeroSlide[] = [
  { src: sinnersChurch, caption: "Sinners, Behind the Scenes (2025)", position: "28% 50%" },
  { src: sinnersPortrait, caption: "Sinners (2025)", position: "64% 50%" },
  { src: sinnersCamera, caption: "Sinners, Behind the Scenes (2025)" },
  { src: sinnersCrane, caption: "Sinners, Behind the Scenes (2025)", position: "38% 50%" },
  { src: sinnersDance, caption: "Sinners (2025)", position: "48% 40%" },
  { src: backrooms, caption: "Backrooms (2025)" },
  { src: blackPanther, caption: "Black Panther (2018)" },
  { src: studioFitting },
  { src: showroom },
  { src: studioTeam },
];
