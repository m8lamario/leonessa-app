import { Prisma, type MatchStatus as PrismaMatchStatus } from "@prisma/client";

import { settleDuePredictions } from "@/features/predictions/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { LeonessaMatchesService } from "../services/LeonessaMatchesService";
import type { Match, Team } from "../types";
import { processFinishedMatches } from "./ranking-engine";

export const LEONESSA_CUP_SLUG = "leonessa-cup";
export const LEONESSA_CUP_NAME = "Leonessa Cup";

const matchesService = new LeonessaMatchesService();

type PersistedSync = {
  competitionId: string;
  teamsUpdated: number;
  matchesUpdated: number;
};

function toPrismaMatchStatus(status: Match["status"]): PrismaMatchStatus {
  switch (status) {
    case "live":
      return "LIVE";
    case "completed":
      return "FINISHED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "SCHEDULED";
  }
}

function getSeason(date: Date) {
  const year = date.getUTCFullYear();
  const seasonStartYear = date.getUTCMonth() >= 7 ? year : year - 1;
  return `${seasonStartYear}-${seasonStartYear + 1}`;
}

function getCompetitionStatus(matches: Match[]): "ACTIVE" | "COMPLETED" {
  return matches.some((match) => match.status !== "completed" && match.status !== "cancelled")
    ? "ACTIVE"
    : "COMPLETED";
}

function collectTeams(matches: Match[]) {
  const teams = new Map<string, Team>();

  for (const match of matches) {
    teams.set(match.homeTeam.id, match.homeTeam);
    teams.set(match.awayTeam.id, match.awayTeam);
  }

  return [...teams.values()];
}

function getSchoolAliases(team: Team) {
  const name = team.name.toLocaleLowerCase("it-IT");
  const aliases = [team.shortName];

  if (name.includes("calini")) {
    aliases.push("CALINI");
  }

  if (name.includes("copernico")) {
    aliases.push("COPERNICO");
  }

  if (name.includes("arnaldo")) {
    aliases.push("ARNALDO");
  }

  if (name.includes("castelli")) {
    aliases.push("CASTELLI");
  }

  return [...new Set(aliases)];
}

async function findSchool(transaction: Prisma.TransactionClient, team: Team) {
  return transaction.school.findFirst({
    where: {
      OR: [
        { eslId: team.id },
        { name: team.name },
        ...getSchoolAliases(team).map((shortName) => ({ shortName })),
      ],
    },
  });
}

async function upsertSchool(transaction: Prisma.TransactionClient, team: Team) {
  const existing = await findSchool(transaction, team);

  if (existing) {
    return transaction.school.update({
      where: { id: existing.id },
      data: {
        eslId: team.id,
        logoUrl: team.logoUrl ?? existing.logoUrl,
        deletedAt: null,
      },
    });
  }

  return transaction.school.create({
    data: {
      eslId: team.id,
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      deletedAt: null,
    },
  });
}

async function upsertTeam(
  transaction: Prisma.TransactionClient,
  competitionId: string,
  team: Team,
  schoolId: string,
) {
  const existing = await transaction.team.findFirst({
    where: {
      competitionId,
      OR: [{ eslId: team.id }, { name: team.name }],
    },
  });
  const data = {
    eslId: team.id,
    competitionId,
    schoolId,
    name: team.name,
    deletedAt: null,
  };

  return existing
    ? transaction.team.update({ where: { id: existing.id }, data })
    : transaction.team.create({ data });
}

async function alertAdmins(
  transaction: Prisma.TransactionClient,
  input: {
    eslId: string;
    previousScore: [number, number];
    receivedScore: [number, number];
  },
) {
  const admins = await transaction.user.findMany({
    where: {
      deletedAt: null,
      roles: {
        some: {
          role: "ADMIN",
          revokedAt: null,
        },
      },
    },
    select: { id: true },
  });

  for (const admin of admins) {
    await transaction.notification.create({
      data: {
        userId: admin.id,
        type: "COMPETITION",
        title: "Risultato ESL aggiornato",
        body: `La partita ESL ${input.eslId} è cambiata da ${input.previousScore.join(
          " - ",
        )} a ${input.receivedScore.join(" - ")} dopo l'elaborazione del ranking.`,
        linkUrl: "/ranking",
        sentAt: new Date(),
      },
    });
  }
}

