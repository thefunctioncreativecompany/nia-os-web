// Reading an Instagram post for a project's references (Ika, 2026-10-22): the same steps we've
// taken by hand for Explore's creator films (src/features/explore/creators.ts), as code. A post's
// public page carries who posted it, when, and its whole caption; the caption's "Role: Name" lines
// are its production credits. Everything here is a draft the person checks before saving.
import type { Credit } from "@/features/explore/creators";

export type InstagramLink = {
  /** "reel" for reels, "p" for posts, "tv" for older IGTV videos. */
  kind: "reel" | "p" | "tv";
  code: string;
  /** The post's address, tidied: https://www.instagram.com/reel/<code>/ */
  link: string;
};

/** Reads a pasted Instagram link (with or without https://, www., the poster's name, or tracking
 * after the ?). Null when it isn't a post, reel or video. */
export function parseInstagramLink(input: string): InstagramLink | null {
  const m = input
    .trim()
    .match(/^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]{5,40})(?:[/?#]|$)/i);
  if (!m) return null;
  const kind = (m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase()) as InstagramLink["kind"];
  return { kind, code: m[2], link: `https://www.instagram.com/${kind}/${m[2]}/` };
}

export const instagramEmbedFor = (link: InstagramLink) => `https://www.instagram.com/${link.kind}/${link.code}/embed/`;

/** Turns HTML's &amp;, &#064; and &#x1f310; back into the characters they stand for. */
export function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    }
    return named[code.toLowerCase()] ?? whole;
  });
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type PostSummary = { account: string; postedOn: string | null; caption: string };

/** The page's description reads `220 likes, 4 comments - roomstudio_ on December 20, 2024:
 * "caption"` (decoded). Null when it isn't in that shape. */
