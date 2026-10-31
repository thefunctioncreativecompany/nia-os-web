// Top 10 on Explore (Ika, 2026-10-31): in place of "Top 10 director's notes", the titles and
// films people on Nia open, save and add to projects most, worked out again on every visit from
// the last 30 days of activity (`explore_top()`, 20261108000000_explore_top.sql). Each person
// counts once per title they opened; a save is worth three opens and an addition to a project
// five, because those mean the title is being used for work; an open in the last week counts
// twice, so the list moves with what's being looked at now. Until there's enough activity, or
// before the migration is run, Explore's essentials fill the list in their curated order.

export type TopActivity = { slug: string; viewers: number; recent_viewers: number; saves: number; adds: number };

export const TOP_SIZE = 10;
const WEIGHT = { view: 1, recentView: 1, save: 3, add: 5 };

export const topScore = (a: TopActivity) =>
  WEIGHT.view * a.viewers + WEIGHT.recentView * a.recent_viewers + WEIGHT.save * a.saves + WEIGHT.add * a.adds;

/** The ten slugs to show, most-used first, then picks (in order) to fill the list. `shown` says
 * whether a slug can be shown (it's on Explore and has its cover). */
export function topTen(activity: TopActivity[], picks: string[], shown: (slug: string) => boolean, size = TOP_SIZE): string[] {
  const ranked = activity
    .filter((a) => topScore(a) > 0 && shown(a.slug))
    .toSorted((a, b) => topScore(b) - topScore(a) || b.recent_viewers - a.recent_viewers || a.slug.localeCompare(b.slug))
    .map((a) => a.slug);
  const out = [...new Set(ranked)].slice(0, size);
  for (const slug of picks) {
    if (out.length >= size) break;
    if (!out.includes(slug) && shown(slug)) out.push(slug);
  }
  return out;
}
