import { describe, expect, it } from "vitest";

import {
  buildLpOvertakeCopy,
  buildLpOvertakeIdempotencyKey,
  detectLpOvertake,
} from "./lp-overtake";

describe("LP overtake", () => {
  it("notifies only on a real crossing", () => {
    expect(
      detectLpOvertake({ followerLp: 2400, followingLp: 2300, wasAhead: false }),
    ).toBe("unchanged");
    expect(
      detectLpOvertake({ followerLp: 2400, followingLp: 2450, wasAhead: false }),
    ).toBe("overtake");
  });

  it("does not notify again while still ahead", () => {
    expect(
      detectLpOvertake({ followerLp: 2400, followingLp: 2500, wasAhead: true }),
    ).toBe("unchanged");
  });

  it("resets when the followed user falls back to equal or below", () => {
    expect(
      detectLpOvertake({ followerLp: 2450, followingLp: 2450, wasAhead: true }),
    ).toBe("reset");
    expect(
      detectLpOvertake({ followerLp: 2500, followingLp: 2450, wasAhead: true }),
    ).toBe("reset");
  });

  it("treats a spend that drops the viewer below a friend as an overtake", () => {
    expect(
      detectLpOvertake({ followerLp: 2300, followingLp: 2400, wasAhead: false }),
    ).toBe("overtake");
  });

  it("builds a profile-bound notification payload", () => {
    const copy = buildLpOvertakeCopy({
      overtakerName: "Marco",
      overtakerLp: 2450,
      viewerLp: 2400,
    });
    expect(copy.title).toBe("Marco ti ha superato!");
    expect(copy.body).toBe("Marco ha 2.450 LP, tu ne hai 2.400.");
    expect(
      buildLpOvertakeIdempotencyKey({
        viewerId: "viewer",
        overtakerId: "marco",
        overtakeCount: 1,
      }),
    ).toBe("lp-overtake:viewer:marco:1");
    expect(
      buildLpOvertakeIdempotencyKey({
        viewerId: "viewer",
        overtakerId: "marco",
        overtakeCount: 2,
      }),
    ).toBe("lp-overtake:viewer:marco:2");
  });
});
