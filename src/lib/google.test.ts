import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { consentUrl, seal, unseal, withParam } = await import("./google");

describe("Google Calendar connection", () => {
  it("keeps the refresh key sealed: only Nia's key opens it, and any change is caught", () => {
    const key = randomBytes(32);
    const sealed = seal("1//refresh-token", key);
    expect(sealed).not.toContain("refresh-token");
    expect(unseal(sealed, key)).toBe("1//refresh-token");
    // Sealing twice gives different text (a fresh starting value each time).
    expect(seal("1//refresh-token", key)).not.toBe(sealed);
    expect(() => unseal(sealed, randomBytes(32))).toThrow();
    const [iv, tag, body] = sealed.split(".");
    const flipped = Buffer.from(body, "base64");
    flipped[0] ^= 1;
    expect(() => unseal([iv, tag, flipped.toString("base64")].join("."), key)).toThrow();
  });

  it("asks Google for calendar events and free/busy only, and a key that lasts", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const url = new URL(consentUrl("https://app.niatechnologies.co", "state-123"));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.niatechnologies.co/api/google/callback");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")?.split(" ")).toEqual([
      "openid",
      "email",
      "https://www.googleapis.com/auth/calendar.events.owned",
      "https://www.googleapis.com/auth/calendar.freebusy",
    ]);
  });

  it("returns people to where they were, with what happened", () => {
    expect(withParam("/projects/abc?meeting=1", "google", "connected")).toBe("/projects/abc?meeting=1&google=connected");
    expect(withParam("/projects/abc?schedule=1", "google", "denied")).toBe("/projects/abc?schedule=1&google=denied");
  });
});
