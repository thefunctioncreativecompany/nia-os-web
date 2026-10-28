// What the press kits gather for each of Explore's Top 10 (Ika, 2026-10-28): the press tour on
// video, what critics said and the context around a film, so a press kit is a source of
// information rather than a sales sheet. Gathered and checked 2026-10-28.
//  • Videos are ranked: the official trailer, then official interviews and featurettes from the
//    studio, streamer, festival or a major outlet (Variety, The Hollywood Reporter, Rotten
//    Tomatoes, GQ…), then video reviews by established critics. Each is on the uploader's own
//    channel and allowed to play on other sites (YouTube oEmbed). They play in the privacy-
//    enhanced player, only when pressed.
//  • Reviews are chosen to show the range of opinion, praise and criticism alike, from
//    publications with editors. Each is linked, never copied, and has our one-word read of its
//    verdict. No scores (Rotten Tomatoes' and IMDb's terms).
//  • Articles add context: history, controversy, how a film did.
import kits from "@/features/explore/press-kits.json";

export type PressVideo = {
  /** The YouTube video id. */
  id: string;
  kind: "Official trailer" | "Teaser" | "Cast interview" | "Filmmaker interview" | "Featurette" | "Press conference" | "Festival Q&A" | "Video review";
  title: string;
  /** The channel it's on. */
  channel: string;
};

export type Verdict = "Positive" | "Mixed" | "Critical";
export type PressPiece = { outlet: string; title: string; href: string };
// `verdict` is left out when the citing sentence doesn't make the critic's stance clear.
export type Review = PressPiece & { verdict?: Verdict };

export type PressCoverage = {
  videos: PressVideo[];
  reviews: Review[];
  articles: PressPiece[];
  /** Where it streams, when that's settled (a Netflix or Apple original). */
  streaming?: string;
  /** Released in cinemas, so Box Office Mojo has its takings. */
  cinemaRelease?: boolean;
  /** IMDb id, for the box office link when the title data has none (Wikidata). */
  imdb?: string;
};

