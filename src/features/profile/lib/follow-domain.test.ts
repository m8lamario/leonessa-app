import { describe, expect, it } from "vitest";

import { assertCanFollowUser, nextFollowCounts } from "./follow-domain";

describe("follow domain", () => {
  it("blocks self-follow", () => {
    expect(assertCanFollowUser("user-1", "user-1")).toMatchObject({ ok: false, code: "SELF" });
    expect(assertCanFollowUser("", "user-2")).toMatchObject({ ok: false, code: "INVALID" });
  });

  it("allows following another user", () => {
    expect(assertCanFollowUser("user-1", "user-2")).toEqual({ ok: true });
  });

  it("updates follower counts without duplicating", () => {
    expect(nextFollowCounts({ followerCount: 4, following: false, nextFollowing: true })).toBe(5);
    expect(nextFollowCounts({ followerCount: 4, following: true, nextFollowing: false })).toBe(3);
    expect(nextFollowCounts({ followerCount: 4, following: true, nextFollowing: true })).toBe(4);
    expect(nextFollowCounts({ followerCount: 0, following: true, nextFollowing: false })).toBe(0);
  });
});