async function syncMatchEvents(
  transaction: Prisma.TransactionClient,
  matchId: string,
  events: Match["events"],
) {
  const playerEslIds = events
    .map((event) => event.playerEslId)
    .filter((id): id is string => id !== null);
  const players = await transaction.teamMember.findMany({
    where: {
      OR: [
        { eslId: { in: playerEslIds } },
        { team: { eslId: { in: [...new Set(events.map((event) => event.teamEslId))] } } },
      ],
    },
    select: {
      id: true,
      eslId: true,
      team: { select: { eslId: true } },
      user: { select: { name: true, surname: true } },
    },
  });
  const playerIds = new Map(
    players
      .filter((player) => player.eslId !== null)
      .map((player) => [player.eslId!, player.id] as const),
  );
  const normalizeName = (value: string | null) => value?.trim().toLocaleLowerCase("it-IT") ?? "";
  const getPlayerId = (event: Match["events"][number]) => {
    if (event.playerEslId && playerIds.has(event.playerEslId)) {
      return playerIds.get(event.playerEslId) ?? null;
    }

    return (
      players.find(
        (player) =>
          player.team.eslId === event.teamEslId &&
          normalizeName(player.user.name) === normalizeName(event.playerFirstName) &&
          normalizeName(player.user.surname) === normalizeName(event.playerLastName),
      )?.id ?? null
    );
  };

  for (const event of events) {
    await transaction.matchEvent.upsert({
      where: { eslId: event.id },
      create: {
        eslId: event.id,
        matchId,
        type: event.type,
        minute: event.minute,
        playerId: getPlayerId(event),
      },
      update: {
        matchId,
        type: event.type,
        minute: event.minute,
        playerId: getPlayerId(event),
      },
    });
  }
}

async function persistSync(matches: Match[]): Promise<PersistedSync> {
  const dates = matches.map((match) => new Date(match.kickoff));
  const startDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const endDate = new Date(Math.max(...dates.map((date) => date.getTime())));
  const season = getSeason(startDate);
  const sourceTeams = collectTeams(matches);

  return prisma.$transaction(
    async (transaction) => {
      const competition = await transaction.competition.upsert({
        where: { slug: LEONESSA_CUP_SLUG },
        update: {
          name: LEONESSA_CUP_NAME,
          season,
          status: getCompetitionStatus(matches),
          startDate,
          endDate,
          deletedAt: null,
        },
        create: {
          name: LEONESSA_CUP_NAME,
          slug: LEONESSA_CUP_SLUG,
          season,
          status: getCompetitionStatus(matches),
          startDate,
          endDate,
        },
      });
      const teamIds = new Map<string, string>();

      for (const sourceTeam of sourceTeams) {
        const school = await upsertSchool(transaction, sourceTeam);
        const team = await upsertTeam(transaction, competition.id, sourceTeam, school.id);
        teamIds.set(sourceTeam.id, team.id);
      }

      let matchesUpdated = 0;

      for (const sourceMatch of matches) {
        const homeTeamId = teamIds.get(sourceMatch.homeTeam.id);
        const awayTeamId = teamIds.get(sourceMatch.awayTeam.id);

        if (!homeTeamId || !awayTeamId) {
          throw new Error(`Teams missing while syncing ESL match ${sourceMatch.id}.`);
        }

        const existing = await transaction.match.findUnique({
          where: { eslId: sourceMatch.id },
        });
        const matchData = {
          eslId: sourceMatch.id,
          competitionId: competition.id,
          homeTeamId,
          awayTeamId,
          venue: sourceMatch.venue?.name ?? null,
          startAt: new Date(sourceMatch.kickoff),
          status: toPrismaMatchStatus(sourceMatch.status),
          homeScore: sourceMatch.homeScore ?? 0,
          awayScore: sourceMatch.awayScore ?? 0,
          deletedAt: null,
        };

        if (
          existing?.rankingProcessed &&
          (existing.homeScore !== matchData.homeScore || existing.awayScore !== matchData.awayScore)
        ) {
          const previousScore: [number, number] = [existing.homeScore, existing.awayScore];
          const receivedScore: [number, number] = [matchData.homeScore, matchData.awayScore];

          logger.warn(
            {
              eslId: sourceMatch.id,
              matchId: existing.id,
              previousScore,
              receivedScore,
            },
            "Match already processed",
          );
          await alertAdmins(transaction, {
            eslId: sourceMatch.id,
            previousScore,
            receivedScore,
          });
        }

        const persistedMatch = existing
          ? await transaction.match.update({ where: { id: existing.id }, data: matchData })
          : await transaction.match.create({ data: matchData });

        await syncMatchEvents(transaction, persistedMatch.id, sourceMatch.events);
        matchesUpdated += 1;
      }

      return {
        competitionId: competition.id,
        teamsUpdated: sourceTeams.length,
        matchesUpdated,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export type SyncResult = PersistedSync & {
  matchesRetrieved: number;
  rankingProcessed: number;
};

export async function syncLeonessaCup(): Promise<SyncResult> {
  logger.info("Sync Started");
  const matches = await matchesService.getMatches({ useFallback: false });
  logger.info({ count: matches.length }, "Matches Retrieved");
  logger.info({ count: matches.length }, "Leonessa Matches Filtered");

  if (matches.length === 0) {
    logger.info("Sync Completed");
    return {
      competitionId: "",
      matchesRetrieved: 0,
      teamsUpdated: 0,
      matchesUpdated: 0,
      rankingProcessed: 0,
    };
  }

  const persisted = await persistSync(matches);
  logger.info({ count: persisted.teamsUpdated }, "Teams Updated");
  logger.info({ count: persisted.matchesUpdated }, "Matches Updated");
  const ranking = await processFinishedMatches(persisted.competitionId);
  await settleDuePredictions();
  logger.info("Sync Completed");

  return {
    ...persisted,
    matchesRetrieved: matches.length,
    rankingProcessed: ranking.processed,
  };
}
