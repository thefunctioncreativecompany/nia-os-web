// Creators (Ika, 2026-10-21): commercials, fashion films, music videos and shorts made by
// independent creators and studios, shared on Instagram, with their production credits. Nia isn't
// only for filmmakers, and studios and streamers increasingly look to creators to develop and own
// IP, so Explore curates their work too: distraction-free, credited, linked to the original post.
// Titles and summaries are Nia's own; credits are taken from each post's caption (2026-10-21);
// posting dates come from each post's address. Where a caption gives only an @handle, the credit
// shows the handle as posted rather than a guessed name. Films play in Instagram's own player.
import type { ProductionType } from "@/lib/projects";

export type Credit = { role: string; name: string; handle?: string };

export type CreatorFilm = {
  /** Its Instagram reel code, which is also its address on Nia. */
  code: string;
  slug: string;
  title: string;
  type: ProductionType;
  /** Who posted it on Instagram. */
  account: string;
  brand: string | null;
  /** The film's shape as width ÷ height: landscape films as measured, vertical ones at the 4:5
   * Instagram's player shows them in. */
  aspect: number;
  /** When it was posted. */
  date: string;
  country: string | null;
  summary: string;
  credits: Credit[];
};

const c = (role: string, name: string, handle?: string): Credit => ({ role, name, handle });

