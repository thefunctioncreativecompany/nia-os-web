// What the press-kit preview shows for each film (Ika, 2026-10-20): the official video and a few
// facts. Facts and the IMDb / Rotten Tomatoes / Wikipedia addresses come from Wikidata (free to
// reuse); summaries are our own words. Nothing is copied from IMDb or Rotten Tomatoes, and there
// are no scores: their terms don't allow it without a licence. Each video was checked (2026-10-20)
// to be on the studio's or streamer's own YouTube channel and allowed to play on other sites.

export type FilmVideo = {
  /** The YouTube video id. */
  id: string;
  label: "Official trailer" | "International trailer" | "Behind the scenes";
  /** The YouTube channel it's on. */
  channel: string;
};

export type FilmDetails = {
  kind: "Film" | "Series" | "Limited series";
  year: number;
  /** Minutes, for films. */
  minutes?: number;
  /** For series. */
  episodes?: number;
  genres: string[];
  starring: string[];
  /** "Created by" for series that credit creators rather than one director. */
  createdBy?: string;
  basedOn?: string;
  country?: string;
  summary: string;
  /** Null when no official upload could be found; the preview then shows the details only. */
  video: FilmVideo | null;
  imdb: string;
  /** Rotten Tomatoes path, e.g. "m/hamnet". */
  rottenTomatoes?: string;
  /** English Wikipedia page title. */
  wikipedia: string;
};

const OBSESSION: FilmDetails = {
  kind: "Limited series",
  year: 2023,
  episodes: 4,
  genres: ["Thriller", "Drama"],
  starring: ["Richard Armitage", "Charlie Murphy", "Indira Varma", "Rish Shah"],
  basedOn: "Damage by Josephine Hart",
  country: "United Kingdom",
  summary: "A respected surgeon falls into an all-consuming affair with the woman his son is about to marry.",
  // Netflix's own upload couldn't be found; only copies on other channels.
  video: null,
  imdb: "tt18831118",
  rottenTomatoes: "tv/obsession_2023",
  wikipedia: "Obsession (2023 TV series)",
};

