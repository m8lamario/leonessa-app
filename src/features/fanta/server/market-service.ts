import "server-only";

import { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";
import { FORMATION_LIMITS, MARKET } from "../constants/fanta";
import type { FantasyRole } from "../types";

const fantasyRoles = Object.keys(FORMATION_LIMITS) as FantasyRole[];

export type MarketStatusDto = {
  open: boolean;
  closesAt: Date | null;
  nextKickoff: Date | null;
};

export type SerializedMarketStatus = {
  open: boolean;
  closesAt: string | null;
  nextKickoff: string | null;
};

export type PlayerMarketDto = {
  id: string;
  name: string;
  school: string;
  role: FantasyRole;
  fantasyValue: number;
  change: number;
  trend: "up" | "down" | "flat";
  owned: boolean;
  badge: "trending" | "falling" | "deal" | "top" | null;
};

export type MarketDashboardDto = {
  status: SerializedMarketStatus;
  team: {
    id: string;
    name: string;
    budgetLp: number;
    totalPoints: number;
    freeTransfers: number;
    paidTransfers: number;
    squad: Array<{
      id: string;
      playerId: string;
      name: string;
      school: string;
      role: string;
      isCaptain: boolean;
      value: number;
    }>;
  } | null;
  pool: PlayerMarketDto[];
  trending: { rising: PlayerMarketDto[]; falling: PlayerMarketDto[] };
  history: Array<{
    playerId: string;
    name: string;
    school: string;
    oldValue: number;
    newValue: number;
    createdAt: string;
  }>;
};

function trendOf(player: { fantasyValue: number; _marketChange?: number }): "up" | "down" | "flat" {
  const change = player._marketChange ?? 0;
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

function badgeOf(player: { fantasyValue: number; _marketChange?: number; _squadCount?: number }) {
  const change = player._marketChange ?? 0;
  if (change >= 5) return "trending";
  if (change <= -5) return "falling";
  if ((player._squadCount ?? 0) >= 5) return "top";
  return "deal";
}

export async function getMarketStatus(): Promise<MarketStatusDto> {
  const nextMatch = await prisma.match.findFirst({
    where: { deletedAt: null, status: { in: ["SCHEDULED", "LIVE"] } },
    orderBy: { startAt: "asc" },
    select: { startAt: true },
  });

  if (!nextMatch) {
    return { open: true, closesAt: null, nextKickoff: null };
  }

  const closesAt = new Date(
    nextMatch.startAt.getTime() - MARKET.marketClosesBeforeKickoffMinutes * 60_000,
  );
  return { open: new Date() < closesAt, closesAt, nextKickoff: nextMatch.startAt };
}

async function ensureCurrentMatchday(transaction: Prisma.TransactionClient, now = new Date()) {
  const match = await transaction.match.findFirst({
    where: { deletedAt: null, status: { in: ["SCHEDULED", "LIVE"] } },
    orderBy: { startAt: "asc" },
    select: { startAt: true },
  });
  const startAt = match?.startAt ?? now;
  const round = Number(
    `${startAt.getUTCFullYear()}${String(startAt.getUTCMonth() + 1).padStart(2, "0")}${String(
      startAt.getUTCDate(),
    ).padStart(2, "0")}`,
  );
  return transaction.fantasyMatchday.upsert({
    where: { round },
    create: { round, startedAt: startAt, completedAt: null },
    update: {},
  });
}

async function ensureTransfers(
  transaction: Prisma.TransactionClient,
  fantasyTeamId: string,
  matchdayId: string,
) {
  return transaction.fantasyTeamTransfer.upsert({
    where: { fantasyTeamId_matchdayId: { fantasyTeamId, matchdayId } },
    create: { fantasyTeamId, matchdayId, freeTransfers: 0, paidTransfers: 0 },
    update: {},
  });
}

async function assertMarketOpen() {
  const status = await getMarketStatus();
  if (!status.open) {
    throw new AppError("FORBIDDEN", "Il mercato è chiuso. Riapre al termine della giornata.", 403);
  }
}

function assertFormationValid(
  selections: Array<{ role: string }>,
  delta: { removedRole: string | null; addedRole: string | null },
) {
  const counts: Record<string, number> = {};
  for (const role of fantasyRoles) counts[role] = 0;
  for (const selection of selections) {
    counts[selection.role] = (counts[selection.role] ?? 0) + 1;
  }
  if (delta.removedRole) counts[delta.removedRole] -= 1;
  if (delta.addedRole) counts[delta.addedRole] = (counts[delta.addedRole] ?? 0) + 1;

  for (const role of fantasyRoles) {
    if (counts[role] !== FORMATION_LIMITS[role]) {
      throw new AppError(
        "BAD_REQUEST",
        `La formazione richiede ${FORMATION_LIMITS[role]} ${role.toLowerCase()}.`,
        400,
      );
    }
  }
}

export async function buyPlayer(userId: string, playerId: string) {
  await assertMarketOpen();

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const team = await transaction.fantasyTeam.findUnique({
          where: { userId },
          include: { players: true },
        });
        if (!team) {
          throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);
        }
        if (team.players.some((selection) => selection.playerId === playerId)) {
          throw new AppError("CONFLICT", "Giocatore già in rosa.", 409);
        }

        const player = await transaction.teamMember.findFirst({
          where: { id: playerId, role: "PLAYER", leftAt: null, user: { deletedAt: null } },
          select: { id: true, fantasyRole: true, fantasyValue: true },
        });
        if (!player) {
          throw new AppError("NOT_FOUND", "Giocatore non disponibile.", 404);
        }

        const role = (
          fantasyRoles.includes(player.fantasyRole as FantasyRole)
            ? player.fantasyRole
            : "CENTROCAMPISTA"
        ) as FantasyRole;
        const matchday = await ensureCurrentMatchday(transaction);
        const transfers = await ensureTransfers(transaction, team.id, matchday.id);
        const transferCount = transfers.freeTransfers + transfers.paidTransfers;
        const isFree = transferCount < MARKET.freeTransfersPerMatchday;
        const cost = player.fantasyValue + (isFree ? 0 : MARKET.paidTransferCostLp);

        if (team.budgetLp < cost) {
          throw new AppError("BAD_REQUEST", "Budget LP insufficiente.", 400);
        }

        assertFormationValid(team.players, { removedRole: null, addedRole: role });

        await transaction.fantasyTeamPlayer.create({
          data: { fantasyTeamId: team.id, playerId, role, purchaseCost: player.fantasyValue },
        });
        await transaction.fantasyTeam.update({
          where: { id: team.id },
          data: { budgetLp: { decrement: cost } },
        });
        await transaction.fantasyTeamTransfer.update({
          where: { id: transfers.id },
          data: {
            freeTransfers: { increment: isFree ? 1 : 0 },
            paidTransfers: { increment: isFree ? 0 : 1 },
          },
        });

        logger.info({ userId, playerId, cost, free: isFree }, "Market buy completed");
        return { budgetLp: team.budgetLp - cost, free: isFree };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw error;
  }
}