const FILMS: Omit<CreatorFilm, "slug">[] = [
  {
    code: "DDzBw_xKbKm",
    aspect: 4 / 5,
    title: "adidas Originals LO PRO, director's cut",
    type: "Commercial",
    account: "roomstudio_",
    brand: "adidas Originals",
    date: "2024-12-20",
    country: null,
    summary: "The director's cut of adidas Originals' LO PRO film, made with the brand's Emerging Markets team and a cast of eight.",
    credits: [
      c("Client", "adidas Originals", "adidasoriginals"),
      c("Agency", "Room Studios", "roomstudio_"),
      c("Brand strategist", "Eden Toohey Ogle"),
      c("Production company", "Baker & Co"),
      c("Producer", "Jodi Feuilette"),
      c("Production coordinator", "Andrya Blagus"),
      c("Creative director", "Chloe Welgemoed"),
      c("Director", "Meghan Daniels"),
      c("DOP", "Jason Prins"),
      c("Music", "'Pull Up', Internet Girl"),
      c("Focus puller", "Rory Springthorpe"),
      c("Loader", "Miles Ritchie"),
      c("Gaffer", "Martin Fick"),
      c("DIT", "Nicky van Zyl"),
      c("Art director", "Francois Ferreira"),
      c("Art assistant", "Melinda Knoesen"),
      c("Hair stylist", "Kelvin Takudzwa"),
      c("Make-up artist", "Saskia Buxton"),
      c("HMU assistant", "Cym Clarke"),
      c("Stylist", "Kristy-Ann Welman"),
      c("Styling assistant", "Jana-Mari de Jager"),
      c("Intern styling assistant", "Claudia Da Silva"),
      c("Manicurist", "Vimbai Daisy Dengedza"),
      c("Sound recordist", "Theuns van Dyk"),
      c("Sound mixer", "Luis Trujillo Garrido, Welcome Park Studio"),
      c("Editor", "Tom Wells, Studio Four"),
      c("Colourist", "Nic Apostoli, Comfort & Fame"),
      c("Unit manager", "Dean Honey"),
      c("Talent", "Iman Fandi Ahmad, Lale Zuzanna Onuk, Sarah Malhashmi, Ayanfe Olarinde, Erin Simon, Ai-Mee Ding, Khanyi Masina, Saaimah Badroodien"),
    ],
  },
  {
    code: "C58ek8BKcua",
    aspect: 4 / 5,
    title: "Focalistic × adidas",
    type: "Music Video",
    account: "chris_coetsee",
    brand: "adidas South Africa",
    date: "2024-04-19",
    country: "South Africa",
    summary: "A brand-powered music video for Focalistic with adidas South Africa, made by Room Studios.",
    credits: [
      c("Artist", "Focalistic", "focalistic"),
      c("Brand", "adidasza", "adidasza"),
      c("Director", "mondeoneskipa, shibobocinema", "mondeoneskipa"),
      c("Agency", "Room Studios", "roomstudio_"),
      c("Creative director", "ashleyjbenn", "ashleyjbenn"),
      c("Senior strategist", "eden_myrrh", "eden_myrrh"),
      c("Concept lead", "dunetilley", "dunetilley"),
      c("Producer", "chris_coetsee", "chris_coetsee"),
      c("DP", "fabianvettigerdop", "fabianvettigerdop"),
      c("Art director", "whereareyoutalent", "whereareyoutalent"),
      c("1st AC", "baynealexander", "baynealexander"),
      c("Loaders", "jarryd_yeoman, marischltz", "jarryd_yeoman"),
      c("Gaffer", "Sabelo Nkosi"),
      c("Grip", "pjsteyl", "pjsteyl"),
      c("Drone", "bigbird_cinematography_", "bigbird_cinematography_"),
      c("Camera operator", "takeover.al", "takeover.al"),
      c("Data", "siyanda_madlingozi", "siyanda_madlingozi"),
      c("VT", "Zakhele Gumede"),
      c("Stylist", "amyzamaa", "amyzamaa"),
      c("Make-up", "lungile_ngema", "lungile_ngema"),
      c("Hair stylist", "urban_mimz", "urban_mimz"),
      c("Styling assistants", "fromwheretowear, lesedimpotsang", "fromwheretowear"),
      c("Movement", "rudi_smit", "rudi_smit"),
      c("Production manager", "arravadordali", "arravadordali"),
      c("Production coordinator", "tamaramoeng", "tamaramoeng"),
      c("Unit", "mandla6607", "mandla6607"),
      c("Edit", "postmodernstudios, lovewillmono", "postmodernstudios"),
      c("VFX", "themazecreative", "themazecreative"),
      c("Colour", "The Mill (millchannelcolour)", "millchannelcolour"),
      c("Colourist", "Eyerrekke"),
    ],
  },
  {
    code: "DN2p7_axMPX",
    aspect: 1.56,
    title: "DHL Stormers × adidas",
    type: "Commercial",
    account: "ashleyjbenn",
    brand: "adidas South Africa",
    date: "2025-08-27",
    country: "South Africa",
    summary: "A visual ode to the DHL Stormers for their return to adidas, made by the creative director as a tribute to his boyhood club.",
    credits: [
      c("Creative director", "ashleyjbenn", "ashleyjbenn"),
      c("Brand", "adidasza", "adidasza"),
      c("Club", "dhlstormers", "dhlstormers"),
      c("Agency", "Room Studios", "roomstudio_"),
      c("DP", "jaredpaisley", "jaredpaisley"),
      c("Executive producer", "chris_coetsee", "chris_coetsee"),
      c("Producer", "tman_mc", "tman_mc"),
      c("Art director", "katy_jm", "katy_jm"),
      c("Stylist", "thestylist_tamryn", "thestylist_tamryn"),
      c("Editor", "damndemarco", "damndemarco"),
      c("Colour grade", "stroobzz", "stroobzz"),
      c("Audio mix", "itskenjay__", "itskenjay__"),
    ],
  },
  {
    code: "CmdwOCmIhEU",
    aspect: 16 / 9,
    title: "adidas World Cup Series: Germany",
    type: "Commercial",
    account: "chris_coetsee",
    brand: "adidas South Africa",
    date: "2022-12-22",
    country: "South Africa",
    summary: "Germany: one film in adidas South Africa's World Cup series, made by Room Studios.",
    credits: [
      c("Brand", "adidasza", "adidasza"),
      c("Talent", "iamdamiangaza, rorisangt", "iamdamiangaza"),
      c("Agency", "Room Studios", "roomstudio_"),
      c("Creative director", "ashleyjbenn", "ashleyjbenn"),
      c("Brand strategist", "eden_myrrh", "eden_myrrh"),
      c("Director", "jarred_figgins", "jarred_figgins"),
      c("Producer", "chris_coetsee", "chris_coetsee"),
      c("Production manager", "tman_mc", "tman_mc"),
      c("DOP", "jasonprins_dop", "jasonprins_dop"),
      c("Art director", "_wendingmachine_", "_wendingmachine_"),
      c("Stylist", "petergeorgiades", "petergeorgiades"),
      c("Offline and online edit", "declan_manca, newcreationcollective", "declan_manca"),
      c("Grade", "nic_apostoli", "nic_apostoli"),
      c("Music, sound design and mix", "davidgabrielthorpe", "davidgabrielthorpe"),
    ],
  },
  {
    code: "DdWjJhssh_7",
    aspect: 4 / 3,
    title: "adidas Originals Sport DC",
    type: "Commercial",
    account: "rodeofeed_",
    brand: "adidas Originals",
    date: "2026-09-16",
    country: null,
    summary: "A film for adidas Originals' Sport DC, made with Room Studios and shot by its DOP.",
    credits: [
      c("Brand", "adidas Originals", "adidasoriginals"),
      c("Agency", "Room Studios", "roomstudio_"),
      c("Producer", "blvckxpanda", "blvckxpanda"),
      c("DOP", "rodeofeed_", "rodeofeed_"),
      c("Gaffer", "aboutmartome", "aboutmartome"),
      c("Colourist", "kitso.monare for therefinery.post", "kitso.monare"),
      c("Score and SFX", "wxter.ww", "wxter.ww"),
    ],
  },
  {
    code: "DRunHHFCGas",
    aspect: 4 / 5,
    title: "Arte for adidas Sportswear SS26",
    type: "Commercial",
    account: "arteantwerp",
    brand: "adidas Sportswear",
    date: "2025-12-01",
    country: "Belgium",
    summary: "The film for Arte Antwerp's adidas Sportswear Spring/Summer 2026 collaboration: where dreams take shape and the game reflects the moments we share.",
    credits: [
      c("Label", "Arte Antwerp", "arteantwerp"),
      c("Brand", "adidas", "adidas"),
    ],
  },
  {
    code: "DZIUH91NEYP",
    aspect: 4 / 5,
    title: "Alex “Poatan” Pereira",
    type: "Short Film",
    account: "arteantwerp",
    brand: "Arte Antwerp",
    date: "2026-06-03",
    country: "Belgium",
    summary: "Arte Antwerp's full-length film with Alex “Poatan” Pereira.",
    credits: [
      c("Label", "Arte Antwerp", "arteantwerp"),
      c("Featuring", "Alex “Poatan” Pereira", "alexpoatanpereira"),
    ],
  },
  {
    code: "Dax-XWPyLnv",
    aspect: 4 / 3,
    title: "No Scene Girls: the military playsuit",
    type: "Commercial",
    account: "noscenegirls",
    brand: "No Scene Girls",
    date: "2026-07-14",
    country: null,
    summary: "A fashion film for No Scene Girls' new ready-to-wear drop: Ashtyn and Zoe in the military playsuit.",
    credits: [
      c("Brand", "No Scene Girls", "noscenegirls"),
      c("Director", "Austin Banks", "austincbanks"),
      c("Stylist", "Sofia", "slowwmafia"),
      c("DOP", "Dennis Grishnin", "dennisgrishnin"),
      c("Set design", "Max Zandboer", "max.zandboer"),
      c("Set build", "Noah and Kai", "dirtydognoah"),
      c("Hair and make-up", "Steph George", "steph___george"),
      c("Colourist", "Clinton Homuth", "clintonhomuth"),
      c("Starring", "Ashtyn and Zoe", "ashtyn.williams"),
    ],
  },
  {
    code: "DavydV0pLDq",
    aspect: 1.37,
    title: "Streamer University 2026",
    type: "Live Event",
    account: "kaicenat",
    brand: "Kai Cenat",
    date: "2026-07-13",
    country: null,
    summary: "The announcement for Kai Cenat's Streamer University 2026, running 15 to 20 July.",
    credits: [c("Creator", "Kai Cenat", "kaicenat")],
  },
];