export const FILM_DETAILS: Record<string, FilmDetails> = {
  hamnet: {
    kind: "Film",
    year: 2025,
    minutes: 125,
    genres: ["Drama", "Period"],
    starring: ["Jessie Buckley", "Paul Mescal", "Emily Watson", "Joe Alwyn"],
    basedOn: "Hamnet by Maggie O'Farrell",
    country: "United Kingdom",
    summary: "Agnes and her husband, William Shakespeare, live through the loss of their young son in the years before Hamlet is written.",
    video: { id: "xYcgQMxQwmk", label: "Official trailer", channel: "Focus Features" },
    imdb: "tt14905854",
    rottenTomatoes: "m/hamnet",
    wikipedia: "Hamnet (film)",
  },
  sinners: {
    kind: "Film",
    year: 2025,
    minutes: 137,
    genres: ["Horror", "Drama"],
    starring: ["Michael B. Jordan", "Hailee Steinfeld", "Delroy Lindo", "Wunmi Mosaku", "Jack O'Connell"],
    country: "United States",
    summary: "Twin brothers come home to 1930s Mississippi to open a juke joint, and find an older evil waiting for them.",
    video: { id: "bKGxHflevuk", label: "Official trailer", channel: "Warner Bros." },
    imdb: "tt31193180",
    rottenTomatoes: "m/sinners_2025",
    wikipedia: "Sinners (2025 film)",
  },
  "heart-of-the-hunter": {
    kind: "Film",
    year: 2024,
    genres: ["Action", "Thriller"],
    starring: ["Bonko Khoza", "Connie Ferguson", "Masasa Mbangeni", "Tim Theron", "Nicole Fortuin"],
    basedOn: "Heart of the Hunter by Deon Meyer",
    country: "South Africa",
    summary: "A retired assassin is pulled back in when a friend uncovers a conspiracy that reaches the top of government.",
    video: { id: "KSCFWJvcYXE", label: "Official trailer", channel: "Netflix" },
    imdb: "tt28943278",
    rottenTomatoes: "m/heart_of_the_hunter",
    wikipedia: "Heart of the Hunter (film)",
  },
  "the-odyssey": {
    kind: "Film",
    year: 2026,
    minutes: 172,
    genres: ["Fantasy", "Adventure"],
    starring: ["Matt Damon", "Tom Holland", "Anne Hathaway", "Zendaya", "Lupita Nyong'o", "Robert Pattinson", "Charlize Theron"],
    basedOn: "The Odyssey by Homer",
    country: "United States, United Kingdom",
    summary: "After the Trojan War, Odysseus spends ten years fighting gods, monsters and the sea to get home. Shot entirely on IMAX film.",
    video: { id: "Mzw2ttJD2qQ", label: "Official trailer", channel: "Universal Pictures" },
    imdb: "tt33764258",
    rottenTomatoes: "m/the_odyssey_2026",
    wikipedia: "The Odyssey (2026 film)",
  },
  "the-polygamist": {
    kind: "Series",
    year: 2026,
    episodes: 22,
    genres: ["Drama"],
    starring: [],
    basedOn: "The Polygamist by Sue Nyathi",
    country: "South Africa",
    summary: "A wealthy family's matriarch watches her world come apart as her husband's other wives and secrets come to light.",
    video: { id: "KBJllQVRuAA", label: "Official trailer", channel: "AfricaOnNetflix" },
    imdb: "tt42543947",
    rottenTomatoes: "tv/the_polygamist",
    wikipedia: "The Polygamist",
  },
  "avatar-the-way-of-water": {
    kind: "Film",
    year: 2022,
    minutes: 192,
    genres: ["Science fiction", "Adventure"],
    starring: ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver", "Stephen Lang", "Kate Winslet"],
    country: "United States",
    summary: "More than a decade after the first film, Jake Sully's family takes refuge with Pandora's ocean clans when an old enemy returns.",
    video: { id: "d9MyW72ELq0", label: "Official trailer", channel: "Avatar" },
    imdb: "tt1630029",
    rottenTomatoes: "m/avatar_the_way_of_water",
    wikipedia: "Avatar: The Way of Water",
  },
  // The design lists the series twice, once as "Obsession" and once as "Obsession (series)".
  obsession: OBSESSION,
  "obsession-series": OBSESSION,
  "the-dink": {
    kind: "Film",
    year: 2026,
    genres: ["Comedy", "Sport"],
    starring: ["Jake Johnson", "Mary Steenburgen", "Ben Stiller", "Ed Harris"],
    country: "United States",
    summary: "A washed-up tennis player heads home and, very reluctantly, takes up pickleball.",
    video: { id: "YyVNFzx5Pl8", label: "Official trailer", channel: "Apple TV" },
    imdb: "tt33499146",
    rottenTomatoes: "m/the_dink",
    wikipedia: "The Dink",
  },
  "the-woman-king": {
    kind: "Film",
    year: 2022,
    minutes: 135,
    genres: ["Historical", "Action"],
    starring: ["Viola Davis", "Thuso Mbedu", "Lashana Lynch", "Sheila Atim", "John Boyega"],
    country: "United States",
    summary: "In 1820s West Africa, the Agojie, the all-woman army of the Kingdom of Dahomey, train a new generation to defend their home.",
    video: { id: "3RDaPV_rJ1Y", label: "Official trailer", channel: "Sony Pictures Entertainment" },
    imdb: "tt8093700",
    rottenTomatoes: "m/the_woman_king",
    wikipedia: "The Woman King",
  },
  phantom: {
    kind: "Film",
    year: 2023,
    minutes: 133,
    genres: ["Spy", "Action"],
    starring: ["Sul Kyung-gu", "Lee Hanee", "Park So-dam", "Park Hae-soo", "Seo Hyun-woo"],
    basedOn: "The Message by Mai Jia",
    country: "South Korea",
    summary: "In 1933, in Japanese-occupied Korea, five suspects held in a remote hotel must expose the resistance spy among them.",
    video: { id: "gAkyPwk1_Pk", label: "International trailer", channel: "CJ ENM" },
    imdb: "tt25503544",
    wikipedia: "Phantom (2023 film)",
  },
  blonde: {
    kind: "Film",
    year: 2022,
    minutes: 167,
    genres: ["Drama", "Biographical"],
    starring: ["Ana de Armas", "Adrien Brody", "Bobby Cannavale", "Julianne Nicholson"],
    basedOn: "Blonde by Joyce Carol Oates",
    country: "United States",
    summary: "A fictional reimagining of Marilyn Monroe's life, from her childhood as Norma Jeane to the height of her fame.",
    video: { id: "aIsFywuZPoQ", label: "Official trailer", channel: "Netflix" },
    imdb: "tt1655389",
    rottenTomatoes: "m/blonde",
    wikipedia: "Blonde (2022 film)",
  },
  "500-days-of-summer": {
    kind: "Film",
    year: 2009,
    minutes: 95,
    genres: ["Romantic comedy"],
    starring: ["Joseph Gordon-Levitt", "Zooey Deschanel", "Geoffrey Arend", "Chloë Grace Moretz"],
    country: "United States",
    summary: "A greeting-card writer replays, out of order, the 500 days he spent with a woman who didn't believe in love.",
    video: { id: "PsD0NpFSADM", label: "Official trailer", channel: "Searchlight Pictures" },
    imdb: "tt1022603",
    rottenTomatoes: "m/500_days_of_summer",
    wikipedia: "500 Days of Summer",
  },
  scream: {
    kind: "Film",
    year: 1996,
    minutes: 111,
    genres: ["Horror", "Slasher"],
    starring: ["Neve Campbell", "Courteney Cox", "David Arquette", "Skeet Ulrich", "Drew Barrymore"],
    country: "United States",
    summary: "A year after her mother's murder, a teenager is hunted by a masked killer who knows every rule of horror films.",
    video: { id: "U0LETmDvuXc", label: "Official trailer", channel: "Paramount Movies" },
    imdb: "tt0117571",
    rottenTomatoes: "m/1074316-scream",
    wikipedia: "Scream (1996 film)",
  },
  "the-queens-gambit": {
    kind: "Limited series",
    year: 2020,
    episodes: 7,
    genres: ["Drama"],
    starring: ["Anya Taylor-Joy", "Bill Camp", "Marielle Heller", "Thomas Brodie-Sangster", "Harry Melling"],
    createdBy: "Scott Frank and Allan Scott",
    basedOn: "The Queen's Gambit by Walter Tevis",
    country: "United States",
    summary: "An orphaned chess prodigy rises through the 1950s and 60s chess world while fighting addiction.",
    // Ika's pick: Netflix's behind-the-scenes film, closer to a press kit than the trailer.
    video: { id: "LzDhpEInMIg", label: "Behind the scenes", channel: "Netflix" },
    imdb: "tt10048342",
    rottenTomatoes: "tv/the_queens_gambit",
    wikipedia: "The Queen's Gambit (miniseries)",
  },
  michael: {
    kind: "Film",
    year: 2026,
    minutes: 127,
    genres: ["Biographical", "Musical"],
    starring: ["Jaafar Jackson", "Colman Domingo", "Nia Long", "Miles Teller", "Laura Harrier"],
    country: "United States",
    summary: "Michael Jackson's story, from the Jackson 5 to his years as the biggest solo star in the world.",
    video: { id: "mbtgEE6rkxw", label: "Official trailer", channel: "Lionsgate Movies" },
    imdb: "tt11378946",
    rottenTomatoes: "m/michael",
    wikipedia: "Michael (2026 film)",
  },
  "madeas-destination-wedding": {
    kind: "Film",
    year: 2025,
    genres: ["Comedy"],
    starring: ["Tyler Perry", "Cassi Davis", "David Mann", "Tamela Mann", "Diamond White"],
    country: "United States",
    summary: "Madea and the family fly to the Bahamas for a surprise wedding that nobody, least of all Madea, is ready for.",
    video: { id: "WdAYvmk4QjA", label: "Official trailer", channel: "Netflix" },
    imdb: "tt33299083",
    rottenTomatoes: "m/madeas_destination_wedding",
    wikipedia: "Madea's Destination Wedding",
  },
  oppenheimer: {
    kind: "Film",
    year: 2023,
    minutes: 180,
    genres: ["Historical", "Biographical"],
    starring: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
    basedOn: "American Prometheus by Kai Bird and Martin J. Sherwin",
    country: "United States, United Kingdom",
    summary: "J. Robert Oppenheimer leads the race to build the atomic bomb, then has to live with what it unleashes.",
    video: { id: "bK6ldnjE3Y0", label: "Official trailer", channel: "Universal Pictures" },
    imdb: "tt15398776",
    rottenTomatoes: "m/oppenheimer_2023",
    wikipedia: "Oppenheimer (film)",
  },
};

export const getFilmDetails = (id: string): FilmDetails | null => FILM_DETAILS[id] ?? null;

// "2 h 5 min", "7 episodes".
export function lengthOf(d: FilmDetails) {
  if (d.minutes) {
    const h = Math.floor(d.minutes / 60);
    const m = d.minutes % 60;
    return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
  }
  return d.episodes ? `${d.episodes} episodes` : null;
}

export const linksFor = (d: FilmDetails) =>
  [
    { label: "IMDb", href: `https://www.imdb.com/title/${d.imdb}/` },
    d.rottenTomatoes && { label: "Rotten Tomatoes", href: `https://www.rottentomatoes.com/${d.rottenTomatoes}` },
    { label: "Wikipedia", href: `https://en.wikipedia.org/wiki/${encodeURIComponent(d.wikipedia.replaceAll(" ", "_"))}` },
  ].filter((l): l is { label: string; href: string } => !!l);
