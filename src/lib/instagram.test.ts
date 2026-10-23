import { describe, expect, it } from "vitest";

import { decodeEntities, parseCredits, parseDescription, parseInstagramLink, readCaption, shapeFromBars } from "./instagram";

// The description tag of https://www.instagram.com/reel/DDzBw_xKbKm/ (2026-10-22), as Instagram
// sends it.
const ADIDAS = `220 likes, 4 comments - roomstudio_ on December 20, 2024: &quot;Director&#x2019;s Cut : &#064;adidasoriginals LO PRO

Special to be able to work with the &#064;adidasoriginals EM Team &#x1f310;

Thank you : &#064;ashmccaughey and &#064;yourgirl_nandi

Client: &#064;adidasoriginals
Agency: Room Studios
Brand Strategist : Eden Toohey Ogle
Production company: Baker &amp; Co
Producer: Jodi Feuilette
Production coordinator: Andrya Blagus
Creative Director: Chloe Welgemoed
Director: Meghan Daniels
DOP: Jason Prins
Music: &#x2018;Pull Up&#x2019; - Internet Girl
Focus Puller: Rory Springthorpe
Loader: Miles Ritchie
Gaffer: Martin Fick
DIT: Nicky van Zyl
Art Director: Francois Ferreira
Art Assistant: Melinda Knoesen
Hair stylist: Kelvin Takudzwa
Make-up Artist: Saskia Buxton
HMU Assistant: Cym Clarke
Stylist: Kristy-Ann Welman
Styling Assistant: Jana-Mari de Jager
Intern Styling Assistant: Claudia Da Silva
Manicurist: Vimbai Daisy Dengedza
Sound recordist: Theuns van Dyk
Sound mixer: Luis Trujillo Garrido / Welcome Park Studio&#xa0;
Editor: Tom Wells / Studio Four&#xa0;
Colourist: Nic Apostoli / Comfort &amp; Fame
Unit Manager: Dean Honey

Talent:&#x2028;
Iman Fandi Ahmad
Lale Zuzanna Onuk
Sarah Malhashmi
Ayanfe Olarinde
Erin Simon
Ai-Mee Ding
Khanyi Masina
Saaimah Badroodien&quot;.`;

describe("parseInstagramLink", () => {
  it("reads reels, posts and videos however they're pasted", () => {
    expect(parseInstagramLink("https://www.instagram.com/reel/DDzBw_xKbKm/?igsh=abc123")).toEqual({
      kind: "reel",
      code: "DDzBw_xKbKm",
      link: "https://www.instagram.com/reel/DDzBw_xKbKm/",
    });
    expect(parseInstagramLink("instagram.com/p/CsA9u01Kwxn")?.link).toBe("https://www.instagram.com/p/CsA9u01Kwxn/");
    expect(parseInstagramLink("  https://instagram.com/reels/DcL-MPasEcz/ ")?.kind).toBe("reel");
    expect(parseInstagramLink("https://www.instagram.com/roomstudio_/reel/DDzBw_xKbKm/")?.code).toBe("DDzBw_xKbKm");
    expect(parseInstagramLink("https://m.instagram.com/tv/B1234567890/")?.kind).toBe("tv");
  });

  it("turns down anything else", () => {
    expect(parseInstagramLink("https://www.instagram.com/roomstudio_/")).toBeNull();
    expect(parseInstagramLink("https://www.tiktok.com/@a/video/123")).toBeNull();
    expect(parseInstagramLink("https://evil.example/instagram.com/reel/DDzBw_xKbKm/")).toBeNull();
    expect(parseInstagramLink("")).toBeNull();
  });
});

describe("parseDescription", () => {
  it("finds who posted it, when, and the whole caption", () => {
    const post = parseDescription(decodeEntities(ADIDAS))!;
    expect(post.account).toBe("roomstudio_");
    expect(post.postedOn).toBe("2024-12-20");
    expect(post.caption.startsWith("Director’s Cut : @adidasoriginals LO PRO")).toBe(true);
    expect(post.caption.endsWith("Saaimah Badroodien")).toBe(true);
  });

  it("works without likes, and says so when the shape is unknown", () => {
    expect(parseDescription('studio.x on March 3, 2025: "Hello"')).toEqual({ account: "studio.x", postedOn: "2025-03-03", caption: "Hello" });
    expect(parseDescription("See Instagram photos and videos from Room Studio")).toBeNull();
  });
});

describe("readCaption", () => {
  const caption = parseDescription(decodeEntities(ADIDAS))!.caption;
  const { title, credits } = readCaption(caption, "roomstudio_");

  it("takes the first line as the title", () => {
    expect(title).toBe("Director’s Cut: @adidasoriginals LO PRO");
  });

  it("finds the same 29 credits we took by hand for Explore", () => {
    expect(credits).toHaveLength(29);
    expect(credits[0]).toEqual({ role: "Client", name: "adidasoriginals", handle: "adidasoriginals" });
    expect(credits).toContainEqual({ role: "Brand strategist", name: "Eden Toohey Ogle" });
    expect(credits).toContainEqual({ role: "Production company", name: "Baker & Co" });
    expect(credits).toContainEqual({ role: "DOP", name: "Jason Prins" });
    expect(credits).toContainEqual({ role: "HMU assistant", name: "Cym Clarke" });
    expect(credits).toContainEqual({ role: "Music", name: "‘Pull Up’ - Internet Girl" });
    expect(credits).toContainEqual({ role: "Editor", name: "Tom Wells / Studio Four" });
    expect(credits.at(-1)?.role).toBe("Talent");
    expect(credits.at(-1)?.name.split(", ")).toHaveLength(8);
    expect(credits.some((c) => c.role === "Thank you")).toBe(false);
  });

  it("names the post after its account when the caption is only credits", () => {
    expect(readCaption("Director: A\nDOP: @b", "studio").title).toBe("Post by @studio");
    expect(readCaption("Director: A\nDOP: @b", "studio").credits).toEqual([
      { role: "Director", name: "A" },
      { role: "DOP", name: "b", handle: "b" },
    ]);
    expect(readCaption("", "studio").title).toBe("Post by @studio");
  });

  it("reads dashes and bars between credits", () => {
    expect(parseCredits("Director - Ama Mensah | Colour - @grade.house")).toEqual([
      { role: "Director", name: "Ama Mensah" },
      { role: "Colour", name: "grade.house", handle: "grade.house" },
    ]);
  });

  it("keeps long first lines short", () => {
    const long = "A film about the long walk home through the city at night, made with friends over three weekends in June";
    expect(readCaption(long, "x").title.length).toBeLessThanOrEqual(81);
    expect(readCaption(long, "x").title.endsWith("…")).toBe(true);
  });
});

describe("shapeFromBars", () => {
  it("finds a landscape film on black bars inside a vertical reel", () => {
    // The adidas reel's cover: 1080 × 1920, picture 1080 × 696 starting 612 down.
    const shape = shapeFromBars(1080, 1920, { width: 1080, height: 696, left: 0, top: 612 });
    expect(shape.aspect).toBeCloseTo(1.552, 2);
    expect(shape.frame).toBe(4 / 5);
  });

  it("leaves pictures without even bars as they are", () => {
    expect(shapeFromBars(1080, 1920, { width: 1080, height: 1920, left: 0, top: 0 })).toEqual({ aspect: 1080 / 1920, frame: null });
    // A dark sky at the top only.
    expect(shapeFromBars(1080, 1350, { width: 1080, height: 1000, left: 0, top: 350 }).frame).toBeNull();
  });
});