export async function sellPlayer(userId: string, playerId: string) {
  await assertMarketOpen();

  return prisma.$transaction(
    async (transaction) => {
      const team = await transaction.fantasyTeam.findUnique({
        where: { userId },
        include: { players: true },
      });
      if (!team) {
        throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);
      }

      const selection = team.players.find((item) => item.playerId === playerId);
      if (!selection) {
        throw new AppError("NOT_FOUND", "Giocatore non in rosa.", 404);
      }

      const player = await transaction.teamMember.findUnique({
        where: { id: playerId },
        select: { fantasyValue: true },
      });
      if (!player) {
        throw new AppError("NOT_FOUND", "Giocatore non trovato.", 404);
      }

      assertFormationValid(team.players, { removedRole: selection.role, addedRole: null });

      const matchday = await ensureCurrentMatchday(transaction);
      const transfers = await ensureTransfers(transaction, team.id, matchday.id);
      const transferCount = transfers.freeTransfers + transfers.paidTransfers;
      const isFree = transferCount < MARKET.freeTransfersPerMatchday;

      await transaction.fantasyTeamPlayer.delete({ where: { id: selection.id } });
      await transaction.fantasyTeam.update({
        where: { id: team.id },
        data: { budgetLp: { increment: player.fantasyValue } },
      });
      await transaction.fantasyTeamTransfer.update({
        where: { id: transfers.id },
        data: {
          freeTransfers: { increment: isFree ? 1 : 0 },
          paidTransfers: { increment: isFree ? 0 : 1 },
        },
      });

      logger.info(
        { userId, playerId, credits: player.fantasyValue, free: isFree },
        "Market sell completed",
      );
      return { budgetLp: team.budgetLp + player.fantasyValue, free: isFree };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function changeCaptain(userId: string, playerId: string) {
  await assertMarketOpen();

  return prisma.$transaction(async (transaction) => {
    const team = await transaction.fantasyTeam.findUnique({
      where: { userId },
      include: { players: true },
    });
    if (!team) {
      throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);
    }
    if (!team.players.some((selection) => selection.playerId === playerId)) {
      throw new AppError("BAD_REQUEST", "Il capitano deve essere in rosa.", 400);
    }

    await transaction.fantasyTeamPlayer.updateMany({
      where: { fantasyTeamId: team.id },
      data: { isCaptain: false },
    });
    await transaction.fantasyTeamPlayer.update({
      where: { fantasyTeamId_playerId: { fantasyTeamId: team.id, playerId } },
      data: { isCaptain: true },
    });

    logger.info({ userId, teamId: team.id, playerId }, "Market captain changed");
    return { captainId: playerId };
  });
}

export async function getMarketDashboard(userId: string): Promise<MarketDashboardDto> {
  const [status, team] = await Promise.all([getMarketStatus(), getFantasyTeamWithSquad(userId)]);

  const openPool = await prisma.teamMember.findMany({
    where: { role: "PLAYER", leftAt: null, user: { deletedAt: null } },
    select: {
      id: true,
      fantasyValue: true,
      fantasyRole: true,
      valueHistory: { orderBy: { createdAt: "desc" }, take: 1, select: { oldValue: true } },
      _count: { select: { fantasySelections: true } },
      user: { select: { name: true, surname: true } },
      team: { select: { school: { select: { shortName: true } } } },
    },
  });

  const ownedIds = new Set(team?.squad.map((entry) => entry.playerId) ?? []);
  const toDto = (player: (typeof openPool)[number]): PlayerMarketDto => ({
    id: player.id,
    name: [player.user.name, player.user.surname].filter(Boolean).join(" ") || "Giocatore",
    school: player.team.school.shortName,
    role: (fantasyRoles.includes(player.fantasyRole as FantasyRole)
      ? player.fantasyRole
      : "CENTROCAMPISTA") as FantasyRole,
    fantasyValue: player.fantasyValue,
    change: player.valueHistory[0] ? player.fantasyValue - player.valueHistory[0].oldValue : 0,
    trend: trendOf({
      fantasyValue: player.fantasyValue,
      _marketChange: player.valueHistory[0]
        ? player.fantasyValue - player.valueHistory[0].oldValue
        : 0,
    }),
    owned: ownedIds.has(player.id),
    badge: badgeOf({
      fantasyValue: player.fantasyValue,
      _marketChange: player.valueHistory[0]
        ? player.fantasyValue - player.valueHistory[0].oldValue
        : 0,
      _squadCount: player._count.fantasySelections,
    }),
  });

  const all = openPool.map(toDto);
  const rising = all
    .filter((player) => !player.owned && player.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 6);
  const falling = all
    .filter((player) => !player.owned && player.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 6);

  const history = await prisma.fantasyPlayerValueHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      playerId: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      player: {
        select: {
          user: { select: { name: true, surname: true } },
          team: { select: { school: { select: { shortName: true } } } },
        },
      },
    },
  });

  return {
    status: {
      open: status.open,
      closesAt: status.closesAt?.toISOString() ?? null,
      nextKickoff: status.nextKickoff?.toISOString() ?? null,
    },
    team,
    pool: all,
    trending: { rising, falling },
    history: history.map((entry) => ({
      playerId: entry.playerId,
      name:
        [entry.player.user.name, entry.player.user.surname].filter(Boolean).join(" ") ||
        "Giocatore",
      school: entry.player.team.school.shortName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function getFantasyTeamWithSquad(userId: string) {
  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    include: {
      players: {
        include: {
          player: {
            select: {
              fantasyValue: true,
              user: { select: { name: true, surname: true } },
              team: { select: { school: { select: { shortName: true } } } },
            },
          },
        },
      },
      transfers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!team) return null;

  const latestTransfer = team.transfers[0];
  return {
    id: team.id,
    name: team.name,
    budgetLp: team.budgetLp,
    totalPoints: team.totalPoints,
    freeTransfers: latestTransfer?.freeTransfers ?? 0,
    paidTransfers: latestTransfer?.paidTransfers ?? 0,
    squad: team.players.map((selection) => ({
      id: selection.id,
      playerId: selection.playerId,
      name:
        [selection.player.user.name, selection.player.user.surname].filter(Boolean).join(" ") ||
        "Giocatore",
      school: selection.player.team.school.shortName,
      role: selection.role,
      isCaptain: selection.isCaptain,
      value: selection.player.fantasyValue,
    })),
  };
}
