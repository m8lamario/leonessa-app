export const PREDICTION_CORRECT_KEY = "prediction.correct";
export const PREDICTION_INCORRECT_KEY = "prediction.incorrect";

export type MatchPredictionChoice = "HOME" | "AWAY";
export type MatchPredictionStatus =
  | "OPEN"
  | "LOCKED"
  | "SETTLED_CORRECT"
  | "SETTLED_WRONG"
  | "VOID";
export type MatchStatusForPrediction = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
export type MatchWinner = MatchPredictionChoice | "DRAW";

export type PredictionSubmitIssue =
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_PREDICTABLE"
  | "CUTOFF_PASSED"
  | "ALREADY_SETTLED"
  | "INVALID_CHOICE";

export function isPredictionChoice(value: unknown): value is MatchPredictionChoice {
  return value === "HOME" || value === "AWAY";
}

export function getMatchWinner(
  homeScore: number,
  awayScore: number,
): MatchWinner {
  if (homeScore === awayScore) return "DRAW";
  return homeScore > awayScore ? "HOME" : "AWAY";
}

export function isPredictionCutoffPassed(input: {
  now: Date;
  startAt: Date;
  matchStatus: MatchStatusForPrediction;
}) {
  if (input.matchStatus !== "SCHEDULED") return true;
  return input.now.getTime() >= input.startAt.getTime();
}

export function getPredictionSubmitIssue(input: {
  now: Date;
  startAt: Date;
  matchStatus: MatchStatusForPrediction | null;
  currentStatus: MatchPredictionStatus | null;
  choice: unknown;
}): PredictionSubmitIssue | null {
  if (!isPredictionChoice(input.choice)) {
    return "INVALID_CHOICE";
  }

  if (!input.matchStatus) {
    return "MATCH_NOT_FOUND";
  }

  if (input.matchStatus === "CANCELLED") {
    return "MATCH_NOT_PREDICTABLE";
  }

  if (
    input.currentStatus === "SETTLED_CORRECT" ||
    input.currentStatus === "SETTLED_WRONG" ||
    input.currentStatus === "VOID"
  ) {
    return "ALREADY_SETTLED";
  }

  if (
    isPredictionCutoffPassed({
      now: input.now,
      startAt: input.startAt,
      matchStatus: input.matchStatus,
    })
  ) {
    return "CUTOFF_PASSED";
  }

  return null;
}

export function getSettlementOutcome(input: {
  matchStatus: MatchStatusForPrediction;
  choice: MatchPredictionChoice;
  homeScore: number;
  awayScore: number;
}): {
  status: Extract<MatchPredictionStatus, "SETTLED_CORRECT" | "SETTLED_WRONG" | "VOID">;
  resultChoice: MatchPredictionChoice | null;
} {
  if (input.matchStatus === "CANCELLED") {
    return { status: "VOID", resultChoice: null };
  }

  if (input.matchStatus !== "FINISHED") {
    throw new Error("Il pronostico può essere liquidato solo a match concluso o annullato.");
  }

  const winner = getMatchWinner(input.homeScore, input.awayScore);
  if (winner === "DRAW") {
    return { status: "SETTLED_WRONG", resultChoice: null };
  }

  return {
    status: input.choice === winner ? "SETTLED_CORRECT" : "SETTLED_WRONG",
    resultChoice: winner,
  };
}

export function getPredictionRewardKeys() {
  return {
    correct: PREDICTION_CORRECT_KEY,
    incorrect: PREDICTION_INCORRECT_KEY,
  };
}

export function buildPredictionIdempotencyKey(
  predictionId: string,
  outcome: "correct" | "incorrect",
) {
  return `prediction:${predictionId}:${outcome}`;
}

export function resolvePenaltyAmount(input: {
  configuredPenalty: number;
  currentBalance: number;
}) {
  if (input.configuredPenalty <= 0 || input.currentBalance <= 0) {
    return 0;
  }

  return Math.min(input.configuredPenalty, input.currentBalance);
}

export function getPredictionAccuracy(input: {
  correct: number;
  wrong: number;
}) {
  const settled = input.correct + input.wrong;
  if (settled <= 0) {
    return { settled: 0, correct: input.correct, percent: null as number | null };
  }

  return {
    settled,
    correct: input.correct,
    percent: Math.round((input.correct / settled) * 100),
  };
}

export function getCommunitySplit(counts: { home: number; away: number }) {
  const total = counts.home + counts.away;
  if (total <= 0) {
    return null;
  }

  return {
    total,
    homePercent: Math.round((counts.home / total) * 100),
    awayPercent: Math.round((counts.away / total) * 100),
  };
}

export const PREDICTION_SUBMIT_MESSAGES: Record<PredictionSubmitIssue, string> = {
  MATCH_NOT_FOUND: "Partita non trovata.",
  MATCH_NOT_PREDICTABLE: "Questa partita non ammette pronostici.",
  CUTOFF_PASSED: "Il pronostico è chiuso: il fischio d'inizio è già passato.",
  ALREADY_SETTLED: "Questo pronostico è già stato liquidato.",
  INVALID_CHOICE: "Scegli una delle due squadre.",
};
