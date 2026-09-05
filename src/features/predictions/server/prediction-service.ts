import "server-only";

import { Prisma, type MatchPredictionChoice, type MatchStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  awardLPInTransaction,
  getRewardConfig,
  spendLPInTransaction,
} from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

import {
  buildPredictionIdempotencyKey,
  getCommunitySplit,
  getPredictionAccuracy,
  getPredictionRewardKeys,
  getPredictionSubmitIssue,
  getSettlementOutcome,
  isPredictionCutoffPassed,
  PREDICTION_SUBMIT_MESSAGES,
  resolvePenaltyAmount,
  type MatchStatusForPrediction,
} from "../lib/prediction-domain";

type TransactionClient = Prisma.TransactionClient;

const LEONESSA_CUP_SLUG = "leonessa-cup";

import type { DashboardPrediction } from "../types";

function toMatchStatus(status: MatchStatus): MatchStatusForPrediction {
  return status;
}

function submitMessage(issue: keyof typeof PREDICTION_SUBMIT_MESSAGES) {
  return PREDICTION_SUBMIT_MESSAGES[issue];
}

export async function getPredictionRewardAmounts() {
  const keys = getPredictionRewardKeys();
  const [correct, incorrect] = await Promise.all([
    getRewardConfig(keys.correct),
    getRewardConfig(keys.incorrect),
  ]);

  return {
    correctLp: correct.enabled ? correct.rewardLp : 0,
    incorrectLp: incorrect.enabled ? incorrect.rewardLp : 0,
    correctEnabled: correct.enabled,
    incorrectEnabled: incorrect.enabled,
  };
}

export async function getCommunityPredictionSplit(matchId: string) {
  const [home, away] = await Promise.all([
    prisma.matchPrediction.count({ where: { matchId, choice: "HOME" } }),
    prisma.matchPrediction.count({ where: { matchId, choice: "AWAY" } }),
  ]);
  return getCommunitySplit({ home, away });
}

export async function getUserPredictionStats(userId: string) {
  const [correct, wrong] = await Promise.all([
    prisma.matchPrediction.count({ where: { userId, status: "SETTLED_CORRECT" } }),
    prisma.matchPrediction.count({ where: { userId, status: "SETTLED_WRONG" } }),
  ]);
  return getPredictionAccuracy({ correct, wrong });
}

