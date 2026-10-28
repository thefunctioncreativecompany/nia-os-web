# Explore press kits

Every Explore title and film (not creator films) has a press kit: the press tour on video, what
critics said (a spread of reviews, praise and criticism alike, each with our one-word read) and
context articles, plus box office and where to watch. The Top 10 are hand-made in
`src/components/explore/press-coverage.ts`; the rest live in `src/features/explore/press-kits.json`.

## Adding a title (do this for every new Explore addition)

1. `node scripts/build-press-kits.mjs <slug>` (write output to a file; piping it through `head`
   stalls it). Drafts go to `scripts/out/press-kit-drafts.json`, gaps to `press-kit-report.txt`.
   Reviews come from the title's Wikipedia reception section, videos from official YouTube
   uploaders that allow embedding, the IMDb id from Wikidata.
2. Where a title has fewer than two reviews, search edited publications (trade press, film
   critics, South African and Nigerian outlets) and add them.
3. Check every draft by hand: each video is the right film (titles get mixed up: "Go!" matched
   "Going Dutch", "Hounds" a Spanish "Sabuesos"), each verdict matches what the critic wrote, and
   non-reviews (awards lists, box office stories) go to Context or out.
4. `node scripts/apply-press-kits.mjs <slug>` moves it into the app.

## Gaps as of 2026-10-28

- No reviews found: children-of-blood-and-bone, go, the-brave-ones (Children of Blood and Bone opens in January 2027).
- One review only: fatal-seduction, inumber-number-jozi-gold, unseen, marked.
- No press videos beyond the trailer: mami-wata, sew-the-winter-to-my-skin, five-fingers-for-marseilles, goodbye-julia, inxeba, hounds, children-of-blood-and-bone, blood-and-water, the-polygamist, shaka-ilembe, dam, touki-bouki, black-girl, pumzi, fatal-seduction, inumber-number, inumber-number-jozi-gold, go, umthetho, kings-of-joburg, shadow, seriously-single, kandasamys-the-baby, the-brave-ones, unseen, marked, lobola-man, jerusalema.
- No English Wikipedia page: how-to-ruin-love, fatal-seduction, inumber-number, inumber-number-jozi-gold, the-brave-ones, marked.
- Publications that couldn't be searched from here (add by hand if wanted): The Guardian, The
  New York Times, Vulture, The New Yorker, Los Angeles Times, Decider.
