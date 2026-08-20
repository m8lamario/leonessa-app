import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SCORING_RULES,
  computeMatchScoring,
  getMatchdayRound,
  type ScorableMatch,
} from "../lib/scoring-engine";
import { resolveEffectiveLineup } from "../lib/lineup-resolver";
import { assertControlCenterEnabled } from "./control-center-service";
import { getPlayedPlayerIdsForMatch } from "./participation-provider";

const SANDBOX_SLUG = "leonessa-cup-sandbox";

type Snapshot = {
  playerPoints: Record<string, number>;
  teamPoints: Record<string, number>;
  budgets: Record<string, number>;
};

function toScorableMatch(match: {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  events: Array<{ playerId: string | null; type: string }>;
}): ScorableMatch {
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

async function snapshot(
  client: Prisma.TransactionClient,
  teamIds: string[],
  playerIds: string[],
): Promise<Snapshot> {
  const [stats, teams] = await Promise.all([
    client.fantasyPlayerStat.findMany({
      where: { playerId: { in: playerIds } },
      select: { playerId: true, totalPoints: true },
    }),
    client.fantasyTeam.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, totalPoints: true, budgetLp: true },
    }),
  ]);
  return {
    playerPoints: Object.fromEntries(stats.map((stat) => [stat.playerId, stat.totalPoints])),
    teamPoints: Object.fromEntries(teams.map((team) => [team.id, team.totalPoints])),
    budgets: Object.fromEntries(teams.map((team) => [team.id, team.budgetLp])),
  };
}

/**
 * Full rebuild of sandbox fantasy stats/scores using the shared scoring engine.
 */