export const CREATORS = {
  name: "Creators",
  description: "Commercials, fashion films, music videos and shorts by independent creators and studios, with their production credits.",
};

export const creatorFilms: CreatorFilm[] = FILMS.map((f) => ({ ...f, slug: `creator-${f.code}` }));

export function findCreatorFilm(slug: string): CreatorFilm | null {
  return creatorFilms.find((f) => f.slug === slug || f.code === slug) ?? null;
}

export const creatorHref = (f: CreatorFilm, from?: "library") => `/explore/creator/${f.code}${from ? `?from=${from}` : ""}`;
export const creatorImage = (f: CreatorFilm) => `/explore/creators/${f.code}.jpg`;
export const instagramUrl = (f: CreatorFilm) => `https://www.instagram.com/reel/${f.code}/`;
export const profileUrl = (handle: string) => `https://www.instagram.com/${handle}/`;
/** Instagram's own player, loaded only when Play is pressed. */
export const instagramEmbed = (f: CreatorFilm) => `https://www.instagram.com/reel/${f.code}/embed/`;
/** A credit's name as shown: an @handle when the caption gave only the handle. */
export const creditName = (x: Credit) => (x.handle && x.name === x.handle ? `@${x.name}` : x.name);

/** Who made it, in a line: the director, else the creative director, creator or producer. */
export function leadCredit(f: CreatorFilm) {
  const find = (role: string) => f.credits.find((x) => x.role.toLowerCase() === role);
  const lead = find("director") ?? find("creative director") ?? find("creator") ?? find("producer");
  return lead ? creditName(lead) : `@${f.account}`;
}
export const creatorYear = (f: CreatorFilm) => Number(f.date.slice(0, 4));
