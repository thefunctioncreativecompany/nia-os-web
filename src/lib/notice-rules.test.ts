import { describe, expect, it } from "vitest";

import { noteHref, noticeEvent, noticeFor } from "./notice-rules";

const row = (kind: string, title: string, project_id: string | null = "p1", event?: string) => ({ id: 1, project_id, kind, title, body: "", event });

describe("noticeFor", () => {
  it("shows shares and access requests, opening the project", () => {
    expect(noticeFor(row("shared", "Ama shared Lookbook with you"))).toEqual({ href: "/projects/p1" });
    expect(noticeFor(row("shared", "Ama asked to edit Lookbook"))).toEqual({ href: "/projects/p1" });
  });
  it("shows comments and replies, opening the project's comments", () => {
    expect(noticeFor(row("activity", "Ama commented on Lookbook"))).toEqual({ href: "/projects/p1?tab=comments" });
    expect(noticeFor(row("activity", "Ama replied to your comment on Lookbook"))).toEqual({ href: "/projects/p1?tab=comments" });
  });
  it("leaves other edits to Updates", () => {
    expect(noticeFor(row("activity", "Ama renamed Lookbook"))).toBeNull();
    expect(noticeFor(row("activity", "Ama uploaded 3 files to Lookbook", "p1", "activity"))).toBeNull();
    // Without an event (before the migration), a new document stays in Updates as it did.
    expect(noticeFor(row("activity", "Ama added Call Sheet to Lookbook"))).toBeNull();
  });
  it("goes Home when there's no project", () => {
    expect(noticeFor(row("shared", "Ama shared a project with you", null))).toEqual({ href: "/home" });
  });
});

describe("the new kinds (event)", () => {
  it("shows a new document, opening Documents", () => {
    expect(noticeFor(row("activity", "Ama added Call Sheet to Lookbook", "p1", "doc_added"))).toEqual({ href: "/projects/p1?tab=documents" });
  });
  it("shows an @mention, opening the project's comments", () => {
    expect(noticeFor(row("activity", "Ama mentioned you in Lookbook", "p1", "mention"))).toEqual({ href: "/projects/p1?tab=comments" });
  });
  it("shows being added to the cast or crew, opening Crew & talent", () => {
    expect(noticeFor(row("activity", "Ama added you to the crew of Lookbook", "p1", "crew_added"))).toEqual({ href: "/projects/p1?tab=crew" });
  });
  it("shows shoot dates, deliverables and budget changes, opening the project", () => {
    for (const event of ["shoot_dates", "deliverables", "budget"]) {
      expect(noticeFor(row("activity", "Ama changed Lookbook", "p1", event))).toEqual({ href: "/projects/p1" });
    }
  });
  it("trusts the event over the wording", () => {
    expect(noticeEvent(row("activity", "Ama commented on Lookbook", "p1", "activity"))).toBe("activity");
    expect(noteHref(row("activity", "Ama renamed Lookbook", "p1", "comment"))).toBe("/projects/p1?tab=comments");
  });
  it("tells access requests and approvals from shares", () => {
    expect(noticeEvent(row("shared", "Ama asked to open Lookbook"))).toBe("access_request");
    expect(noticeEvent(row("shared", "You can now edit Lookbook"))).toBe("access_granted");
    expect(noticeEvent(row("shared", "Ama shared Lookbook with you"))).toBe("shared");
  });
});
