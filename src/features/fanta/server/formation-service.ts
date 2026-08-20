import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";
import { validateEditableLineup, validateRosterPlayers } from "../lib/lineup-validation";
import {
  clearCurrentLineupConfirmation,
  ensureCurrentMatchday,
  getMarketStatus,
} from "./market-service";

async function assertMarketOpen() {
  const status = await getMarketStatus();
  if (!status.open) {
    throw new AppError("FORBIDDEN", "Il mercato è chiuso. Formazione bloccata.", 403);
  }
}

function assertLineupShape(
  players: Array<{ role: string; status: string; isCaptain: boolean; playerId: string }>,
) {
  const validation = validateRosterPlayers(players, { requireCaptain: true });
  if (!validation.valid) {
    throw new AppError("BAD_REQUEST", validation.message ?? "Formazione non valida.", 400);
  }
}

/** Swap a starter with the same-role bench player. Does not consume a market transfer. */
export async function swapStarterWithBench(
  userId: string,
  starterPlayerId: string,
  benchPlayerId: string,
) {
  await assertMarketOpen();
  return prisma.$transaction(async (tx) => {
    const team = await tx.fantasyTeam.findUnique({
      where: { userId },
      include: { players: true },
    });
    if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);

    const starter = team.players.find(
      (player) => player.playerId === starterPlayerId && player.status === "STARTER",
    );
    const bench = team.players.find(
      (player) => player.playerId === benchPlayerId && player.status === "BENCH",
    );
    if (!starter || !bench) {
      throw new AppError("BAD_REQUEST", "Seleziona un titolare e una riserva validi.", 400);
    }
    if (starter.role !== bench.role) {
      throw new AppError("BAD_REQUEST", "Titolare e riserva devono avere lo stesso ruolo.", 400);
    }

    const benchOrder = bench.benchOrder;
    const starterWasCaptain = starter.isCaptain;

    await tx.fantasyTeamPlayer.update({
      where: { id: starter.id },
      data: { status: "BENCH", benchOrder, isCaptain: false },
    });
    await tx.fantasyTeamPlayer.update({
      where: { id: bench.id },
      data: {
        status: "STARTER",
        benchOrder: null,
        isCaptain: starterWasCaptain,
      },
    });

    await clearCurrentLineupConfirmation(tx, team.id);
    const updated = await tx.fantasyTeam.findUniqueOrThrow({
      where: { id: team.id },
      include: { players: true },
    });
    assertLineupShape(updated.players);
    return updated;
  });
}

/** Reorder the current bench. Does not consume a market transfer. */
export async function reorderBench(userId: string, orderedBenchPlayerIds: string[]) {
  await assertMarketOpen();
  if (
    orderedBenchPlayerIds.length < 1 ||
    new Set(orderedBenchPlayerIds).size !== orderedBenchPlayerIds.length
  ) {
    throw new AppError("BAD_REQUEST", "Specifica l'ordine delle riserve attuali.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const team = await tx.fantasyTeam.findUnique({
      where: { userId },
      include: { players: true },
    });
    if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);

    const bench = team.players.filter((player) => player.status === "BENCH");
    if (orderedBenchPlayerIds.length !== bench.length) {
      throw new AppError("BAD_REQUEST", "L'ordine deve includere tutte le riserve attuali.", 400);
    }
    const benchIds = new Set(bench.map((player) => player.playerId));
    if (orderedBenchPlayerIds.some((id) => !benchIds.has(id))) {
      throw new AppError("BAD_REQUEST", "L'ordine deve includere solo le riserve attuali.", 400);
    }

    for (let index = 0; index < orderedBenchPlayerIds.length; index += 1) {
      const selection = bench.find((player) => player.playerId === orderedBenchPlayerIds[index]);
      if (!selection) continue;
      await tx.fantasyTeamPlayer.update({
        where: { id: selection.id },
        data: { benchOrder: index },
      });
    }

    await clearCurrentLineupConfirmation(tx, team.id);
    return tx.fantasyTeam.findUniqueOrThrow({
      where: { id: team.id },
      include: { players: { orderBy: [{ status: "asc" }, { benchOrder: "asc" }] } },
    });
  });
}

/** Promotes a compatible reserve into a temporary starter slot after a sale. */
export async function promoteBenchToVacancy(
  userId: string,
  benchPlayerId: string,
  vacancyId: string,
) {
  await assertMarketOpen();

  return prisma.$transaction(async (tx) => {
    const team = await tx.fantasyTeam.findUnique({
      where: { userId },
      include: { players: true, lineupVacancies: true },
    });
    if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);

    const vacancy = team.lineupVacancies.find((item) => item.id === vacancyId);
    const bench = team.players.find(
      (player) => player.playerId === benchPlayerId && player.status === "BENCH",
    );
    if (!vacancy || vacancy.status !== "STARTER" || !bench) {
      throw new AppError("BAD_REQUEST", "Seleziona una riserva e uno slot titolare validi.", 400);
    }
    if (vacancy.role !== bench.role) {
      throw new AppError("BAD_REQUEST", "La riserva deve avere il ruolo dello slot.", 400);
    }

    await tx.fantasyTeamPlayer.update({
      where: { id: bench.id },
      data: { status: "STARTER", benchOrder: null },
    });
    await tx.fantasyLineupVacancy.delete({ where: { id: vacancy.id } });
    await tx.fantasyLineupVacancy.create({
      data: {
        fantasyTeamId: team.id,
        role: bench.role,
        status: "BENCH",
        benchOrder: bench.benchOrder,
      },
    });
    await clearCurrentLineupConfirmation(tx, team.id);

    return tx.fantasyTeam.findUniqueOrThrow({
      where: { id: team.id },
      include: { players: true, lineupVacancies: true },
    });
  });
}

/** Persists the current complete lineup for the active matchday. */
export async function confirmFormation(userId: string) {
  await assertMarketOpen();

  return prisma.$transaction(async (tx) => {
    const team = await tx.fantasyTeam.findUnique({
      where: { userId },
      include: { players: true, lineupVacancies: true },
    });
    if (!team) throw new AppError("NOT_FOUND", "Squadra fantasy non trovata.", 404);

    const validation = validateEditableLineup(team.players, team.lineupVacancies);
    if (!validation.valid) {
      throw new AppError("BAD_REQUEST", validation.message ?? "Formazione non valida.", 400);
    }

    const matchday = await ensureCurrentMatchday(tx);
    return tx.fantasyLineupConfirmation.upsert({
      where: { fantasyTeamId_matchdayId: { fantasyTeamId: team.id, matchdayId: matchday.id } },
      create: { fantasyTeamId: team.id, matchdayId: matchday.id },
      update: { confirmedAt: new Date() },
    });
  });
}
