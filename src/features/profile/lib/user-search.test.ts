import { describe, expect, it } from "vitest";

import {
  getUserSearchIssue,
  getUserSearchTokens,
  normalizeUserSearchQuery,
} from "./user-search";

describe("user search query", () => {
  it("normalizes whitespace", () => {
    expect(normalizeUserSearchQuery("  mario   rossi ")).toBe("mario rossi");
  });

  it("rejects empty, short and oversized queries", () => {
    expect(getUserSearchIssue(" ")).toBe("EMPTY");
    expect(getUserSearchIssue("m")).toBe("TOO_SHORT");
    expect(getUserSearchIssue("ab")).toBeNull();
    expect(getUserSearchIssue("x".repeat(65))).toBe("TOO_LONG");
  });

  it("splits full names into tokens", () => {
    expect(getUserSearchTokens("Mario Rossi")).toEqual(["Mario", "Rossi"]);
  });
});
