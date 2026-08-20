import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertControlCenterEnabled, SCORING_RULES } from "./control-center-service";

const SANDBOX_SLUG = "leonessa-cup-sandbox";

type Snapshot = {
  playerPoints: Record<string, number>;
  teamPoints: Record<string, number>;
  budgets: Record<string, number>;
};

function playerPoints(
  match: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    events: Array<{ playerId: string | null; type: string }>;
  },
  player: { id: string; teamId: string; fantasyRole: string },
) {
  const home = player.teamId === match.homeTeamId;
  const own = home ? match.homeScore : match.awayScore;
  const opponent = home ? match.awayScore : match.homeScore;
  let points = match.events
    .filter((event) => event.playerId === player.id)
    .reduce(
      (sum, event) => sum + (SCORING_RULES[event.type as keyof typeof SCORING_RULES] ?? 0),
      0,
    );
  points += own > opponent ? SCORING_RULES.WIN : own === opponent ? SCORING_RULES.DRAW : 0;
  if (opponent === 0 && (player.fantasyRole === "PORTIERE" || player.fantasyRole === "DIFENSORE"))
    points += SCORING_RULES.CLEAN_SHEET;
  return points;
}

async function snapshot(teamIds: string[], playerIds: string[]): Promise<Snapshot> {
  const [stats, teams] = await Promise.all([
    prisma.fantasyPlayerStat.findMany({
      where: { playerId: { in: playerIds } },
      select: { playerId: true, totalPoints: true },
    }),
    prisma.fantasyTeam.findMany({
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
        include: { players: true },
      });
      const playerIds = [
        ...new Set(sandboxTeams.flatMap((team) => team.players.map((player) => player.playerId))),
      ];
      const teamIds = sandboxTeams.map((team) => team.id);
      const before = await snapshot(teamIds, playerIds);
      const matches = await tx.match.findMany({
        where: { competitionId: competition.id, status: "FINISHED", deletedAt: null },
        include: { events: true },
      });
      const players = await tx.teamMember.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, teamId: true, fantasyRole: true },
      });
      await tx.fantasyPlayerStat.deleteMany({ where: { playerId: { in: playerIds } } });
      for (const player of players) {
        let total = 0;
        let goals = 0;
        let assists = 0;
        let yellowCards = 0;
        let redCards = 0;
        let matchesPlayed = 0;
        for (const current of matches) {
          if (![current.homeTeamId, current.awayTeamId].includes(player.teamId)) continue;
          matchesPlayed += 1;
          total += playerPoints(current, player);
          for (const event of current.events.filter((item) => item.playerId === player.id)) {
            if (event.type === "GOAL") goals += 1;
            if (event.type === "ASSIST") assists += 1;
            if (event.type === "YELLOW_CARD") yellowCards += 1;
            if (event.type === "RED_CARD") redCards += 1;
          }
        }
        await tx.fantasyPlayerStat.create({
          data: {
            playerId: player.id,
            totalPoints: total,
            goals,
            assists,
            yellowCards,
            redCards,
            matches: matchesPlayed,
          },
        });
      }
      await tx.fantasyScore.deleteMany({ where: { fantasyTeamId: { in: teamIds } } });
      for (const team of sandboxTeams) {
        let total = 0;
        for (const current of matches) {
          const selected = team.players.filter((selection) =>
            players.some(
              (player) =>
                player.id === selection.playerId &&
                [current.homeTeamId, current.awayTeamId].includes(player.teamId),
            ),
          );
          total += selected.reduce((sum, selection) => {
            const player = players.find((item) => item.id === selection.playerId);
            if (!player) return sum;
            const points = playerPoints(current, player);
            return sum + (selection.isCaptain ? Math.round(points * 1.5) : points);
          }, 0);
        }
        await tx.fantasyTeam.update({ where: { id: team.id }, data: { totalPoints: total } });
        await tx.fantasyScore.create({
          data: {
            fantasyTeamId: team.id,
            matchdayId: (
              await tx.fantasyMatchday.upsert({
                where: { round: 99999999 },
                update: {},
                create: { round: 99999999, startedAt: match.startAt, completedAt: new Date() },
              })
            ).id,
            points: total,
          },
        });
      }
      const after = await snapshot(teamIds, playerIds);
      await tx.fantasyProcessedMatch.deleteMany({ where: { matchId } });
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
