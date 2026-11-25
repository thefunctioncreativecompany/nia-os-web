import { describe, expect, it } from "vitest";

import { noticeFor } from "./desktop-notices";

const row = (kind: string, title: string, project_id: string | null = "p1") => ({ id: 1, project_id, kind, title, body: "" });

describe("noticeFor", () => {
  it("shows shares and access requests, opening the project", () => {
    expect(noticeFor(row("shared", "Ama shared Lookbook with you"))).toEqual({ href: "/projects/p1" });
    expect(noticeFor(row("shared", "Ama asked to edit Lookbook"))).toEqual({ href: "/projects/p1" });
  });
  it("shows comments and replies, opening the project's comments", () => {
    expect(noticeFor(row("activity", "Ama commented on Lookbook"))).toEqual({ href: "/projects/p1?tab=comments" });
    expect(noticeFor(row("activity", "Ama replied to your comment on Lookbook"))).toEqual({ href: "/projects/p1?tab=comments" });
  });
  it("leaves collaborators' edits to Updates", () => {
    expect(noticeFor(row("activity", "Ama added a document to Lookbook"))).toBeNull();
    expect(noticeFor(row("activity", "Ama renamed Lookbook"))).toBeNull();
  });
  it("goes Home when there's no project", () => {
    expect(noticeFor(row("shared", "Ama shared a project with you", null))).toEqual({ href: "/home" });
  });
});
