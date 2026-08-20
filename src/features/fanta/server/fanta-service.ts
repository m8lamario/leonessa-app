import "server-only";

import { Prisma } from "@prisma/client";

import { awardLPInTransaction } from "@/features/rewards/server/reward-engine";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";
import { FANTA_CREATION_REWARD, INITIAL_BUDGET, TEAM_SIZE, STARTER_SIZE, BENCH_SIZE, STARTER_LIMITS, BENCH_LIMITS } from "../constants/fanta";
import { grantAchievement, recordActivity } from "./social-service";
import type { FantasyRole } from "../types";

const fantasyRoles = Object.keys(STARTER_LIMITS) as FantasyRole[];

export type CreateFantasyTeamInput = {
  name: string;
  starterIds: string[];
  benchIds: string[];
  captainId: string;
};

export async function getFantasyTeamByUserId(userId: string) {
  return prisma.fantasyTeam.findUnique({
    where: { userId },
    include: { players: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getFantasyDashboardData(userId: string) {
  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    include: {
      players: {
        include: {
          player: {
            select: {
              id: true,
              fantasyRole: true,
              fantasyStat: { select: { totalPoints: true, goals: true, assists: true } },
              user: { select: { name: true, surname: true } },
              team: { select: { school: { select: { shortName: true, name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  const [rankingTeams, upcomingMatches, featuredPlayers] = await Promise.all([
    prisma.fantasyTeam.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        totalPoints: true,
        user: { select: { name: true } },
      },
      orderBy: [{ totalPoints: "desc" }, { createdAt: "asc" }],
      take: 10,
    }),
    prisma.match.findMany({
      where: {
        deletedAt: null,
        status: { in: ["SCHEDULED", "LIVE"] },
        startAt: { gte: new Date() },
        competition: { slug: "leonessa-cup" },
      },
      select: {
        id: true,
        startAt: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    prisma.teamMember.findMany({
      where: { role: "PLAYER", leftAt: null, user: { deletedAt: null } },
      select: {
        id: true,
        fantasyValue: true,
        fantasyStat: { select: { totalPoints: true } },
        valueHistory: { orderBy: { createdAt: "desc" }, take: 1, select: { oldValue: true } },
        _count: { select: { fantasySelections: true } },
        user: { select: { name: true, surname: true } },
        team: { select: { school: { select: { shortName: true } } } },
      },
      orderBy: { fantasyValue: "desc" },
      take: 20,
    }),
  ]);

  const position =
    rankingTeams.findIndex((item) => item.id === team.id) >= 0
      ? rankingTeams.findIndex((item) => item.id === team.id) + 1
      : (await prisma.fantasyTeam.count({
          where: {
            OR: [
              { totalPoints: { gt: team.totalPoints } },
              { totalPoints: team.totalPoints, createdAt: { lt: team.createdAt } },
            ],
          },
        })) + 1;
  const latestScore = await prisma.fantasyScore.findFirst({
    where: { fantasyTeamId: team.id },
    orderBy: { createdAt: "desc" },
    select: { points: true },
  });
  const roster = team.players.map((entry) => ({
    id: entry.id,
    name:
      [entry.player.user.name, entry.player.user.surname].filter(Boolean).join(" ") || "Giocatore",
    school: entry.player.team.school.shortName,
    role: entry.role,
    status: entry.status,
    benchOrder: entry.benchOrder,
    isCaptain: entry.isCaptain,
    totalPoints: entry.player.fantasyStat?.totalPoints ?? 0,
    matchPoints: entry.player.fantasyStat?.totalPoints ?? 0,
    goals: entry.player.fantasyStat?.goals ?? 0,
    assists: entry.player.fantasyStat?.assists ?? 0,
  }));
  const starters = roster
    .filter((player) => player.status === "STARTER")
    .sort((a, b) => a.role.localeCompare(b.role));
  const bench = roster
    .filter((player) => player.status === "BENCH")
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));

  const mostSelected = [...featuredPlayers].sort(
    (a, b) => b._count.fantasySelections - a._count.fantasySelections,
  )[0];
  const fastestRising = [...featuredPlayers].sort((a, b) => {
    const aChange = a.valueHistory[0] ? a.fantasyValue - a.valueHistory[0].oldValue : 0;
    const bChange = b.valueHistory[0] ? b.fantasyValue - b.valueHistory[0].oldValue : 0;
    return bChange - aChange;
  })[0];
  const currentMvp = [...featuredPlayers].sort(
    (a, b) => (b.fantasyStat?.totalPoints ?? 0) - (a.fantasyStat?.totalPoints ?? 0),
  )[0];
  const discoveryEntries = [
    mostSelected ? { player: mostSelected, label: "🔥 Più scelto" } : null,
    fastestRising ? { player: fastestRising, label: "📈 In crescita" } : null,
    currentMvp ? { player: currentMvp, label: "⭐ MVP attuale" } : null,
  ].filter((entry): entry is { player: (typeof featuredPlayers)[number]; label: string } =>
    Boolean(entry),
  );
  const uniqueDiscoveries = discoveryEntries.filter(
    (entry, index, items) =>
      items.findIndex((item) => item.player.id === entry.player.id) === index,
  );

  return {
    team: { id: team.id, name: team.name, budgetLp: team.budgetLp, totalPoints: team.totalPoints },
    position: position || rankingTeams.length + 1,
    lastMatchPoints: latestScore?.points ?? 0,
    roster,
    starters,
    bench,
    ranking: rankingTeams.map((item, index) => ({
      position: index + 1,
      name: item.userId === userId ? "Tu" : item.name,
      points: item.totalPoints,
      isCurrent: item.userId === userId,
    })),
    upcomingMatches: upcomingMatches.map((match) => ({
      id: match.id,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      startAt: match.startAt.toISOString(),
    })),
    discoveries: uniqueDiscoveries.map(({ player, label }) => ({
      id: player.id,
      label,
      name: [player.user.name, player.user.surname].filter(Boolean).join(" ") || "Giocatore",
      school: player.team.school.shortName,
      value: player.fantasyValue,
    })),
  };
}

export async function hasFantasyTeam(userId: string) {
  const team = await prisma.fantasyTeam.findUnique({ where: { userId }, select: { id: true } });
  return Boolean(team);
}

export async function getAvailableFantasyPlayers() {
  const players = await prisma.teamMember.findMany({
    where: { role: "PLAYER", leftAt: null, user: { deletedAt: null } },
    select: {
      id: true,
      fantasyRole: true,
      fantasyValue: true,
      user: { select: { name: true, surname: true } },
      team: { select: { school: { select: { shortName: true } } } },
    },
    orderBy: [{ fantasyRole: "asc" }, { fantasyValue: "asc" }],
  });

  return players.map((player) => ({
    id: player.id,
    name: [player.user.name, player.user.surname].filter(Boolean).join(" ") || "Giocatore",
    school: player.team.school.shortName,
    role: (fantasyRoles.includes(player.fantasyRole as FantasyRole)
      ? player.fantasyRole
      : "CENTROCAMPISTA") as FantasyRole,
    fantasyValue: player.fantasyValue,
    badges: [],
  }));
}

function validateInput(
  input: CreateFantasyTeamInput,
  players: Array<{ id: string; fantasyRole: string; fantasyValue: number }>,
) {
  const name = input.name.trim();
  if (name.length < 3 || name.length > 30) {
    throw new AppError("BAD_REQUEST", "Il nome squadra deve contenere da 3 a 30 caratteri.", 400);
  }
  if (input.starterIds.length !== STARTER_SIZE || new Set(input.starterIds).size !== STARTER_SIZE) {
    throw new AppError("BAD_REQUEST", "Devi selezionare 11 titolari.", 400);
  }
  if (input.benchIds.length !== BENCH_SIZE || new Set(input.benchIds).size !== BENCH_SIZE) {
    throw new AppError("BAD_REQUEST", "Devi selezionare 4 riserve.", 400);
  }
  const allIds = [...input.starterIds, ...input.benchIds];
  if (new Set(allIds).size !== TEAM_SIZE) {
    throw new AppError("BAD_REQUEST", "Non ci possono essere duplicati tra titolari e riserve.", 400);
  }
  if (!input.captainId || !input.starterIds.includes(input.captainId)) {
    throw new AppError("BAD_REQUEST", "Il capitano deve essere uno degli 11 titolari.", 400);
  }

  const selected = allIds.map((id) => players.find((player) => player.id === id));
  if (selected.some((player) => !player)) {
    throw new AppError("BAD_REQUEST", "Uno o più giocatori non sono disponibili.", 400);
  }

  const cost = selected.reduce((total, player) => total + (player?.fantasyValue ?? 0), 0);
  if (cost > INITIAL_BUDGET) {
    throw new AppError("BAD_REQUEST", "Budget insufficiente.", 400);
  }

  const starters = input.starterIds.map((id) => players.find((player) => player.id === id)!);
  const bench = input.benchIds.map((id) => players.find((player) => player.id === id)!);

  for (const role of fantasyRoles) {
    const starterCount = starters.filter((player) => player.fantasyRole === role).length;
    if (starterCount !== STARTER_LIMITS[role]) {
      throw new AppError(
        "BAD_REQUEST",
        `I titolari richiedono ${STARTER_LIMITS[role]} ${role.toLowerCase()}.`,
        400,
      );
    }
    const benchCount = bench.filter((player) => player.fantasyRole === role).length;
    if (benchCount !== BENCH_LIMITS[role]) {
      throw new AppError(
        "BAD_REQUEST",
        `Le riserve richiedono ${BENCH_LIMITS[role]} ${role.toLowerCase()}.`,
        400,
      );
    }
  }

  return { name, starters, bench, cost };
}

export async function createFantasyTeam(userId: string, input: CreateFantasyTeamInput) {
  return prisma
    .$transaction(async (transaction) => {
      const existing = await transaction.fantasyTeam.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (existing) {
        throw new AppError("CONFLICT", "Hai già creato una squadra fantasy.", 409);
      }

      const allIds = [...input.starterIds, ...input.benchIds];
      const available = await transaction.teamMember.findMany({
        where: {
          id: { in: allIds },
          role: "PLAYER",
          leftAt: null,
          user: { deletedAt: null },
        },
        select: { id: true, fantasyRole: true, fantasyValue: true },
      });
      const { name, starters, bench, cost } = validateInput(input, available);
      const team = await transaction.fantasyTeam.create({
        data: {
          userId,
          name,
          budgetLp: INITIAL_BUDGET - cost,
          players: {
            create: [
              ...starters.map((player) => ({
                playerId: player.id,
                role: player.fantasyRole,
                status: "STARTER" as const,
                benchOrder: null,
                purchaseCost: player.fantasyValue,
                isCaptain: player.id === input.captainId,
              })),
              ...bench.map((player, index) => ({
                playerId: player.id,
                role: player.fantasyRole,
                status: "BENCH" as const,
                benchOrder: index,
                purchaseCost: player.fantasyValue,
                isCaptain: false,
              })),
            ],
          },
        },
        include: { players: true },
      });

      await awardLPInTransaction(transaction, {
        userId,
        amount: FANTA_CREATION_REWARD,
        sourceType: "MISSION",
        sourceId: team.id,
        reason: "Creazione squadra Fanta Leonessa",
        idempotencyKey: `fanta-team-created:${userId}`,
      });

      return team;
    })
    .then(async (team) => {
      await grantAchievement(userId, "FOUNDER");
      await recordActivity({
        type: "achievement",
        title: `${team.name} ha creato la sua squadra fantasy 🏁`,
      });
      return team;
    })
    .catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("CONFLICT", "Hai già creato una squadra fantasy.", 409);
      }
      throw error;
    });
}
