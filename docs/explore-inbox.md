# Explore inbox: adding creator films from links

Ika (2026-11-14) collects links in the Notion database **Nia Explore inbox**
(data source `collection://41840e2b-c907-81e3-a91e-000be3602139`) or pastes them in chat. Each link
is added end to end and pushed to `main` without asking. This is how.

## Which links go on Explore

- Creator work: commercials, fashion films, music videos, shorts, branded and social content,
  wedding and event films, AI-made films. Instagram reels and posts, or YouTube videos.
- Held, with the reason in Result: trailers and clips from studios, streamers, festivals or
  networks (they belong with the full titles, not Creators); anything already on Explore (search
  `src/features/explore/creators.ts` for the code); anything the Note asks for that needs a new
  feature or design (for example "add to AmaBusker as stills").

## Steps for each Instagram link

1. `npm i --no-save puppeteer-core` (or `puppeteer` where there's no Chrome), then
   `node scripts/read-instagram-posts.mjs <links…>`. It prints each caption, account, posting day
   and cover size, and saves the cover to `public/explore/creators/<code>.jpg`. If Instagram
   shows nothing (blocked or removed), set Status **Needs Mac** and move on.
2. Look at each cover. `aspect` is the picture's own shape (9 / 16, 16 / 9, 4 / 3 or the measured
   ratio, without black bars). If the embed showed a different shape (a square post around a
   4:3 picture), add `frame` with the shape the player shows (1 for square, 4 / 5 for portrait).
3. Write the film into the `FILMS` list at the end of `src/features/explore/creators.ts`, like the
   entries above it:
   - `title`: plain and factual, never a slogan. "Brand: what it is", "Artist: song", or the
     film's own name.
   - `type`: one of `PRODUCTION_TYPES` in `src/lib/projects.ts` (weddings are Live Event).
   - `brand`, `country` (only when the caption or the brand makes it clear; else null),
     `date` (the posting day), `added` (today).
   - `summary`: one or two sentences in Nia's own words, from the caption and the cover.
   - `credits`: exactly as the caption gives them, `c(role, name, handle)`. Where the caption
     gives only an @handle, the name is the handle. Never guess a person's name.
   - YouTube: `platform: "youtube"`, `account` is the channel id, `channel` its name; credits
     from the description.
4. Add 12 to 14 tags to `HAND_TAGS` in `src/features/explore/tag-data.ts` (after the last
   `creator-` line), only from the vocabulary in `src/features/explore/tags.ts`: subject, setting,
   camera, mood, craft and use. If the film's country isn't in `REGIONS` there, add it.
5. Run `node scripts/measure-explore-covers.mjs`, `node scripts/check-instagram-embeds.mjs
   <codes>` (mark `embeds: false` on any that won't play), `node
   scripts/build-explore-timeline-data.mjs`, `npx tsc --noEmit -p .` and
   `npx vitest run src/features/explore`.
6. Commit only these files (other work may be in progress in the same folder):
   `creators.ts`, `tag-data.ts`, `tags.ts` if changed, `cover-looks.json`, `palettes.json`,
   `release-dates.json` and the new covers. Message: "Explore: N new creator films" with a short
   list. Push with `git push origin HEAD:main` (one push, to main only).
7. In Notion, set each row's Status (Added, Held or Needs Mac), Result (the title on Explore, or
   why it was held) and Done on (today).
