import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const WIN_POINTS = 100;
const DRAW_POINTS = 50;

type RankingMatch = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
  };
}>;

async function updateSchoolRanking(
  transaction: Prisma.TransactionClient,
  input: {
    competitionId: string;
    schoolId: string;
    points: number;
    wins: number;
    draws: number;
    losses: number;
  },
) {
  await transaction.schoolRanking.upsert({
    where: {
      competitionId_schoolId: {
        competitionId: input.competitionId,
        schoolId: input.schoolId,
      },
    },
    create: {
      competitionId: input.competitionId,
      schoolId: input.schoolId,
      totalPoints: input.points,
      wins: input.wins,
      draws: input.draws,
      losses: input.losses,
      matchesPlayed: 1,
    },
    update: {
      totalPoints: { increment: input.points },
      wins: { increment: input.wins },
      draws: { increment: input.draws },
      losses: { increment: input.losses },
      matchesPlayed: { increment: 1 },
    },
  });
}

async function processMatch(transaction: Prisma.TransactionClient, match: RankingMatch) {
  if (match.homeTeam.schoolId === match.awayTeam.schoolId) {
    throw new Error(`Match ${match.id} has the same school on both sides.`);
  }

  const isDraw = match.homeScore === match.awayScore;
  const homeWon = match.homeScore > match.awayScore;
  const homePoints = isDraw ? DRAW_POINTS : homeWon ? WIN_POINTS : 0;
  const awayPoints = isDraw ? DRAW_POINTS : homeWon ? 0 : WIN_POINTS;

  await updateSchoolRanking(transaction, {
    competitionId: match.competitionId,
    schoolId: match.homeTeam.schoolId,
    points: homePoints,
    wins: homeWon ? 1 : 0,
    draws: isDraw ? 1 : 0,
    losses: homeWon || isDraw ? 0 : 1,
  });
  await updateSchoolRanking(transaction, {
    competitionId: match.competitionId,
    schoolId: match.awayTeam.schoolId,
    points: awayPoints,
    wins: homeWon || isDraw ? 0 : 1,
    draws: isDraw ? 1 : 0,
    losses: homeWon ? 1 : 0,
  });
}

export async function processFinishedMatches(competitionId: string) {
  const result = await prisma.$transaction(
    async (transaction) => {
      const matches = await transaction.match.findMany({
        where: {
          competitionId,
          status: "FINISHED",
          rankingProcessed: false,
          deletedAt: null,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: { startAt: "asc" },
      });

      let processed = 0;

      for (const match of matches) {
        const claimed = await transaction.match.updateMany({
          where: {
            id: match.id,
            rankingProcessed: false,
          },
          data: { rankingProcessed: true },
        });

        if (claimed.count === 0) {
          continue;
        }

        await processMatch(transaction, match);
        processed += 1;
      }

      return { processed };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  logger.info({ competitionId, processed: result.processed }, "Ranking Updated");
  return result;
}