export async function recalculateSandbox(matchId: string) {
  assertControlCenterEnabled();
  return prisma.$transaction(
    async (tx) => {
      const competition = await tx.competition.findUnique({
        where: { slug: SANDBOX_SLUG },
        select: { id: true },
      });
      if (!competition) throw new Error("Sandbox competition non trovata.");
      const match = await tx.match.findFirst({
        where: { id: matchId, competitionId: competition.id },
        include: { events: true },
      });
      if (!match) throw new Error("Partita Sandbox non trovata.");

      const sandboxTeams = await tx.fantasyTeam.findMany({
        where: { user: { email: { startsWith: "sandbox-user-" } } },
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
      const playerIds = [
        ...new Set(sandboxTeams.flatMap((team) => team.players.map((player) => player.playerId))),
      ];
      const teamIds = sandboxTeams.map((team) => team.id);
      const before = await snapshot(tx, teamIds, playerIds);

      const matches = await tx.match.findMany({
        where: { competitionId: competition.id, status: "FINISHED", deletedAt: null },
        include: { events: true },
        orderBy: { startAt: "asc" },
      });
      const players = await tx.teamMember.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, teamId: true, fantasyRole: true },
      });
      const playerById = new Map(players.map((player) => [player.id, player]));

      const playerAgg = new Map<
        string,
        {
          totalPoints: number;
          goals: number;
          assists: number;
          yellowCards: number;
          redCards: number;
          matches: number;
        }
      >();
      for (const player of players) {
        playerAgg.set(player.id, {
          totalPoints: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matches: 0,
        });
      }

      const teamTotals = new Map<string, number>();
      const teamMatchdayPoints = new Map<string, Map<number, number>>();
      for (const team of sandboxTeams) {
        teamTotals.set(team.id, 0);
        teamMatchdayPoints.set(team.id, new Map());
      }

      const matchdayByRound = new Map<number, string>();
      const plannedSubs: Array<{
        fantasyTeamId: string;
        matchId: string;
        playerOutId: string;
        playerInId: string;
        reason: string;
        sequence: number;
      }> = [];

      for (const current of matches) {
        const involvedPlayers = players.filter((player) =>
          [current.homeTeamId, current.awayTeamId].includes(player.teamId),
        );
        const involvedIds = new Set(involvedPlayers.map((player) => player.id));
        const playedPlayerIds = await getPlayedPlayerIdsForMatch(current.id);

        const involvedTeams = sandboxTeams
          .map((team) => {
            const resolved = resolveEffectiveLineup(
              team.players.map((selection) => ({
                playerId: selection.playerId,
                role: selection.role,
                status: selection.status,
                isCaptain: selection.isCaptain,
                benchOrder: selection.benchOrder,
              })),
              involvedIds,
              playedPlayerIds,
            );
            for (const substitution of resolved.substitutions) {
              plannedSubs.push({
                fantasyTeamId: team.id,
                matchId: current.id,
                playerOutId: substitution.playerOutId,
                playerInId: substitution.playerInId,
                reason: substitution.reason,
                sequence: substitution.sequence,
              });
            }
            return {
              id: team.id,
              players: resolved.effective,
            };
          })
          .filter((team) => team.players.length > 0);

        const scored = computeMatchScoring(
          toScorableMatch(current),
          involvedPlayers,
          involvedTeams,
        );

        for (const playerScore of scored.playerPoints) {
          const agg = playerAgg.get(playerScore.playerId);
          if (!agg) continue;
          agg.totalPoints += playerScore.points;
          agg.goals += playerScore.delta.goals;
          agg.assists += playerScore.delta.assists;
          agg.yellowCards += playerScore.delta.yellowCards;
          agg.redCards += playerScore.delta.redCards;
          agg.matches += 1;
        }

        const round = getMatchdayRound(current.startAt);
        if (!matchdayByRound.has(round)) {
          const matchday = await tx.fantasyMatchday.upsert({
            where: { round },
            create: {
              round,
              startedAt: current.startAt,
              completedAt: current.startAt,
            },
            update: {
              startedAt: { set: current.startAt },
              completedAt: { set: current.startAt },
            },
          });
          matchdayByRound.set(round, matchday.id);
        }

        for (const teamScore of scored.teamPoints) {
          teamTotals.set(
            teamScore.fantasyTeamId,
            (teamTotals.get(teamScore.fantasyTeamId) ?? 0) + teamScore.points,
          );
          const byRound = teamMatchdayPoints.get(teamScore.fantasyTeamId)!;
          byRound.set(round, (byRound.get(round) ?? 0) + teamScore.points);
        }
      }

      await tx.fantasyPlayerStat.deleteMany({ where: { playerId: { in: playerIds } } });
      for (const [playerId, agg] of playerAgg) {
        if (!playerById.has(playerId)) continue;
        await tx.fantasyPlayerStat.create({
          data: {
            playerId,
            totalPoints: agg.totalPoints,
            goals: agg.goals,
            assists: agg.assists,
            yellowCards: agg.yellowCards,
            redCards: agg.redCards,
            matches: agg.matches,
          },
        });
      }

      await tx.fantasyScore.deleteMany({ where: { fantasyTeamId: { in: teamIds } } });
      for (const team of sandboxTeams) {
        const total = teamTotals.get(team.id) ?? 0;
        await tx.fantasyTeam.update({
          where: { id: team.id },
          data: { totalPoints: total },
        });
        const byRound = teamMatchdayPoints.get(team.id) ?? new Map();
        for (const [round, points] of byRound) {
          const matchdayId = matchdayByRound.get(round);
          if (!matchdayId) continue;
          await tx.fantasyScore.create({
            data: {
              fantasyTeamId: team.id,
              matchdayId,
              points,
            },
          });
        }
      }

      await tx.fantasySubstitution.deleteMany({
        where: { match: { competitionId: competition.id } },
      });
      if (plannedSubs.length > 0) {
        await tx.fantasySubstitution.createMany({
          data: plannedSubs,
          skipDuplicates: true,
        });
      }

      await tx.fantasyProcessedMatch.deleteMany({
        where: { match: { competitionId: competition.id } },
      });
      if (matches.length > 0) {
        await tx.fantasyProcessedMatch.createMany({
          data: matches.map((item) => ({ matchId: item.id })),
          skipDuplicates: true,
        });
      }

      const after = await snapshot(tx, teamIds, playerIds);
      return { before, after, matchId, rules: SCORING_RULES };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function resetSandboxMatchScenario(matchId: string) {
  assertControlCenterEnabled();
  const competition = await prisma.competition.findUnique({
    where: { slug: SANDBOX_SLUG },
    select: { id: true },
  });
  if (!competition) throw new Error("Sandbox competition non trovata.");
  const match = await prisma.match.findFirst({
    where: { id: matchId, competitionId: competition.id },
    select: { id: true },
  });
  if (!match) throw new Error("Partita Sandbox non trovata.");
  await prisma.matchEvent.deleteMany({ where: { matchId } });
  const recalculated = await recalculateSandbox(matchId);
  return { reset: true, matchId, recalculated };
}
