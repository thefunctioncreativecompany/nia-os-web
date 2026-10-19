import { describe, expect, it } from "vitest";
import { inviteEmail } from "./invite-email";

const base = { actor: "Ika", projectTitle: "Lookbook", role: "viewer" as const, email: "sam@example.com", link: "https://nia.test/projects/1" };

describe("inviteEmail", () => {
  it("opens the project for people with an account", () => {
    const { subject, html, text } = inviteEmail({ ...base, hasAccount: true });
    expect(subject).toBe("Ika shared Lookbook with you");
    expect(html).toContain("You can view it on Nia.");
    expect(html).toContain(">Open project</a>");
    expect(text).toContain("Open project: https://nia.test/projects/1");
  });

  it("asks people without an account to sign up with the invited address", () => {
    const { html } = inviteEmail({ ...base, role: "editor", hasAccount: false, link: "https://nia.test/sign-up" });
    expect(html).toContain("You can edit it on Nia. Sign up with sam@example.com and it will be waiting for you.");
    expect(html).toContain(">Join Nia</a>");
  });

  it("escapes names and titles and keeps the subject on one line", () => {
    const { subject, html } = inviteEmail({ ...base, actor: "<b>Ika</b>", projectTitle: "Look\nbook & co", hasAccount: true });
    expect(subject).toBe("<b>Ika</b> shared Look book & co with you");
    expect(html).toContain("&lt;b&gt;Ika&lt;/b&gt; shared Look book &amp; co with you");
    expect(html).not.toContain("<b>Ika</b>");
  });

  it("falls back when the name or title is empty", () => {
    expect(inviteEmail({ ...base, actor: " ", projectTitle: "", hasAccount: true }).subject).toBe("Someone shared Untitled project with you");
  });
});
