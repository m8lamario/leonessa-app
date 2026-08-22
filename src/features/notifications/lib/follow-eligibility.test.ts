import { describe, expect, it } from "vitest";

import { evaluateFollowEligibility } from "./follow-eligibility";

describe("evaluateFollowEligibility", () => {
  const now = new Date("2026-05-13T18:00:00Z");

  it("allows scheduled future match", () => {
    expect(
      evaluateFollowEligibility({
        status: "SCHEDULED",
        startAt: new Date("2026-05-13T19:30:00Z"),
        now,
      }),
    ).toEqual({ allowed: true });
  });

  it("blocks live match", () => {
    expect(
      evaluateFollowEligibility({
        status: "LIVE",
        startAt: new Date("2026-05-13T19:30:00Z"),
        now,
      }).allowed,
    ).toBe(false);
  });

  it("blocks finished and cancelled", () => {
    expect(
      evaluateFollowEligibility({
        status: "FINISHED",
        startAt: new Date("2026-05-13T19:30:00Z"),
        now,
      }).reason,
    ).toBe("Partita già terminata.");
    expect(
      evaluateFollowEligibility({
        status: "CANCELLED",
        startAt: new Date("2026-05-13T19:30:00Z"),
        now,
      }).reason,
    ).toBe("Partita cancellata.");
  });

  it("blocks when kickoff already passed", () => {
    expect(
      evaluateFollowEligibility({
        status: "SCHEDULED",
        startAt: new Date("2026-05-13T17:00:00Z"),
        now,
      }).reason,
    ).toBe("Partita già iniziata.");
  });
});
