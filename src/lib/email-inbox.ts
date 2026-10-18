import "server-only";
import { resolveMx } from "node:dns/promises";
import { cacheLife } from "next/cache";

type InboxUrl = (email: string) => string;

const gmail: InboxUrl = (email) =>
  `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email)}`;
const outlookPersonal: InboxUrl = () => "https://outlook.live.com/mail/";
const outlookWork: InboxUrl = () => "https://outlook.office.com/mail/";
const yahoo: InboxUrl = () => "https://mail.yahoo.com/";
const icloud: InboxUrl = () => "https://www.icloud.com/mail";
const proton: InboxUrl = () => "https://mail.proton.me/";
const fastmail: InboxUrl = () => "https://app.fastmail.com/mail/";
const zoho: InboxUrl = () => "https://mail.zoho.com/";
const aol: InboxUrl = () => "https://mail.aol.com/";

// Well-known personal email domains.
const byDomain: Record<string, InboxUrl> = {
  "gmail.com": gmail,
  "googlemail.com": gmail,
  "outlook.com": outlookPersonal,
  "hotmail.com": outlookPersonal,
  "live.com": outlookPersonal,
  "msn.com": outlookPersonal,
  "yahoo.com": yahoo,
  "ymail.com": yahoo,
  "icloud.com": icloud,
  "me.com": icloud,
  "mac.com": icloud,
  "proton.me": proton,
  "protonmail.com": proton,
  "fastmail.com": fastmail,
  "aol.com": aol,
};

// Company and school domains: work out the provider from where their mail is delivered.
const byMailServer: [RegExp, InboxUrl][] = [
  [/(^|\.)google(mail)?\.com$/, gmail],
  [/\.outlook\.com$/, outlookWork],
  [/\.yahoodns\.net$/, yahoo],
  [/(^|\.)icloud\.com$/, icloud],
  [/\.protonmail\.ch$/, proton],
  [/\.messagingengine\.com$/, fastmail],
  [/\.zoho\.(com|eu)$/, zoho],
];

// Mail servers for a domain, lowest priority number (most preferred) first.
// Cached because a domain's mail setup rarely changes.
async function getMailServers(domain: string): Promise<string[]> {
  "use cache";
  cacheLife("days");
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("MX lookup timed out")), 2000),
    );
    const records = await Promise.race([resolveMx(domain), timeout]);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((record) => record.exchange.toLowerCase());
  } catch {
    return [];
  }
}

// The web inbox for an email address, or null when the provider is unknown.
export async function getInboxUrl(email: string): Promise<string | null> {
  const domain = email.split("@").pop()?.trim().toLowerCase();
  if (!domain) return null;

  const known = byDomain[domain];
  if (known) return known(email);

  for (const server of await getMailServers(domain)) {
    const match = byMailServer.find(([pattern]) => pattern.test(server));
    if (match) return match[1](email);
  }
  return null;
}