export async function submitMatchPrediction(input: {
  userId: string;
  matchId: string;
  choice: unknown;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const match = await prisma.match.findFirst({
    where: { id: input.matchId, deletedAt: null },
    select: {
      id: true,
      startAt: true,
      status: true,
    },
  });
  const existing = match
    ? await prisma.matchPrediction.findUnique({
        where: { userId_matchId: { userId: input.userId, matchId: match.id } },
        select: { id: true, status: true },
      })
    : null;

  const issue = getPredictionSubmitIssue({
    now,
    startAt: match?.startAt ?? now,
    matchStatus: match ? toMatchStatus(match.status) : null,
    currentStatus: existing?.status ?? null,
    choice: input.choice,
  });

  if (issue) {
    const status = issue === "MATCH_NOT_FOUND" ? 404 : 400;
    throw new AppError(
      issue === "MATCH_NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST",
      submitMessage(issue),
      status,
    );
  }

  const choice = input.choice as MatchPredictionChoice;

  const prediction = await prisma.matchPrediction.upsert({
    where: {
      userId_matchId: { userId: input.userId, matchId: input.matchId },
    },
    create: {
      userId: input.userId,
      matchId: input.matchId,
      choice,
      status: "OPEN",
      chosenAt: now,
    },
    update: {
      choice,
      chosenAt: now,
      status: "OPEN",
    },
    select: {
      id: true,
      matchId: true,
      choice: true,
      status: true,
      chosenAt: true,
    },
  });

  return prediction;
}

async function settleOnePrediction(
  transaction: TransactionClient,
  input: {
    prediction: {
      id: string;
      userId: string;
      choice: MatchPredictionChoice;
      status: string;
    };
    match: {
      id: string;
      status: MatchStatus;
      homeScore: number;
      awayScore: number;
    };
    rewards: Awaited<ReturnType<typeof getPredictionRewardAmounts>>;
  },
) {
  if (
    input.prediction.status === "SETTLED_CORRECT" ||
    input.prediction.status === "SETTLED_WRONG" ||
    input.prediction.status === "VOID"
  ) {
    return { applied: false };
  }

  const outcome = getSettlementOutcome({
    matchStatus: toMatchStatus(input.match.status),
    choice: input.prediction.choice,
    homeScore: input.match.homeScore,
    awayScore: input.match.awayScore,
  });

  if (outcome.status === "VOID") {
    await transaction.matchPrediction.update({
      where: { id: input.prediction.id },
      data: {
        status: "VOID",
        settledAt: new Date(),
        lockedAt: new Date(),
        resultChoice: null,
        rewardAmount: 0,
      },
    });
    return { applied: true };
  }

  let rewardAmount = 0;
  let pointTransactionId: string | null = null;

  if (outcome.status === "SETTLED_CORRECT" && input.rewards.correctEnabled && input.rewards.correctLp > 0) {
    const awarded = await awardLPInTransaction(transaction, {
      userId: input.prediction.userId,
      amount: input.rewards.correctLp,
      sourceType: "MATCH_PREDICTION",
      sourceId: input.prediction.id,
      reason: "Pronostico corretto",
      idempotencyKey: buildPredictionIdempotencyKey(input.prediction.id, "correct"),
    });
    const transactionRow =
      "existing" in awarded && awarded.existing
        ? awarded.existing
        : "pointTransaction" in awarded
          ? awarded.pointTransaction
          : null;
    if (!transactionRow) {
      throw new AppError("INTERNAL_ERROR", "Impossibile registrare la ricompensa del pronostico.", 500);
    }
    rewardAmount = transactionRow.amount;
    pointTransactionId = transactionRow.id;
  }

  if (outcome.status === "SETTLED_WRONG" && input.rewards.incorrectEnabled && input.rewards.incorrectLp > 0) {
    const balance = await transaction.userLPBalance.findUnique({
      where: { userId: input.prediction.userId },
      select: { balance: true },
    });
    const penalty = resolvePenaltyAmount({
      configuredPenalty: input.rewards.incorrectLp,
      currentBalance: balance?.balance ?? 0,
    });

    if (penalty > 0) {
      const spent = await spendLPInTransaction(transaction, {
        userId: input.prediction.userId,
        amount: penalty,
        sourceType: "MATCH_PREDICTION",
        sourceId: input.prediction.id,
        reason: "Pronostico errato",
        idempotencyKey: buildPredictionIdempotencyKey(input.prediction.id, "incorrect"),
      });
      rewardAmount = spent.pointTransaction.amount;
      pointTransactionId = spent.pointTransaction.id;
    } else {
      rewardAmount = 0;
    }
  }

  await transaction.matchPrediction.update({
    where: { id: input.prediction.id },
    data: {
      status: outcome.status,
      settledAt: new Date(),
      lockedAt: new Date(),
      resultChoice: outcome.resultChoice,
      rewardAmount,
      pointTransactionId,
    },
  });

  return { applied: true };
}

export async function settlePredictionsForMatch(matchId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, deletedAt: null },
    select: { id: true, status: true, homeScore: true, awayScore: true },
  });

  if (!match || (match.status !== "FINISHED" && match.status !== "CANCELLED")) {
    return { settled: 0 };
  }

  const rewards = await getPredictionRewardAmounts();
  const pending = await prisma.matchPrediction.findMany({
    where: { matchId, status: { in: ["OPEN", "LOCKED"] } },
    select: { id: true, userId: true, choice: true, status: true },
  });

  let settled = 0;

  for (const prediction of pending) {
    const result = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.matchPrediction.findUnique({
          where: { id: prediction.id },
          select: { id: true, userId: true, choice: true, status: true },
        });
        if (!current) return { applied: false };
        return settleOnePrediction(transaction, { prediction: current, match, rewards });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (result.applied) settled += 1;
  }

  return { settled };
}

export async function settleDuePredictions() {
  const matches = await prisma.match.findMany({
    where: {
      deletedAt: null,
      status: { in: ["FINISHED", "CANCELLED"] },
      predictions: { some: { status: { in: ["OPEN", "LOCKED"] } } },
    },
    select: { id: true },
  });

  let settled = 0;
  for (const match of matches) {
    settled += (await settlePredictionsForMatch(match.id)).settled;
  }
  return { matches: matches.length, settled };
}

export async function getFeaturedPrediction(
  userId: string,
  followingMatchIds: Set<string>,
  now = new Date(),
): Promise<DashboardPrediction | null> {
  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
    select: { id: true },
  });
  if (!competition) return null;

  const match = await prisma.match.findFirst({
    where: {
      competitionId: competition.id,
      deletedAt: null,
      status: { in: ["SCHEDULED", "LIVE"] },
    },
    select: {
      id: true,
      startAt: true,
      venue: true,
      status: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: [{ status: "desc" }, { startAt: "asc" }],
  });

  if (!match) return null;

  const [prediction, split, rewards] = await Promise.all([
    prisma.matchPrediction.findUnique({
      where: { userId_matchId: { userId, matchId: match.id } },
      select: { choice: true, status: true },
    }),
    getCommunityPredictionSplit(match.id),
    getPredictionRewardAmounts(),
  ]);

  const cutoffPassed = isPredictionCutoffPassed({
    now,
    startAt: match.startAt,
    matchStatus: toMatchStatus(match.status),
  });
  const status =
    prediction == null
      ? "NONE"
      : cutoffPassed && prediction.status === "OPEN"
        ? "LOCKED"
        : prediction.status;

  const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });

  return {
    matchId: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    schedule: dateTimeFormatter.format(match.startAt),
    venue: match.venue ?? "Sede da comunicare",
    startAt: match.startAt.toISOString(),
    matchStatus: match.status,
    following: followingMatchIds.has(match.id),
    editable: !cutoffPassed && (!prediction || prediction.status === "OPEN"),
    choice: prediction?.choice ?? null,
    status,
    correctRewardLp: rewards.correctLp,
    incorrectPenaltyLp: rewards.incorrectLp,
    split,
  };
}
