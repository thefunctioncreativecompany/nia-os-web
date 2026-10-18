import type { StaticImageData } from "next/image";

import elena from "@/assets/creators/creator-1.png";
import blackbox from "@/assets/creators/creator-2.png";
import marcus from "@/assets/creators/creator-3.png";
import cinecraft from "@/assets/creators/creator-4.png";
import clara from "@/assets/creators/creator-5.png";

export type Creator = {
  id: string;
  name: string;
  description: string;
  followers: string;
  avatar: StaticImageData;
};

// Sample people and studios to follow until real profiles exist. The ids are what
// get saved in profiles.followed_creators.
export const SAMPLE_CREATORS: Creator[] = [
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    description: "Award-winning Director & Showrunner",
    followers: "14.2K followers",
    avatar: elena,
  },
  {
    id: "blackbox-films",
    name: "Blackbox Films",
    description: "Studio — Independent Feature Films",
    followers: "89K followers",
    avatar: blackbox,
  },
  {
    id: "marcus-vance",
    name: "Marcus Vance",
    description: "Auteur & Narrative Director",
    followers: "8.5K followers",
    avatar: marcus,
  },
  {
    id: "cinecraft-studios",
    name: "CineCraft Studios",
    description: "Virtual Production & VFX Studio",
    followers: "34K followers",
    avatar: cinecraft,
  },
  {
    id: "clara-sterling",
    name: "Clara Sterling",
    description: "Indie Film Director & Producer",
    followers: "11.3K followers",
    avatar: clara,
  },
];
