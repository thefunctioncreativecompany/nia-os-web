import { describe, expect, it } from "vitest";

import { authProblem, friendlyAuthError } from "./auth-errors";

describe("auth errors", () => {
  it("recognises Supabase's messages", () => {
    expect(authProblem("Email not confirmed")).toBe("unconfirmed");
    expect(authProblem("Invalid login credentials")).toBe("wrong-password");
    expect(authProblem("User already registered")).toBe("already-registered");
    expect(authProblem("Email link is invalid or has expired")).toBe("link-used");
    expect(authProblem("Token has expired or is invalid")).toBe("link-used");
    expect(authProblem("email rate limit exceeded")).toBe("rate-limited");
    expect(authProblem("For security purposes, you can only request this after 52 seconds.")).toBe("rate-limited");
    expect(authProblem("Password should be at least 6 characters.")).toBe("weak-password");
  });

  it("keeps Supabase's own password rule and unknown messages", () => {
    expect(friendlyAuthError("Password should be at least 6 characters.")).toBe("Password should be at least 6 characters.");
    expect(friendlyAuthError("Something new")).toBe("Something new");
  });
});
