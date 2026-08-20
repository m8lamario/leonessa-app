import "server-only";

import { Prisma } from "@prisma/client";

import { syncLeonessaCup } from "@/features/cup/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const SCORING = {
  goal: 100,
  assist: 50,
  win: 20,
  draw: 5,
  cleanSheet: 30,
  yellowCard: -20,
  redCard: -50,
  ownGoal: -70,
} as const;

type ScorablePlayer = {
  id: string;
  teamId: string;
  fantasyRole: string;
};

type ScoringMatch = Prisma.MatchGetPayload<{
  include: { events: true };
}>;

function getMatchdayRound(startAt: Date) {
  return Number(
    `${startAt.getUTCFullYear()}${String(startAt.getUTCMonth() + 1).padStart(2, "0")}${String(
      startAt.getUTCDate(),
    ).padStart(2, "0")}`,
  );
}

function getEventPoints(events: ScoringMatch["events"], playerId: string) {
  return events.reduce((points, event) => {
    if (event.playerId !== playerId) return points;

    switch (event.type) {
      case "GOAL":
        return points + SCORING.goal;
      case "ASSIST":
        return points + SCORING.assist;
      case "YELLOW_CARD":
        return points + SCORING.yellowCard;
      case "RED_CARD":
        return points + SCORING.redCard;
      case "OWN_GOAL":
        return points + SCORING.ownGoal;
      default:
        return points;
    }
  }, 0);
}

function getPlayerPoints(match: ScoringMatch, player: ScorablePlayer) {
  const isHome = player.teamId === match.homeTeamId;
  const ownScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;
  let points = getEventPoints(match.events, player.id);

  if (ownScore > opponentScore) points += SCORING.win;
  if (ownScore === opponentScore) points += SCORING.draw;
  if (
    opponentScore === 0 &&
    (player.fantasyRole === "PORTIERE" || player.fantasyRole === "DIFENSORE")
  ) {
    points += SCORING.cleanSheet;
  }

  return points;
}

function getStatDelta(events: ScoringMatch["events"], playerId: string) {
  return events.reduce(
    (delta, event) => {
      if (event.playerId !== playerId) return delta;

      switch (event.type) {
        case "GOAL":
          delta.goals += 1;
          break;
        case "ASSIST":
          delta.assists += 1;
          break;
        case "YELLOW_CARD":
          delta.yellowCards += 1;
          break;
        case "RED_CARD":
          delta.redCards += 1;
          break;
      }

      return delta;
    },
    { goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
  );
}

async function processMatch(transaction: Prisma.TransactionClient, match: ScoringMatch) {
  const claim = await transaction.fantasyProcessedMatch.create({ data: { matchId: match.id } });
  const round = getMatchdayRound(match.startAt);
  const matchday = await transaction.fantasyMatchday.upsert({
    where: { round },
    create: { round, startedAt: match.startAt, completedAt: match.startAt },
    update: {
      startedAt: { set: match.startAt },
      completedAt: { set: match.startAt },
    },
  });
  const teamIds = [match.homeTeamId, match.awayTeamId];
  const players = await transaction.teamMember.findMany({
    where: { teamId: { in: teamIds }, role: "PLAYER", leftAt: null },
    select: { id: true, teamId: true, fantasyRole: true, fantasyValue: true },
  });
  const playerIds = new Set(players.map((player) => player.id));
  const fantasyTeams = await transaction.fantasyTeam.findMany({
    include: {
      players: {
        where: { playerId: { in: [...playerIds] } },
        select: { playerId: true, role: true, isCaptain: true },
      },
    },
  });

  let pointsAssigned = 0;
  for (const fantasyTeam of fantasyTeams) {
    const points = fantasyTeam.players.reduce((total, selection) => {
      const player = players.find((item) => item.id === selection.playerId);
      if (!player) return total;

      const playerPoints = getPlayerPoints(match, { ...player, fantasyRole: selection.role });
      return total + (selection.isCaptain ? Math.round(playerPoints * 1.5) : playerPoints);
    }, 0);

    await transaction.fantasyScore.upsert({
      where: {
        fantasyTeamId_matchdayId: { fantasyTeamId: fantasyTeam.id, matchdayId: matchday.id },
      },
      create: { fantasyTeamId: fantasyTeam.id, matchdayId: matchday.id, points },
      update: { points: { increment: points } },
    });
    if (points !== 0) {
      await transaction.fantasyTeam.update({
        where: { id: fantasyTeam.id },
        data: { totalPoints: { increment: points } },
      });
    }
    pointsAssigned += points;
  }

  for (const player of players) {
    const delta = getStatDelta(match.events, player.id);
    const points = getPlayerPoints(match, player);
    await transaction.fantasyPlayerStat.upsert({
      where: { playerId: player.id },
      create: {
        playerId: player.id,
        matches: 1,
        totalPoints: points,
        ...delta,
      },
      update: {
        matches: { increment: 1 },
        totalPoints: { increment: points },
        goals: { increment: delta.goals },
        assists: { increment: delta.assists },
        yellowCards: { increment: delta.yellowCards },
        redCards: { increment: delta.redCards },
      },
    });
  }

  return {
    matchId: claim.matchId,
    events: match.events.length,
    pointsAssigned,
    matchdayId: matchday.id,
  };
}

export type FantasyScoringSyncResult = {
  matchesRetrieved: number;
  matchesProcessed: number;
  eventsProcessed: number;
  pointsAssigned: number;
  durationMs: number;
};

export async function syncFantasyScoring(): Promise<FantasyScoringSyncResult> {
  const startedAt = Date.now();
  const cupSync = await syncLeonessaCup();
  const matches = await prisma.match.findMany({
    where: {
      competitionId: cupSync.competitionId || undefined,
      status: "FINISHED",
      deletedAt: null,
      fantasyProcessedMatch: null,
    },
    include: { events: true },
    orderBy: { startAt: "asc" },
  });
  let matchesProcessed = 0;
  let eventsProcessed = 0;
  let pointsAssigned = 0;

  for (const match of matches) {
    try {
      const result = await prisma.$transaction((transaction) => processMatch(transaction, match), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      matchesProcessed += 1;
      eventsProcessed += result.events;
      pointsAssigned += result.pointsAssigned;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }

  const result = {
    matchesRetrieved: cupSync.matchesRetrieved,
    matchesProcessed,
    eventsProcessed,
    pointsAssigned,
    durationMs: Date.now() - startedAt,
  };
  logger.info(result, "Fantasy scoring sync completed");
  return result;
}

export async function getFantasyScoringStatus() {
  const [lastProcessedMatch, processedMatches, fantasyUsers, fantasyPlayers] = await Promise.all([
    prisma.fantasyProcessedMatch.findFirst({
      orderBy: { syncedAt: "desc" },
      select: { syncedAt: true },
    }),
    prisma.fantasyProcessedMatch.count(),
    prisma.fantasyTeam.count(),
    prisma.fantasyPlayerStat.count(),
  ]);

  return {
    lastSyncedAt: lastProcessedMatch?.syncedAt ?? null,
    processedMatches,
    fantasyUsers,
    fantasyPlayers,
  };
}