export const PRESS: Record<string, PressCoverage> = {
  "the-dink": {
    streaming: "Apple TV",
    videos: [
      { id: "YyVNFzx5Pl8", kind: "Official trailer", title: "The Dink — Official Trailer", channel: "Apple TV" },
      { id: "Hth_LryAEgI", kind: "Featurette", title: "The cast of The Dink read mean pickleball comments", channel: "Apple TV" },
      { id: "XXYlrpOAvU0", kind: "Cast interview", title: "Jake Johnson on The Dink", channel: "The Daily Show" },
      { id: "AG5myyStsTU", kind: "Cast interview", title: "Aaron Chen on The Dink", channel: "The Daily Show" },
      { id: "q3hmx2Ch-rM", kind: "Cast interview", title: "Aaron Chen and Jake Johnson on The Dink", channel: "Etalk" },
    ],
    reviews: [
      { outlet: "Collider", verdict: "Positive", title: "Jake Johnson's New Apple TV Pickleball Comedy 'The Dink' Is Elevated by Its Performances", href: "https://collider.com/the-dink-review-apple-tv-jake-johnson/" },
      { outlet: "AV Club", verdict: "Positive", title: "The Dink review: Light pickleball comedy serves big laughs", href: "https://www.avclub.com/the-dink-review" },
      { outlet: "Variety", verdict: "Mixed", title: "'The Dink' Review: Jake Johnson in a Mild Sports Comedy", href: "https://variety.com/2026/film/reviews/the-dink-review-1236818906/" },
      { outlet: "IndieWire", verdict: "Mixed", title: "The Dink Review: Jake Johnson in Sweet Apple TV Pickleball Comedy", href: "https://www.indiewire.com/criticism/movies/the-dink-movie-review-pickleball-apple-tv-1235206293/" },
      { outlet: "The Hollywood Reporter", verdict: "Critical", title: "'The Dink' Review: Jake Johnson's Failed Tennis Prodigy Restores His Self-Respect Through Pickleball in Apple TV's Anodyne Sports Comedy", href: "https://www.hollywoodreporter.com/movies/movie-reviews/the-dink-review-jake-johnson-pickleball-apple-tv-1236650681/" },
    ],
    articles: [
      { outlet: "SlashFilm", title: "Jake Johnson's 103-Minute Comedy Is Officially Apple TV's Biggest Streaming Hit", href: "https://www.slashfilm.com/2243157/jake-johnson-comedy-the-dink-streaming-apple-tv-august-2026/" },
    ],
  },
  "the-woman-king": {
    cinemaRelease: true,
    videos: [
      { id: "3RDaPV_rJ1Y", kind: "Official trailer", title: "The Woman King – Official Trailer", channel: "Sony Pictures Entertainment" },
      { id: "tfWkbqXsl8A", kind: "Cast interview", title: "'The Woman King' cast on Viola Davis, sisterhood, and redefining Black women in cinema", channel: "Rotten Tomatoes" },
      { id: "8Xl6VIF0Is8", kind: "Cast interview", title: "Viola Davis and 'The Woman King' cast at TIFF 2022", channel: "Variety" },
      { id: "seQbgcZ09xw", kind: "Featurette", title: "The Woman King – Filming in South Africa", channel: "Sony Pictures Entertainment" },
      { id: "M92pX36E3Vw", kind: "Cast interview", title: "Viola Davis and 'The Woman King' cast discuss a Black female character-driven film", channel: "The Hollywood Reporter" },
      { id: "CTjQQbZg4OQ", kind: "Filmmaker interview", title: "Director Gina Prince-Bythewood discusses The Woman King", channel: "CBS Mornings" },
      { id: "W-p1l2zv2Ec", kind: "Festival Q&A", title: "The Woman King Q&A with Viola Davis, John Boyega, Gina Prince-Bythewood", channel: "TIFF" },
    ],
    reviews: [
      { outlet: "IndieWire", verdict: "Positive", title: "'The Woman King' Review: Crowd-Pleasing Action Epic Shouldn't Be Rare", href: "https://www.indiewire.com/criticism/movies/the-woman-king-review-viola-davis-1234759337/" },
      { outlet: "Screen Daily", verdict: "Positive", title: "'The Woman King': Toronto Review", href: "https://www.screendaily.com/reviews/the-woman-king-toronto-review/5174330.article" },
      { outlet: "Variety", verdict: "Mixed", title: "'The Woman King' Review: Viola Davis Leads an Army of African Warriors", href: "https://variety.com/2022/film/reviews/the-woman-king-review-viola-davis-1235367711/" },
      { outlet: "The Hollywood Reporter", verdict: "Mixed", title: "'The Woman King' Review: Viola Davis in Gina Prince-Bythewood's Epic", href: "https://www.hollywoodreporter.com/movies/movie-reviews/the-woman-king-viola-davis-gina-prince-bythewood-thuso-mbedu-1235215820/" },
      { outlet: "AV Club", verdict: "Mixed", title: "The Woman King crowns Viola Davis as a believable badass", href: "https://www.avclub.com/woman-king-movie-review-viola-davis-john-boyega-1849532158" },
    ],
    articles: [
      { outlet: "Variety", title: "Viola Davis, Julius Tennon Talk 'Woman King' and Historical Accuracy", href: "https://variety.com/2022/awards/awards/viola-davis-julius-tennon-the-woman-king-historical-facts-box-office-1235377450/" },
    ],
  },
  phantom: {
    cinemaRelease: true,
    videos: [
      { id: "gAkyPwk1_Pk", kind: "Official trailer", title: "Phantom – Official international main trailer", channel: "CJ ENM" },
      { id: "8E-6lXi8-wk", kind: "Teaser", title: "Phantom – Official international first teaser", channel: "CJ ENM" },
      { id: "Q-uw-Vajqes", kind: "Press conference", title: "The stars of 'Phantom' at the film's press call", channel: "Dispatch" },
      { id: "SrW-NBIuoh8", kind: "Cast interview", title: "The Point Men, Phantom | Korea24", channel: "KBS World" },
      { id: "D3pmEh0fSio", kind: "Festival Q&A", title: "NYAFF 2023: Phantom – Q&A", channel: "New York Asian Film Festival" },
    ],
    reviews: [
      { outlet: "Seongyong's Private Place (Seongyong Cho)", verdict: "Positive", title: "Phantom (2023): Catch the Spy", href: "https://kaist455.com/2023/01/19/phantom-2023" },
      { outlet: "The Asian Cinema Critic", verdict: "Critical", title: "Phantom", href: "https://theasiancinemacritic.com/2023/11/08/phantom/" },
    ],
    articles: [
      { outlet: "The Korea Times", title: "'Phantom' is action-packed spy thriller with multi-layered mystery", href: "https://www.koreatimes.co.kr/entertainment/films/20221219/phantom-is-action-packed-spy-thriller-with-multi-layered-mystery" },
      { outlet: "New Zealand International Film Festival", title: "Phantom (NZIFF 2023)", href: "https://www.nziff.co.nz/2023/archive/phantom/" },
    ],
  },
  blonde: {
    streaming: "Netflix",
    videos: [
      { id: "aIsFywuZPoQ", kind: "Official trailer", title: "Blonde – Official Trailer", channel: "Netflix" },
      { id: "VnI2MyS6fgo", kind: "Teaser", title: "Blonde – Official Teaser", channel: "Netflix" },
      { id: "3QRborm-aVM", kind: "Video review", title: "Mark Kermode reviews Blonde", channel: "Kermode and Mayo's Take" },
    ],
    reviews: [
      { outlet: "Variety", verdict: "Mixed", title: "'Blonde' Review: Ana de Armas Does Just What You Want — She Becomes Marilyn Monroe — in Andrew Dominik's Flawed but Haunting Biopic", href: "https://variety.com/2022/film/reviews/blonde-review-ana-de-armas-andrew-dominik-adrien-brody-marilyn-monroe-1235362257/" },
      { outlet: "Empire", verdict: "Mixed", title: "Blonde Review", href: "https://www.empireonline.com/movies/reviews/blonde-2/" },
      { outlet: "RogerEbert.com", verdict: "Mixed", title: "Blonde movie review", href: "https://www.rogerebert.com/reviews/blonde-movie-review-2022" },
      { outlet: "IndieWire", verdict: "Critical", title: "'Blonde' Review: Andrew Dominik's Miserable Marilyn Monroe Portrait", href: "https://www.indiewire.com/criticism/movies/blonde-review-marilyn-monroe-ana-de-armas-1234759905/" },
    ],
    articles: [
      { outlet: "IndieWire", title: "Joyce Carol Oates: Andrew Dominik's 'Blonde' Lacks 'Male Gaze,' and Ana de Armas Is 'Wonderful'", href: "https://www.indiewire.com/features/general/blonde-ana-de-armas-joyce-carol-oates-andrew-dominik-1234740565/" },
      { outlet: "IndieWire", title: "Just How Miserable Is 'Blonde' Supposed to Make Audiences?", href: "https://www.indiewire.com/2022/09/blonde-miserable-movie-netflix-1234767545/" },
    ],
  },
  "500-days-of-summer": {
    cinemaRelease: true,
    videos: [
      { id: "PsD0NpFSADM", kind: "Official trailer", title: "500 Days of Summer – Official Trailer", channel: "Searchlight Pictures" },
      { id: "-RGj5yeF9Rg", kind: "Featurette", title: "500 Days of Summer: Joe and Zooey on music", channel: "Searchlight Pictures" },
      { id: "IVbrLRw_fzU", kind: "Filmmaker interview", title: "Marc Webb on (500) Days of Summer", channel: "Empire Magazine" },
      { id: "zDmc1nZSWRM", kind: "Filmmaker interview", title: "The Art of Storytelling: Marc Webb on pop music in (500) Days of Summer", channel: "Sundance Institute" },
      { id: "43sJlTHJetk", kind: "Cast interview", title: "Joseph Gordon-Levitt rewatches 500 Days of Summer and more", channel: "Vanity Fair" },
    ],
    reviews: [
      { outlet: "RogerEbert.com", verdict: "Positive", title: "A perfect love not meant to last", href: "https://www.rogerebert.com/reviews/500-days-of-summer-2009" },
      { outlet: "Empire", verdict: "Positive", title: "500 Days of Summer Review", href: "https://www.empireonline.com/movies/reviews/500-days-summer-review/" },
      { outlet: "Variety", verdict: "Positive", title: "500 Days of Summer", href: "https://variety.com/2009/film/reviews/500-days-of-summer-1200473272/" },
      { outlet: "The Hollywood Reporter", verdict: "Mixed", title: "500 Days of Summer Review", href: "https://www.hollywoodreporter.com/movies/movie-reviews/500-days-summer-review-movie-92769/" },
      { outlet: "Slant Magazine", verdict: "Mixed", title: "Review: (500) Days of Summer", href: "https://www.slantmagazine.com/film/500-days-of-summer/" },
    ],
    articles: [
      { outlet: "AV Club", title: "After a decade of discourse, (500) Days Of Summer is basically the Fight Club of rom-coms", href: "https://www.avclub.com/after-a-decade-of-discourse-500-days-of-summer-is-ba-1837104854" },
    ],
  },
  scream: {
    cinemaRelease: true,
    videos: [
      { id: "i3J6ACKQ7K0", kind: "Official trailer", title: "Scream – Official Trailer", channel: "Miramax" },
      { id: "KGNyHAFys-g", kind: "Video review", title: "Scream – Movie Review", channel: "Chris Stuckmann" },
    ],
    reviews: [
      { outlet: "The Washington Post", verdict: "Positive", title: "Go Ahead and 'Scream'", href: "https://www.washingtonpost.com/wp-srv/style/longterm/review96/screamharr.htm" },
      { outlet: "RogerEbert.com", verdict: "Positive", title: "Scream movie review", href: "https://www.rogerebert.com/reviews/scream-1996" },
      { outlet: "Empire", verdict: "Positive", title: "Scream Review", href: "https://www.empireonline.com/movies/reviews/scream-review/" },
      { outlet: "Variety", verdict: "Critical", title: "Film Review: 'Scream'", href: "https://variety.com/1996/film/reviews/scream-1117436711/" },
    ],
    articles: [
      { outlet: "AV Club", title: "Wes Craven's Scream opens with a self-contained master class in horror", href: "https://www.avclub.com/wes-craven-s-scream-opens-with-a-self-contained-master-1798283911" },
      { outlet: "AV Club", title: "The Scream movie series revitalized horror—then left no lasting mark on the genre", href: "https://www.avclub.com/the-scream-series-revitalized-horror-then-left-no-lasti-1798248476" },
    ],
  },
  "the-queens-gambit": {
    streaming: "Netflix",
    videos: [
      { id: "oZn3qSgmLqI", kind: "Official trailer", title: "The Queen's Gambit – Limited series trailer", channel: "Rotten Tomatoes TV" },
      { id: "LzDhpEInMIg", kind: "Featurette", title: "Creating The Queen's Gambit", channel: "Netflix" },
      { id: "0jhYr0nhSAE", kind: "Cast interview", title: "The Queen's Gambit cast: Anya Taylor-Joy, Thomas Brodie-Sangster and more", channel: "The Hollywood Reporter" },
      { id: "BzQOV5eTOc0", kind: "Filmmaker interview", title: "Showrunners Peter Morgan and Scott Frank in conversation", channel: "Netflix" },
      { id: "FQX6xndrt0c", kind: "Filmmaker interview", title: "Co-creator Scott Frank on creating The Queen's Gambit", channel: "American Film Institute" },
      { id: "Dz12pCwA41A", kind: "Cast interview", title: "Anya Taylor-Joy on The Queen's Gambit and winning a Golden Globe", channel: "InStyle" },
    ],
    reviews: [
      { outlet: "The Hollywood Reporter", verdict: "Positive", title: "'The Queen's Gambit' Review", href: "https://www.hollywoodreporter.com/review/the-queens-gambit-tv-review" },
      { outlet: "Variety", verdict: "Positive", title: "The Queen's Gambit Review: Anya Taylor-Joy Owns Netflix Chess Drama", href: "https://variety.com/2020/tv/reviews/the-queens-gambit-review-anya-taylor-joy-1234810169/" },
      { outlet: "RogerEbert.com", verdict: "Positive", title: "The Queen's Gambit review", href: "https://www.rogerebert.com/reviews/the-queens-gambit-movie-review-2020" },
      { outlet: "IndieWire", verdict: "Positive", title: "'The Queen's Gambit' Review: Anya Taylor-Joy Dominates Chess", href: "https://www.indiewire.com/criticism/shows/queens-gambit-review-netflix-anya-taylor-joy-chess-1234594891/" },
      { outlet: "AV Club", verdict: "Mixed", title: "The Queen's Gambit offers a winning combo of escapism and period drama", href: "https://www.avclub.com/the-queen-s-gambit-offers-a-winning-combo-of-escapism-a-1845370854" },
    ],
    articles: [
      { outlet: "IndieWire", title: "How the show enlisted chess expert Bruce Pandolfini", href: "https://indiewire.com/2020/10/queens-gambit-netflix-chess-expert-bruce-pandolfini-1234594484" },
    ],
  },
  michael: {
    cinemaRelease: true,
    videos: [
      { id: "mbtgEE6rkxw", kind: "Official trailer", title: "Michael (2026) – Official Trailer", channel: "Lionsgate Movies" },
      { id: "k1IRsn-92vc", kind: "Cast interview", title: "Becoming Michael with Jaafar Jackson", channel: "GQ" },
      { id: "7LULuLGcWVo", kind: "Cast interview", title: "Meet the Jacksons: Nia Long, Colman Domingo and Jaafar Jackson", channel: "ESSENCE" },
      { id: "vYPDIJUF42M", kind: "Cast interview", title: "Jaafar Jackson on playing his uncle Michael Jackson", channel: "Jimmy Kimmel Live" },
      { id: "arTDY_bKCa0", kind: "Video review", title: "Michael – Movie Review", channel: "Chris Stuckmann" },
    ],
    reviews: [
      { outlet: "Variety", verdict: "Positive", title: "'Michael' Review: The Thrill Is Not Gone, as a Surprisingly Effective Middle-of-the-Road Biopic Conducts Michael Jackson's Electricity", href: "https://variety.com/2026/film/reviews/michael-review-michael-jackson-colman-domingo-antoine-fuqua-1236723755/" },
      { outlet: "The Hollywood Reporter", verdict: "Mixed", title: "'Michael' Review: Antoine Fuqua's Fan-Friendly, Family-Sanctioned Michael Jackson Bio-Drama Is Sanitized but More Soulful Than You Might Expect", href: "https://www.hollywoodreporter.com/movies/movie-reviews/michael-review-michael-jackson-biopic-jaafar-jackson-1236568847/" },
      { outlet: "Screen Daily", verdict: "Critical", title: "'Michael' review: Antoine Fuqua's bland biopic glosses over Michael Jackson's troubled legacy", href: "https://www.screendaily.com/reviews/michael-review-antoine-fuquas-bland-biopic-glosses-over-michael-jacksons-troubled-legacy/5215839.article" },
      { outlet: "IndieWire", verdict: "Critical", title: "'Michael' Film Review: Michael Jackson Biopic Is Sanitized, Dull", href: "https://www.indiewire.com/criticism/movies/michael-review-jackson-movie-biopic-sanitized-dull-1235189524/" },
      { outlet: "RogerEbert.com", verdict: "Critical", title: "Michael review", href: "https://www.rogerebert.com/reviews/michael-jackson-biopic-film-review-2026" },
    ],
    articles: [
      { outlet: "Variety", title: "'Leaving Neverland' Director Torches 'Michael' and Antoine Fuqua for Whitewashing Michael Jackson's Alleged Abuse", href: "https://variety.com/2026/film/features/leaving-neverland-director-torches-michael-alleged-abuse-1236732764/" },
      { outlet: "Variety", title: "Do Biopics Have a Double Standard? How 'Michael' Could Overcome Bad Reviews and See Awards Prospects for Jaafar Jackson", href: "https://variety.com/2026/film/awards/michael-jaafar-jackson-oscars-biopic-double-standard-1236730193/" },
    ],
  },
  "madeas-destination-wedding": {
    streaming: "Netflix",
    videos: [
      { id: "WdAYvmk4QjA", kind: "Official trailer", title: "Tyler Perry's Madea's Destination Wedding – Official Trailer", channel: "Netflix" },
      { id: "LuHqiOvEajc", kind: "Video review", title: "Tyler Perry's Madea's Destination Wedding – Movie Review", channel: "Double Toasted" },
    ],
    reviews: [
      { outlet: "Variety", verdict: "Mixed", title: "'Madea's Destination Wedding' Review: Tyler Perry Revives Alter Ego", href: "https://variety.com/2025/film/reviews/madeas-destination-wedding-review-tyler-perry-1236459079/" },
      { outlet: "RogerEbert.com", verdict: "Critical", title: "Madea's Destination Wedding movie review", href: "https://www.rogerebert.com/reviews/madeas-destination-wedding-netflix-tyler-perry-movie-review-2025" },
    ],
    articles: [
      { outlet: "Collider", title: "How the film stayed in Netflix's top 10 for three weeks despite poor reviews", href: "https://collider.com/tyler-perry-madeas-destination-wedding-streaming-success-netflix-july-2025/" },
    ],
  },
  "obsession-series": {
    streaming: "Netflix",
    videos: [
      { id: "QparPBLUeEI", kind: "Official trailer", title: "Obsession – Official Trailer", channel: "Netflix" },
      { id: "94yIltg6Y-c", kind: "Cast interview", title: "Richard Armitage answers questions from the “Armitage Army”", channel: "Still Watching Netflix" },
      { id: "gB_j-03jmXg", kind: "Cast interview", title: "Richard Armitage and Charlie Murphy on Netflix's Obsession", channel: "This Morning" },
      { id: "5Dw8flhskSQ", kind: "Cast interview", title: "Richard Armitage, Charlie Murphy and Indira Varma on Obsession", channel: "Digital Spy" },
      { id: "6834LjF4gHo", kind: "Cast interview", title: "Richard Armitage and Charlie Murphy on Netflix's Obsession", channel: "HeyUGuys" },
    ],
    reviews: [
      { outlet: "Collider", verdict: "Positive", title: "'Obsession' Review: Richard Armitage Stars in a Steamy Adaptation That Doubles Down on Toxicity", href: "https://collider.com/obsession-netflix-2023-review/" },
      { outlet: "Screen Rant", verdict: "Mixed", title: "Netflix's 4-part thriller is worth an easy one-night binge", href: "https://screenrant.com/netflix-obsession-series-thriller-easy-binge-watch/" },
    ],
    articles: [],
  },
};
// The Top 10 has "obsession-series"; the poster grid's "obsession" is the same show.
PRESS.obsession = PRESS["obsession-series"];

// Every other film and title's press kit, built by scripts/build-press-kits.mjs from Wikipedia's
// cited reviews and official YouTube uploads, then checked by hand (Ika, 2026-10-28).
const KITS = kits as unknown as Record<string, PressCoverage>;

export const getPress = (id: string): PressCoverage | null => PRESS[id] ?? KITS[id] ?? null;
