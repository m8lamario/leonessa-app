import "server-only";

import { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";
import { getMatchdayRound } from "../lib/scoring-engine";
import { recordActivity } from "./social-service";
import { MARKET, STARTER_LIMITS } from "../constants/fanta";
import { validateRosterPlayers } from "../lib/lineup-validation";
import {
  evaluateSellToVacancy,
  getNetTransferCost,
  getRealTransferCost,
  getTransfersUsed,
} from "../lib/transfer-cost";
import type { FantasyRole } from "../types";

const fantasyRoles = Object.keys(STARTER_LIMITS) as FantasyRole[];

async function recordMarketActivity(title: string) {
  try {
    await recordActivity({ type: "player_bought", title });
  } catch {
    // Social telemetry must not roll back a completed market transaction.
  }
}

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
  lineup: {
    round: number;
    confirmedAt: string | null;
  };
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
      status: "STARTER" | "BENCH";
      benchOrder: number | null;
      isCaptain: boolean;
      value: number;
      totalPoints: number;
    }>;
    vacancies: Array<{
      id: string;
      role: string;
      status: "STARTER" | "BENCH";
      benchOrder: number | null;
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

export async function getMarketStatus(
  now = new Date(),
): Promise<MarketStatusDto> {
  const blockingMatch = await prisma.match.findFirst({
    where: {
      deletedAt: null,
      startAt: {
        gte: new Date(now.getTime() - 60 * 60_000),
        lte: new Date(now.getTime() + 30 * 60_000),
      },
    },
    orderBy: { startAt: "asc" },
    select: { startAt: true },
  });

  if (!blockingMatch) {
    return {
      open: true,
      closesAt: null,
      nextKickoff: null,
    };
  }

  return {
    open: false,
    closesAt: new Date(
      blockingMatch.startAt.getTime() -
        MARKET.marketClosesBeforeKickoffMinutes * 60_000,
    ),
    nextKickoff: blockingMatch.startAt,
  };
}

export async function ensureCurrentMatchday(
  transaction: Prisma.TransactionClient,
  now = new Date(),
) {
  const match = await transaction.match.findFirst({
    where: {
      deletedAt: null,
      status: { in: ["SCHEDULED", "LIVE"] },
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
    select: { startAt: true },
  });
  const startAt = match?.startAt ?? now;
  const round = getMatchdayRound(startAt);
  return transaction.fantasyMatchday.upsert({
    where: { round },
    create: { round, startedAt: startAt, completedAt: null },
    update: {},
  });
}

export async function clearCurrentLineupConfirmation(
  transaction: Prisma.TransactionClient,
  fantasyTeamId: string,
) {
  const matchday = await ensureCurrentMatchday(transaction);
  await transaction.fantasyLineupConfirmation.deleteMany({
    where: { fantasyTeamId, matchdayId: matchday.id },
  });
  return matchday;
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

function assertRosterValid(
  selections: Array<{ role: string; status: string }>,
  delta?: {
    removed?: { role: string; status: string } | null;
    added?: { role: string; status: string } | null;
  },
) {
  const working = selections.map((selection) => ({ ...selection }));
  if (delta?.removed) {
    const index = working.findIndex(
      (selection) =>
        selection.role === delta.removed!.role && selection.status === delta.removed!.status,
    );
    if (index >= 0) working.splice(index, 1);
  }
  if (delta?.added) working.push(delta.added);

  const validation = validateRosterPlayers(working, { requireCaptain: false });
  if (!validation.valid) {
    throw new AppError("BAD_REQUEST", validation.message ?? "Rosa non valida.", 400);
  }
}

export async function buyPlayer(userId: string, playerId: string, replacementPlayerId: string) {
  await assertMarketOpen();

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const team = await transaction.fantasyTeam.findUnique({
          where: { userId },
          include: { players: { include: { player: { select: { fantasyValue: true } } } } },
        });
        if (!team) {
          throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);
        }
        const replacement = team.players.find(
          (selection) => selection.playerId === replacementPlayerId,
        );
        if (!replacement) {
          throw new AppError("BAD_REQUEST", "Seleziona il giocatore da sostituire.", 400);
        }
        if (
          playerId === replacementPlayerId ||
          team.players.some((selection) => selection.playerId === playerId)
        ) {
          throw new AppError("CONFLICT", "Il giocatore è già in rosa.", 409);
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
        await transaction.fantasyLineupConfirmation.deleteMany({
          where: { fantasyTeamId: team.id, matchdayId: matchday.id },
        });
        const transferCount = getTransfersUsed(transfers.freeTransfers, transfers.paidTransfers);
        const { total: cost, fee: transferFee, isFree } = getRealTransferCost(
          player.fantasyValue,
          transferCount,
        );
        const saleCredit = replacement.player.fantasyValue;
        const budgetDelta = cost - saleCredit;

        if (team.budgetLp < budgetDelta) {
          throw new AppError(
          "BAD_REQUEST",
          transferFee > 0
            ? `Budget LP insufficiente. Costo reale: ${cost} LP (valore ${player.fantasyValue} + commissione ${transferFee}).`
            : "Budget LP insufficiente.",
          400,
        );
        }

        if (replacement.role !== role) {
          throw new AppError("BAD_REQUEST", "Il sostituto deve avere lo stesso ruolo.", 400);
        }
        assertRosterValid(team.players, {
          removed: { role: replacement.role, status: replacement.status },
          added: { role, status: replacement.status },
        });

        const wasCaptain = replacement.isCaptain;
        await transaction.fantasyTeamPlayer.delete({ where: { id: replacement.id } });
        await transaction.fantasyTeamPlayer.create({
          data: {
            fantasyTeamId: team.id,
            playerId,
            role,
            status: replacement.status,
            benchOrder: replacement.benchOrder,
            purchaseCost: player.fantasyValue,
            isCaptain: wasCaptain && replacement.status === "STARTER",
          },
        });
        await transaction.fantasyTeam.update({
          where: { id: team.id },
          data: { budgetLp: { decrement: budgetDelta } },
        });
        await transaction.fantasyTeamTransfer.update({
          where: { id: transfers.id },
          data: {
            freeTransfers: { increment: isFree ? 1 : 0 },
            paidTransfers: { increment: isFree ? 0 : 1 },
          },
        });

        logger.info({ userId, playerId, cost, free: isFree }, "Market buy completed");
        await recordMarketActivity(`Ha sostituito un giocatore con ${playerId} sul mercato`);
        return { budgetLp: team.budgetLp - budgetDelta, free: isFree, replacementPlayerId };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw error;
  }
}

export async function sellPlayer(userId: string, playerId: string, replacementPlayerId: string) {
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
      if (
        !replacementPlayerId ||
        replacementPlayerId === playerId ||
        team.players.some((item) => item.playerId === replacementPlayerId)
      ) {
        throw new AppError("BAD_REQUEST", "Seleziona un nuovo giocatore disponibile.", 400);
      }

      const player = await transaction.teamMember.findUnique({
        where: { id: playerId },
        select: { fantasyValue: true },
      });
      if (!player) {
        throw new AppError("NOT_FOUND", "Giocatore non trovato.", 404);
      }

      const replacement = await transaction.teamMember.findFirst({
        where: { id: replacementPlayerId, role: "PLAYER", leftAt: null, user: { deletedAt: null } },
        select: { id: true, fantasyRole: true, fantasyValue: true },
      });
      if (!replacement) {
        throw new AppError("NOT_FOUND", "Nuovo giocatore non disponibile.", 404);
      }
      if (replacement.fantasyRole !== selection.role) {
        throw new AppError("BAD_REQUEST", "Il sostituto deve avere lo stesso ruolo.", 400);
      }
      assertRosterValid(team.players, {
        removed: { role: selection.role, status: selection.status },
        added: { role: replacement.fantasyRole, status: selection.status },
      });

      const matchday = await ensureCurrentMatchday(transaction);
      const transfers = await ensureTransfers(transaction, team.id, matchday.id);
      await transaction.fantasyLineupConfirmation.deleteMany({
        where: { fantasyTeamId: team.id, matchdayId: matchday.id },
      });
      const transferCount = getTransfersUsed(transfers.freeTransfers, transfers.paidTransfers);
      const breakdown = getRealTransferCost(replacement.fantasyValue, transferCount);
      const isFree = breakdown.isFree;
      const budgetDelta = getNetTransferCost(
        replacement.fantasyValue,
        player.fantasyValue,
        transferCount,
      );
      if (team.budgetLp < budgetDelta) {
        throw new AppError("BAD_REQUEST", "Budget LP insufficiente.", 400);
      }

      await transaction.fantasyTeamPlayer.delete({ where: { id: selection.id } });
      await transaction.fantasyTeamPlayer.create({
        data: {
          fantasyTeamId: team.id,
          playerId: replacement.id,
          role: selection.role,
          status: selection.status,
          benchOrder: selection.benchOrder,
          purchaseCost: replacement.fantasyValue,
          isCaptain: selection.isCaptain && selection.status === "STARTER",
        },
      });
      await transaction.fantasyTeam.update({
        where: { id: team.id },
        data: { budgetLp: { decrement: budgetDelta } },
      });
      await transaction.fantasyTeamTransfer.update({
        where: { id: transfers.id },
        data: {
          freeTransfers: { increment: isFree ? 1 : 0 },
          paidTransfers: { increment: isFree ? 0 : 1 },
        },
      });

      await recordMarketActivity(
        `Ha sostituito un giocatore con ${replacementPlayerId} sul mercato`,
      );
      logger.info({ userId, playerId, replacementPlayerId, free: isFree }, "Market sell completed");
      return { budgetLp: team.budgetLp - budgetDelta, free: isFree, replacementPlayerId };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/**
 * Opens a temporary role-preserving slot. The transfer is counted when the slot
 * is filled, matching the single-change accounting used by the existing market.
 */
export async function sellPlayerToVacancy(userId: string, playerId: string) {
  await assertMarketOpen();

  return prisma.$transaction(
    async (transaction) => {
      const team = await transaction.fantasyTeam.findUnique({
        where: { userId },
        include: {
          players: { include: { player: { select: { fantasyValue: true } } } },
          lineupVacancies: true,
        },
      });
      if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);
      if (team.lineupVacancies.length > 0) {
        throw new AppError(
          "CONFLICT",
          "Completa prima lo slot vuoto già aperto nella tua formazione.",
          409,
        );
      }

      const selection = team.players.find((item) => item.playerId === playerId);
      if (!selection) throw new AppError("NOT_FOUND", "Giocatore non in rosa.", 404);

      const matchday = await ensureCurrentMatchday(transaction);
      const transfers = await ensureTransfers(transaction, team.id, matchday.id);
      const transfersUsed = getTransfersUsed(transfers.freeTransfers, transfers.paidTransfers);
      const marketPlayers = await transaction.teamMember.findMany({
        where: {
          role: "PLAYER",
          leftAt: null,
          user: { deletedAt: null },
          fantasyRole: selection.role,
        },
        select: { id: true, fantasyRole: true, fantasyValue: true },
      });
      const sellDecision = evaluateSellToVacancy({
        selling: {
          playerId: selection.playerId,
          role: selection.role,
          status: selection.status,
          value: selection.player.fantasyValue,
        },
        squad: team.players.map((member) => ({
          playerId: member.playerId,
          role: member.role,
          status: member.status,
          value: member.player.fantasyValue,
        })),
        marketPlayers: marketPlayers.map((player) => ({
          id: player.id,
          role: player.fantasyRole,
          fantasyValue: player.fantasyValue,
        })),
        budgetLp: team.budgetLp,
        transfersUsed,
      });
      if (!sellDecision.allowed) {
        throw new AppError("BAD_REQUEST", sellDecision.message, 400);
      }

      await transaction.fantasyTeamPlayer.delete({ where: { id: selection.id } });
      const vacancy = await transaction.fantasyLineupVacancy.create({
        data: {
          fantasyTeamId: team.id,
          role: selection.role,
          status: selection.status,
          benchOrder: selection.benchOrder,
        },
      });
      await transaction.fantasyTeam.update({
        where: { id: team.id },
        data: { budgetLp: { increment: selection.player.fantasyValue } },
      });
      await clearCurrentLineupConfirmation(transaction, team.id);

      logger.info({ userId, playerId, vacancyId: vacancy.id }, "Market sale opened lineup vacancy");
      return { vacancyId: vacancy.id, budgetLp: team.budgetLp + selection.player.fantasyValue };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function buyPlayerIntoVacancy(userId: string, playerId: string, vacancyId: string) {
  await assertMarketOpen();

  return prisma.$transaction(
    async (transaction) => {
      const team = await transaction.fantasyTeam.findUnique({
        where: { userId },
        include: { players: true, lineupVacancies: true },
      });
      if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);

      const vacancy = team.lineupVacancies.find((item) => item.id === vacancyId);
      if (!vacancy) throw new AppError("NOT_FOUND", "Slot vuoto non trovato.", 404);
      if (team.players.some((selection) => selection.playerId === playerId)) {
        throw new AppError("CONFLICT", "Il giocatore è già in rosa.", 409);
      }

      const player = await transaction.teamMember.findFirst({
        where: { id: playerId, role: "PLAYER", leftAt: null, user: { deletedAt: null } },
        select: { id: true, fantasyRole: true, fantasyValue: true },
      });
      if (!player) throw new AppError("NOT_FOUND", "Giocatore non disponibile.", 404);
      if (player.fantasyRole !== vacancy.role) {
        throw new AppError("BAD_REQUEST", "Il giocatore deve avere il ruolo dello slot.", 400);
      }

      const matchday = await ensureCurrentMatchday(transaction);
      const transfers = await ensureTransfers(transaction, team.id, matchday.id);
      const transferCount = getTransfersUsed(transfers.freeTransfers, transfers.paidTransfers);
      const { total: cost, fee: transferFee, isFree } = getRealTransferCost(
        player.fantasyValue,
        transferCount,
      );
      if (team.budgetLp < cost) {
        throw new AppError(
          "BAD_REQUEST",
          transferFee > 0
            ? `Budget LP insufficiente. Costo reale: ${cost} LP (valore ${player.fantasyValue} + commissione ${transferFee}).`
            : "Budget LP insufficiente.",
          400,
        );
      }

      await transaction.fantasyLineupVacancy.delete({ where: { id: vacancy.id } });
      await transaction.fantasyTeamPlayer.create({
        data: {
          fantasyTeamId: team.id,
          playerId: player.id,
          role: vacancy.role,
          status: vacancy.status,
          benchOrder: vacancy.benchOrder,
          purchaseCost: player.fantasyValue,
          isCaptain: false,
        },
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
      await transaction.fantasyLineupConfirmation.deleteMany({
        where: { fantasyTeamId: team.id, matchdayId: matchday.id },
      });

      await recordMarketActivity(`Ha acquistato ${playerId} per completare la formazione`);
      logger.info({ userId, playerId, vacancyId, free: isFree }, "Market vacancy buy completed");
      return { budgetLp: team.budgetLp - cost, free: isFree, vacancyId };
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
    const target = team.players.find((selection) => selection.playerId === playerId);
    if (!target || target.status !== "STARTER") {
      throw new AppError("BAD_REQUEST", "Il capitano deve essere un titolare.", 400);
    }

    await clearCurrentLineupConfirmation(transaction, team.id);
    await transaction.fantasyTeamPlayer.updateMany({
      where: { fantasyTeamId: team.id },
      data: { isCaptain: false },
    });
    await transaction.fantasyTeamPlayer.update({
      where: { fantasyTeamId_playerId: { fantasyTeamId: team.id, playerId } },
      data: { isCaptain: true },
    });

    await recordMarketActivity("Ha cambiato capitano nella sua squadra fantasy");
    logger.info({ userId, teamId: team.id, playerId }, "Market captain changed");
    return { captainId: playerId };
  });
}

export async function getMarketDashboard(userId: string): Promise<MarketDashboardDto> {
  const status = await getMarketStatus();
  const round = getMatchdayRound(status.nextKickoff ?? new Date());
  const team = await getFantasyTeamWithSquad(userId, round);
  const confirmation = team
    ? await prisma.fantasyLineupConfirmation.findFirst({
        where: { fantasyTeamId: team.id, matchday: { round } },
        select: { confirmedAt: true },
      })
    : null;

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
    lineup: { round, confirmedAt: confirmation?.confirmedAt.toISOString() ?? null },
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

export async function getFantasyTeamWithSquad(userId: string, round?: number) {
  const team = await prisma.fantasyTeam.findUnique({
    where: { userId },
    include: {
      players: {
        include: {
          player: {
            select: {
              fantasyValue: true,
              fantasyStat: { select: { totalPoints: true } },
              user: { select: { name: true, surname: true } },
              team: { select: { school: { select: { shortName: true } } } },
            },
          },
        },
      },
      lineupVacancies: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!team) return null;

  let freeTransfers = 0;
  let paidTransfers = 0;
  if (round != null) {
    const matchday = await prisma.fantasyMatchday.findUnique({
      where: { round },
      select: { id: true },
    });
    if (matchday) {
      const current = await prisma.fantasyTeamTransfer.findUnique({
        where: {
          fantasyTeamId_matchdayId: { fantasyTeamId: team.id, matchdayId: matchday.id },
        },
        select: { freeTransfers: true, paidTransfers: true },
      });
      freeTransfers = current?.freeTransfers ?? 0;
      paidTransfers = current?.paidTransfers ?? 0;
    }
  }

  return {
    id: team.id,
    name: team.name,
    budgetLp: team.budgetLp,
    totalPoints: team.totalPoints,
    freeTransfers,
    paidTransfers,
    squad: team.players.map((selection) => ({
      id: selection.id,
      playerId: selection.playerId,
      name:
        [selection.player.user.name, selection.player.user.surname].filter(Boolean).join(" ") ||
        "Giocatore",
      school: selection.player.team.school.shortName,
      role: selection.role,
      status: selection.status,
      benchOrder: selection.benchOrder,
      isCaptain: selection.isCaptain,
      value: selection.player.fantasyValue,
      totalPoints: selection.player.fantasyStat?.totalPoints ?? 0,
    })),
    vacancies: team.lineupVacancies.map((vacancy) => ({
      id: vacancy.id,
      role: vacancy.role,
      status: vacancy.status,
      benchOrder: vacancy.benchOrder,
    })),
  };
}
