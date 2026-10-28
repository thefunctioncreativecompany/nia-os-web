import { cacheLife } from "next/cache";

import { catalog } from "./catalog";
import { toGallery, type GalleryTemplate } from "./gallery";
import { LAUNCHES, isFresh } from "./launches";

// The templates people see, as the gallery views need them: every working one, with what it
// does for you and your team, and `fresh` while it's new (new ones lead). Which ones are new
// is worked out once an hour, so the pages that use it stay prebuilt.
export async function workingGallery(): Promise<GalleryTemplate[]> {
  "use cache";
  cacheLife("hours");
  const now = Date.now();
  return catalog
    .map((t): GalleryTemplate => ({ ...toGallery(t), ready: true, ...LAUNCHES[t.code], fresh: isFresh(t.code, now) }))
    .sort((a, b) => Number(b.fresh) - Number(a.fresh));
}
