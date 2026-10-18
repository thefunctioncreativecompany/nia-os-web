import type { StaticImageData } from "next/image";

import sinnersChurch from "@/assets/hero/01-sinners-bts-church.png";
import sinnersPortrait from "@/assets/hero/02-sinners-portrait.png";
import sinnersCamera from "@/assets/hero/03-sinners-bts-camera.png";
import sinnersCrane from "@/assets/hero/04-sinners-bts-crane.png";
import sinnersDance from "@/assets/hero/05-sinners-dance.png";
import backrooms from "@/assets/hero/06-backrooms.webp";
import studioFitting from "@/assets/hero/10-studio-fitting.jpg";
import showroom from "@/assets/hero/11-showroom.jpg";
import studioTeam from "@/assets/hero/12-studio-team.jpg";

export type HeroImage = {
  src: StaticImageData;
  // Credit shown bottom-left; omit to show none.
  caption?: string;
  // CSS object-position: which part stays in frame in the tall hero panel.
  position?: string;
};

const images = {
  sinnersChurch: { src: sinnersChurch, caption: "Sinners, Behind the Scenes (2025)", position: "28% 50%" },
  sinnersPortrait: { src: sinnersPortrait, caption: "Sinners (2025)", position: "64% 50%" },
  sinnersCamera: { src: sinnersCamera, caption: "Sinners, Behind the Scenes (2025)" },
  sinnersCrane: { src: sinnersCrane, caption: "Sinners, Behind the Scenes (2025)", position: "38% 50%" },
  sinnersDance: { src: sinnersDance, caption: "Sinners (2025)", position: "48% 40%" },
  backrooms: { src: backrooms, caption: "Backrooms (2025)" },
  studioFitting: { src: studioFitting },
  showroom: { src: showroom },
  studioTeam: { src: studioTeam },
} satisfies Record<string, HeroImage>;

// One still per screen. Onboarding uses the Figma frame's image where Ika's set has
// it (import, username, follow, features); the rest replace Figma's low-res stills.
export const HERO_IMAGES = {
  login: images.sinnersPortrait,
  signup: images.sinnersDance,
  "forgot-password": images.studioFitting,
  "check-email": images.showroom,
  "reset-password": images.sinnersCrane,
  "auth-error": images.studioTeam,
  source: images.studioTeam,
  import: images.sinnersCamera,
  username: images.backrooms,
  photo: images.sinnersCrane,
  profession: images.sinnersPortrait,
  workspace: images.showroom,
  follow: images.sinnersChurch,
  features: images.sinnersCamera,
  done: images.sinnersDance,
} satisfies Record<string, HeroImage>;

export type HeroScreen = keyof typeof HERO_IMAGES;