export function parseDescription(description: string): PostSummary | null {
  const m = description.match(/(?:^|\s-\s)([A-Za-z0-9._]{1,30}) on ([A-Z][a-z]+) (\d{1,2}), (\d{4}): ?["“]?/);
  if (!m || m.index === undefined) return null;
  const month = MONTHS.indexOf(m[2]);
  const postedOn = month < 0 ? null : `${m[4]}-${String(month + 1).padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const caption = description
    .slice(m.index + m[0].length)
    .replace(/["”]\.?\s*$/, "")
    .trim();
  return { account: m[1], postedOn, caption };
}

const HANDLE = /@([A-Za-z0-9._]{1,30})/g;
// Lines that look like credits but aren't.
const NOT_ROLES = /^(thank you|thanks|thank u|link|shop|watch|listen|available|out now|tag|dm|email|contact|bookings?)$/i;

/** "Brand Strategist" → "Brand strategist"; short capitals (DOP, DIT, HMU, 1st AC) stay. */
function roleCase(role: string) {
  return role
    .split(/\s+/)
    .map((word, i) => {
      if (/^[A-Z0-9]{1,4}$/.test(word) && /[A-Z]/.test(word)) return word;
      const lower = word.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

function creditFrom(role: string, value: string): Credit | null {
  const r = role.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  const v = value.trim().replace(/^[:\-–—\s]+/, "");
  if (!r || !v || r.length > 40 || v.length > 200 || r.split(/\s+/).length > 5) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} &/'’.+-]*$/u.test(r) || NOT_ROLES.test(r) || /^https?$/i.test(r)) return null;
  const handles = [...v.matchAll(HANDLE)].map((h) => h[1].replace(/\.$/, ""));
  if (handles.length === 1) {
    const name = v.replace(HANDLE, "").replace(/^[\s,(]+|[\s,)]+$/g, "").replace(/\s{2,}/g, " ");
    return { role: roleCase(r), name: name || handles[0], handle: handles[0] };
  }
  return { role: roleCase(r), name: v.replace(/\s{2,}/g, " ") };
}

/** The caption's credits: lines such as "Director: Meghan Daniels", "DOP - @jasonprins" or
 * "Edit: Tom Wells | Colour: Nic Apostoli". A role on its own ("Talent:") takes the names on the
 * lines below it, up to the next blank line or credit. At most 100. */
export function parseCredits(caption: string): Credit[] {
  const credits: Credit[] = [];
  // A role waiting for its names, and the names so far.
  let open: { role: string; names: string[] } | null = null;
  const close = () => {
    const credit = open && open.names.length ? creditFrom(open.role, open.names.join(", ")) : null;
    if (credit) credits.push(credit);
    open = null;
  };
  // Instagram ends some lines with a line separator as well as a new line ("Talent:\u2028\n").
  for (const line of caption.replace(/[\u2028\u2029]\r?\n?/g, "\n").split(/\r?\n/)) {
    const parts = line.split(/\s[|•·]\s/);
    for (const part of parts) {
      const text = part.replace(/[\s\u00a0]+/g, " ").trim();
      if (!text) {
        close();
        continue;
      }
      if (text.startsWith("#")) continue;
      const colon = text.indexOf(":");
      const dash = text.search(/\s[-–—]\s/);
      const at = colon > 0 ? colon : dash;
      const role = at > 0 ? text.slice(0, at) : "";
      const value = at > 0 ? text.slice(at + 1).replace(/^[-–—]?\s*/, "") : "";
      if (role && !value && parts.length === 1 && creditFrom(role, "x")) {
        close();
        open = { role, names: [] };
        continue;
      }
      const credit = role ? creditFrom(role, value) : null;
      if (credit) {
        close();
        credits.push(credit);
      } else if (open && parts.length === 1) {
        (open as { names: string[] }).names.push(text);
      }
      if (credits.length >= 100) return credits.slice(0, 100);
    }
  }
  close();
  return credits.slice(0, 100);
}

/** A starting title and the credits. The caption's first line is the title (without hashtags or
 * emoji, up to 80 characters, cut at a word) unless it opens a run of credit lines, as in a
 * caption that is only credits; then it's "Post by @account". The title line isn't a credit. */
export function readCaption(caption: string, account: string): { title: string; credits: Credit[] } {
  const lines = caption.split(/\n/).filter((l) => l.trim());
  const fallback = account ? `Post by @${account}` : "Instagram post";
  const [first = "", second = ""] = lines;
  const clean = first
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/gu, "")
    .replace(/\s+:\s*/g, ": ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "");
  const opensCredits = parseCredits(first).length > 0 && parseCredits(second).length > 0;
  if (!clean || opensCredits) return { title: fallback, credits: parseCredits(caption) };
  const cut = clean.slice(0, 80);
  const title = clean.length <= 80 ? clean : `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).trim()}…`;
  return { title, credits: parseCredits(lines.slice(1).join("\n")) };
}

export type Bars = { aspect: number; frame: number | null };

/** The picture's shape from a cover `width` × `height` and the box left after trimming black
 * bars. Only bars of even size on both sides (top and bottom, or left and right) count, so a dark
 * edge in the picture isn't mistaken for one. Instagram's player shows posts at 4:5 at the
 * tallest, so that's the frame for a film on bars inside a vertical reel. */
export function shapeFromBars(width: number, height: number, inner: { width: number; height: number; left: number; top: number }): Bars {
  const whole = width / height;
  const bottom = height - inner.top - inner.height;
  const right = width - inner.left - inner.width;
  const even = (a: number, b: number, size: number) => Math.abs(a - b) <= size * 0.04;
  const barsY = inner.height <= height * 0.92 && inner.width >= width * 0.98 && even(inner.top, bottom, height);
  const barsX = inner.width <= width * 0.92 && inner.height >= height * 0.98 && even(inner.left, right, width);
  if (!barsY && !barsX) return { aspect: whole, frame: null };
  return { aspect: inner.width / inner.height, frame: Math.max(whole, 4 / 5) };
}
