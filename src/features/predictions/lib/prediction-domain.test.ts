import { describe, expect, it } from "vitest";

import {
  buildPredictionIdempotencyKey,
  getCommunitySplit,
  getMatchWinner,
  getPredictionAccuracy,
  getPredictionSubmitIssue,
  getSettlementOutcome,
  isPredictionChoice,
  isPredictionCutoffPassed,
  resolvePenaltyAmount,
} from "./prediction-domain";

const kickoff = new Date("2026-05-13T18:00:00.000Z");

describe("prediction domain", () => {
  it("accepts only HOME or AWAY choices", () => {
    expect(isPredictionChoice("HOME")).toBe(true);
    expect(isPredictionChoice("AWAY")).toBe(true);
    expect(isPredictionChoice("DRAW")).toBe(false);
    expect(isPredictionChoice(null)).toBe(false);
  });

  it("derives the winner from real scores", () => {
    expect(getMatchWinner(2, 1)).toBe("HOME");
    expect(getMatchWinner(0, 3)).toBe("AWAY");
    expect(getMatchWinner(1, 1)).toBe("DRAW");
  });

  it("freezes predictions at kickoff or when the match is no longer scheduled", () => {
    expect(
      isPredictionCutoffPassed({
        now: new Date("2026-05-13T17:59:59.000Z"),
        startAt: kickoff,
        matchStatus: "SCHEDULED",
      }),
    ).toBe(false);
    expect(
      isPredictionCutoffPassed({
        now: kickoff,
        startAt: kickoff,
        matchStatus: "SCHEDULED",
      }),
    ).toBe(true);
    expect(
      isPredictionCutoffPassed({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "LIVE",
      }),
    ).toBe(true);
  });

  it("allows create and update before cutoff", () => {
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "SCHEDULED",
        currentStatus: null,
        choice: "HOME",
      }),
    ).toBeNull();
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "SCHEDULED",
        currentStatus: "OPEN",
        choice: "AWAY",
      }),
    ).toBeNull();
  });

  it("blocks after cutoff, cancelled matches, settled predictions and invalid choices", () => {
    expect(
      getPredictionSubmitIssue({
        now: kickoff,
        startAt: kickoff,
        matchStatus: "SCHEDULED",
        currentStatus: "OPEN",
        choice: "HOME",
      }),
    ).toBe("CUTOFF_PASSED");
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "CANCELLED",
        currentStatus: null,
        choice: "HOME",
      }),
    ).toBe("MATCH_NOT_PREDICTABLE");
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "SCHEDULED",
        currentStatus: "SETTLED_CORRECT",
        choice: "HOME",
      }),
    ).toBe("ALREADY_SETTLED");
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: "SCHEDULED",
        currentStatus: null,
        choice: "DRAW",
      }),
    ).toBe("INVALID_CHOICE");
    expect(
      getPredictionSubmitIssue({
        now: new Date("2026-05-13T17:00:00.000Z"),
        startAt: kickoff,
        matchStatus: null,
        currentStatus: null,
        choice: "HOME",
      }),
    ).toBe("MATCH_NOT_FOUND");
  });

  it("settles a correct prediction with +LP outcome", () => {
    expect(
      getSettlementOutcome({
        matchStatus: "FINISHED",
        choice: "HOME",
        homeScore: 2,
        awayScore: 0,
      }),
    ).toEqual({ status: "SETTLED_CORRECT", resultChoice: "HOME" });
  });

  it("settles a wrong prediction, including draws", () => {
    expect(
      getSettlementOutcome({
        matchStatus: "FINISHED",
        choice: "AWAY",
        homeScore: 2,
        awayScore: 0,
      }),
    ).toEqual({ status: "SETTLED_WRONG", resultChoice: "HOME" });
    expect(
      getSettlementOutcome({
        matchStatus: "FINISHED",
        choice: "HOME",
        homeScore: 1,
        awayScore: 1,
      }),
    ).toEqual({ status: "SETTLED_WRONG", resultChoice: null });
  });

  it("voids cancelled matches without a winner", () => {
    expect(
      getSettlementOutcome({
        matchStatus: "CANCELLED",
        choice: "HOME",
        homeScore: 0,
        awayScore: 0,
      }),
    ).toEqual({ status: "VOID", resultChoice: null });
  });

  it("refuses to settle unfinished matches", () => {
    expect(() =>
      getSettlementOutcome({
        matchStatus: "LIVE",
        choice: "HOME",
        homeScore: 1,
        awayScore: 0,
      }),
    ).toThrow();
  });

  it("builds stable idempotency keys per prediction outcome", () => {
    expect(buildPredictionIdempotencyKey("pred-1", "correct")).toBe("prediction:pred-1:correct");
    expect(buildPredictionIdempotencyKey("pred-1", "incorrect")).toBe("prediction:pred-1:incorrect");
  });

  it("never deducts more LP than the current balance", () => {
    expect(resolvePenaltyAmount({ configuredPenalty: 5, currentBalance: 12 })).toBe(5);
    expect(resolvePenaltyAmount({ configuredPenalty: 5, currentBalance: 3 })).toBe(3);
    expect(resolvePenaltyAmount({ configuredPenalty: 5, currentBalance: 0 })).toBe(0);
  });

  it("computes accuracy only from settled predictions", () => {
    expect(getPredictionAccuracy({ correct: 0, wrong: 0 })).toEqual({
      settled: 0,
      correct: 0,
      percent: null,
    });
    expect(getPredictionAccuracy({ correct: 2, wrong: 1 })).toEqual({
      settled: 3,
      correct: 2,
      percent: 67,
    });
  });

  it("returns community split only from real counts", () => {
    expect(getCommunitySplit({ home: 0, away: 0 })).toBeNull();
    expect(getCommunitySplit({ home: 63, away: 37 })).toEqual({
      total: 100,
      homePercent: 63,
      awayPercent: 37,
    });
  });
});
