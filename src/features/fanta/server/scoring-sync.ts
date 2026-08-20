import "server-only";

import { Prisma } from "@prisma/client";

import { syncLeonessaCup } from "@/features/cup/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveLineup } from "../lib/lineup-resolver";
import {
  computeMatchScoring,
  getMatchdayRound,
  type ScorableMatch,
} from "../lib/scoring-engine";
import { getPlayedPlayerIdsForMatch } from "./participation-provider";

type ScoringMatch = Prisma.MatchGetPayload<{
  include: { events: true };
}>;

function toScorableMatch(match: ScoringMatch): ScorableMatch {
  return {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    events: match.events.map((event) => ({
      playerId: event.playerId,
      type: event.type,
    })),
  };
}

export type ProcessMatchOptions = {
  /** Override participation. `undefined` uses the default provider. */
  playedPlayerIds?: Set<string> | null;
};

export async function processMatch(
  transaction: Prisma.TransactionClient,
  match: ScoringMatch,
  options?: ProcessMatchOptions,
) {
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
    select: { id: true, teamId: true, fantasyRole: true },
  });
  const matchPlayerIds = new Set(players.map((player) => player.id));
  const fantasyTeams = await transaction.fantasyTeam.findMany({
    where: { players: { some: { playerId: { in: [...matchPlayerIds] } } } },
    include: {
      players: {
        select: {
          playerId: true,
          role: true,
          isCaptain: true,
          status: true,
          benchOrder: true,
        },
      },
    },
  });

  const playedPlayerIds =
    options && "playedPlayerIds" in options
      ? (options.playedPlayerIds ?? null)
      : await getPlayedPlayerIdsForMatch(match.id);

  const teamsForScoring = fantasyTeams.map((team) => {
    const resolved = resolveEffectiveLineup(
      team.players.map((player) => ({
        playerId: player.playerId,
        role: player.role,
        status: player.status,
        isCaptain: player.isCaptain,
        benchOrder: player.benchOrder,
      })),
      matchPlayerIds,
      playedPlayerIds,
    );
    return { team, resolved };
  });

  for (const { team, resolved } of teamsForScoring) {
    if (resolved.substitutions.length === 0) continue;
    await transaction.fantasySubstitution.createMany({
      data: resolved.substitutions.map((substitution) => ({
        fantasyTeamId: team.id,
        matchId: match.id,
        playerOutId: substitution.playerOutId,
        playerInId: substitution.playerInId,
        reason: substitution.reason,
        sequence: substitution.sequence,
      })),
      skipDuplicates: true,
    });
  }

  const scored = computeMatchScoring(
    toScorableMatch(match),
    players,
    teamsForScoring.map(({ team, resolved }) => ({
      id: team.id,
      players: resolved.effective,
    })),
  );

  let pointsAssigned = 0;
  for (const teamScore of scored.teamPoints) {
    await transaction.fantasyScore.upsert({
      where: {
        fantasyTeamId_matchdayId: {
          fantasyTeamId: teamScore.fantasyTeamId,
          matchdayId: matchday.id,
        },
      },
      create: {
        fantasyTeamId: teamScore.fantasyTeamId,
        matchdayId: matchday.id,
        points: teamScore.points,
      },
      update: { points: { increment: teamScore.points } },
    });
    if (teamScore.points !== 0) {
      await transaction.fantasyTeam.update({
        where: { id: teamScore.fantasyTeamId },
        data: { totalPoints: { increment: teamScore.points } },
      });
    }
    pointsAssigned += teamScore.points;
  }

  for (const playerScore of scored.playerPoints) {
    await transaction.fantasyPlayerStat.upsert({
      where: { playerId: playerScore.playerId },
      create: {
        playerId: playerScore.playerId,
        matches: 1,
        totalPoints: playerScore.points,
        ...playerScore.delta,
      },
      update: {
        matches: { increment: 1 },
        totalPoints: { increment: playerScore.points },
        goals: { increment: playerScore.delta.goals },
        assists: { increment: playerScore.delta.assists },
        yellowCards: { increment: playerScore.delta.yellowCards },
        redCards: { increment: playerScore.delta.redCards },
      },
    });
  }

  return {
    matchId: claim.matchId,
    events: match.events.length,
    pointsAssigned,
    matchdayId: matchday.id,
    substitutions: teamsForScoring.reduce((total, item) => total + item.resolved.substitutions.length, 0),
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
