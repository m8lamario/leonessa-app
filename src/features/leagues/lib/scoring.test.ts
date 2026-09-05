import { describe, expect, it } from "vitest";

import {
  getScoringWindow,
  rankMembers,
  scoreMembersByRule,
  sumLeagueScore,
} from "./scoring";

const startAt = new Date("2026-09-01T00:00:00.000Z");
const endAt = new Date("2026-09-30T23:59:59.000Z");

describe("league scoring window", () => {
  it("starts at join time when the user joins after the league start", () => {
    const joinedAt = new Date("2026-09-10T12:00:00.000Z");
    expect(getScoringWindow({ startAt, endAt, joinedAt })).toEqual({
      from: joinedAt,
      to: endAt,
    });
  });

  it("starts at league start when the user joined earlier", () => {
    const joinedAt = new Date("2026-08-20T12:00:00.000Z");
    expect(getScoringWindow({ startAt, endAt, joinedAt })).toEqual({
      from: startAt,
      to: endAt,
    });
  });
});

describe("LP_EARNED_DURING_LEAGUE", () => {
  it("sums only positive LP earned after join inside the league dates", () => {
    const joinedAt = new Date("2026-09-10T00:00:00.000Z");
    const window = getScoringWindow({ startAt, endAt, joinedAt });
    const score = sumLeagueScore(
      [
        { userId: "u1", type: "LP", amount: 80, createdAt: new Date("2026-09-05T00:00:00.000Z") },
        { userId: "u1", type: "LP", amount: 50, createdAt: new Date("2026-09-12T00:00:00.000Z") },
        { userId: "u1", type: "LP", amount: 20, createdAt: new Date("2026-09-15T00:00:00.000Z") },
        { userId: "u1", type: "LP", amount: -30, createdAt: new Date("2026-09-16T00:00:00.000Z") },
        { userId: "u1", type: "SSP", amount: 40, createdAt: new Date("2026-09-16T00:00:00.000Z") },
        { userId: "u1", type: "LP", amount: 10, createdAt: new Date("2026-10-02T00:00:00.000Z") },
      ],
      window,
    );

    expect(score).toBe(70);
  });

  it("ranks by score then earlier join", () => {
    const ranked = rankMembers(
      scoreMembersByRule(
        "LP_EARNED_DURING_LEAGUE",
        [
          { userId: "late", joinedAt: new Date("2026-09-12T00:00:00.000Z") },
          { userId: "early", joinedAt: new Date("2026-09-10T00:00:00.000Z") },
          { userId: "leader", joinedAt: new Date("2026-09-11T00:00:00.000Z") },
        ],
        { startAt, endAt },
        [
          { userId: "late", type: "LP", amount: 40, createdAt: new Date("2026-09-15T00:00:00.000Z") },
          { userId: "early", type: "LP", amount: 40, createdAt: new Date("2026-09-15T00:00:00.000Z") },
          { userId: "leader", type: "LP", amount: 90, createdAt: new Date("2026-09-15T00:00:00.000Z") },
        ],
      ),
    );

    expect(ranked.map((entry) => entry.userId)).toEqual(["leader", "early", "late"]);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });
});
