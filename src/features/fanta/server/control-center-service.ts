import "server-only";

import { prisma } from "@/lib/prisma";
import { isSandboxMode } from "@/lib/sandbox";
import { AppError } from "@/utils/errors";

const SANDBOX_SLUG = "leonessa-cup-sandbox";

export const SCORING_RULES = {
  GOAL: 100,
  ASSIST: 50,
  YELLOW_CARD: -20,
  RED_CARD: -50,
  OWN_GOAL: -70,
  WIN: 20,
  DRAW: 5,
  CLEAN_SHEET: 30,
} as const;

export function assertControlCenterEnabled() {
  if (!isSandboxMode()) {
    throw new AppError("FORBIDDEN", "Fanta Control Center disponibile solo in Sandbox.", 403);
  }
}

export async function getControlOverview() {
  assertControlCenterEnabled();
  const competition = await prisma.competition.findUnique({ where: { slug: SANDBOX_SLUG } });
  const [matchdays, matches, players, fantasyTeams, scores, stats, lastProcessed] =
    await Promise.all([
      prisma.fantasyMatchday.count(),
      competition
        ? prisma.match.count({ where: { competitionId: competition.id, deletedAt: null } })
        : Promise.resolve(0),
      competition
        ? prisma.teamMember.count({
            where: { team: { competitionId: competition.id }, role: "PLAYER", leftAt: null },
          })
        : Promise.resolve(0),
      prisma.fantasyTeam.count(),
      prisma.fantasyScore.count(),
      prisma.fantasyPlayerStat.count(),
      prisma.fantasyProcessedMatch.findFirst({
        orderBy: { syncedAt: "desc" },
        select: { syncedAt: true },
      }),
    ]);
  const anomalies = await getAnomalies();
  return {
    sandbox: true,
    competition: competition ? { id: competition.id, name: competition.name } : null,
    counts: { matchdays, matches, players, fantasyTeams, scores, stats },
    lastScoring: lastProcessed?.syncedAt ?? null,
    health: {
      sandbox: Boolean(competition),
      scoring: anomalies.filter((a) => a.area === "scoring").length === 0,
      teams: anomalies.filter((a) => a.area === "teams").length === 0,
      ranking: true,
      market: true,
      profiles: true,
      social: true,
    },
    anomalies,
  };
}

export async function getMatchdays() {
  assertControlCenterEnabled();
  return prisma.fantasyMatchday.findMany({
    orderBy: { round: "desc" },
    include: { _count: { select: { scores: true } } },
  });
}

export async function getSandboxMatches() {
  assertControlCenterEnabled();
  const competition = await prisma.competition.findUnique({ where: { slug: SANDBOX_SLUG } });
  if (!competition) return [];
  return prisma.match.findMany({
    where: { competitionId: competition.id, deletedAt: null },
    orderBy: { startAt: "desc" },
    take: 100,
    include: {
      homeTeam: {
        select: {
          name: true,
          members: {
            where: { role: "PLAYER", leftAt: null },
            select: { id: true, user: { select: { name: true, surname: true } } },
          },
        },
      },
      awayTeam: {
        select: {
          name: true,
          members: {
            where: { role: "PLAYER", leftAt: null },
            select: { id: true, user: { select: { name: true, surname: true } } },
          },
        },
      },
      events: {
        include: { player: { include: { user: { select: { name: true, surname: true } } } } },
      },
    },
  });
}

export async function getMatchEvents(matchId: string) {
  assertControlCenterEnabled();
  const match = await getSandboxMatch(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Partita Sandbox non trovata.", 404);
  return match.events;
}

async function getSandboxMatch(matchId: string) {
  const competition = await prisma.competition.findUnique({
    where: { slug: SANDBOX_SLUG },
    select: { id: true },
  });
  if (!competition) return null;
  return prisma.match.findFirst({
    where: { id: matchId, competitionId: competition.id, deletedAt: null },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      events: {
        include: { player: { include: { user: { select: { name: true, surname: true } } } } },
      },
    },
  });
}

export async function createMatchEvent(input: {
  matchId: string;
  type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD" | "OWN_GOAL";
  playerId: string;
  minute: number;
}) {
  assertControlCenterEnabled();
  const match = await getSandboxMatch(input.matchId);
  if (!match) throw new AppError("NOT_FOUND", "Partita Sandbox non trovata.", 404);
  if (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 120) {
    throw new AppError("BAD_REQUEST", "Il minuto deve essere tra 0 e 120.", 400);
  }
  const player = await prisma.teamMember.findFirst({
    where: {
      id: input.playerId,
      teamId: { in: [match.homeTeamId, match.awayTeamId] },
      role: "PLAYER",
    },
    select: { id: true },
  });
  if (!player) throw new AppError("BAD_REQUEST", "Il giocatore non appartiene alla partita.", 400);
  return prisma.matchEvent.create({
    data: {
      matchId: input.matchId,
      type: input.type,
      playerId: input.playerId,
      minute: input.minute,
    },
  });
}

export async function updateMatchEvent(
  eventId: string,
  input: {
    type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD" | "OWN_GOAL";
    playerId: string;
    minute: number;
  },
) {
  assertControlCenterEnabled();
  const event = await prisma.matchEvent.findFirst({
    where: { id: eventId, match: { competition: { slug: SANDBOX_SLUG } } },
    include: { match: true },
  });
  if (!event) throw new AppError("NOT_FOUND", "Evento Sandbox non trovato.", 404);
  if (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 120)
    throw new AppError("BAD_REQUEST", "Il minuto deve essere tra 0 e 120.", 400);
  const player = await prisma.teamMember.findFirst({
    where: {
      id: input.playerId,
      teamId: { in: [event.match.homeTeamId, event.match.awayTeamId] },
      role: "PLAYER",
    },
    select: { id: true },
  });
  if (!player) throw new AppError("BAD_REQUEST", "Il giocatore non appartiene alla partita.", 400);
  return prisma.matchEvent.update({
    where: { id: eventId },
    data: {
      type: input.type,
      playerId: input.playerId,
      minute: input.minute,
    },
  });
}

export async function deleteMatchEvent(eventId: string) {
  assertControlCenterEnabled();
  const event = await prisma.matchEvent.findFirst({
    where: { id: eventId, match: { competition: { slug: SANDBOX_SLUG } } },
    select: { id: true },
  });
  if (!event) throw new AppError("NOT_FOUND", "Evento Sandbox non trovato.", 404);
  return prisma.matchEvent.delete({ where: { id: eventId } });
}

export async function getScoringInspector(matchId: string) {
  assertControlCenterEnabled();
  const match = await getSandboxMatch(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Partita Sandbox non trovata.", 404);
  const players = await prisma.teamMember.findMany({
    where: { teamId: { in: [match.homeTeamId, match.awayTeamId] }, role: "PLAYER", leftAt: null },
    include: {
      user: { select: { name: true, surname: true } },
      fantasyStat: true,
      fantasySelections: { select: { fantasyTeamId: true, isCaptain: true } },
    },
  });
  return {
    match: {
      id: match.id,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    },
    rules: SCORING_RULES,
    players: players.map((player) => {
      const events = match.events.filter((event) => event.playerId === player.id);
      const eventPoints = events.reduce(
        (sum, event) => sum + (SCORING_RULES[event.type as keyof typeof SCORING_RULES] ?? 0),
        0,
      );
      const isHome = player.teamId === match.homeTeamId;
      const ownScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;
      const resultPoints =
        ownScore > opponentScore
          ? SCORING_RULES.WIN
          : ownScore === opponentScore
            ? SCORING_RULES.DRAW
            : 0;
      const cleanSheet =
        opponentScore === 0 &&
        (player.fantasyRole === "PORTIERE" || player.fantasyRole === "DIFENSORE")
          ? SCORING_RULES.CLEAN_SHEET
          : 0;
      const basePoints = eventPoints + resultPoints + cleanSheet;
      const captainCount = player.fantasySelections.filter(
        (selection) => selection.isCaptain,
      ).length;
      return {
        playerId: player.id,
        name: [player.user.name, player.user.surname].filter(Boolean).join(" ") || "Giocatore",
        role: player.fantasyRole,
        events: events.map((event) => ({
          type: event.type,
          minute: event.minute,
          points: SCORING_RULES[event.type as keyof typeof SCORING_RULES] ?? 0,
        })),
        eventPoints,
        resultPoints,
        cleanSheet,
        basePoints,
        captainCount,
        finalPoints: captainCount > 0 ? Math.round(basePoints * 1.5) : basePoints,
        stat: player.fantasyStat,
      };
    }),
  };
}

export async function getPlayerInspector(playerId: string) {
  assertControlCenterEnabled();
  const player = await prisma.teamMember.findFirst({
    where: { id: playerId, team: { competition: { slug: SANDBOX_SLUG } } },
    include: {
      user: { select: { name: true, surname: true } },
      team: { include: { school: true } },
      fantasyStat: true,
      valueHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      fantasySelections: { include: { fantasyTeam: { select: { name: true } } } },
    },
  });
  if (!player) throw new AppError("NOT_FOUND", "Giocatore Sandbox non trovato.", 404);
  return player;
}

export async function getTeamInspector(teamId: string) {
  assertControlCenterEnabled();
  const team = await prisma.fantasyTeam.findUnique({
    where: { id: teamId },
    include: {
      user: { select: { name: true, surname: true } },
      players: {
        include: {
          player: {
            include: { user: { select: { name: true, surname: true } }, fantasyStat: true },
          },
        },
      },
      scores: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!team) throw new AppError("NOT_FOUND", "Fantasy Team non trovata.", 404);
  return team;
}

export async function getAnomalies() {
  const anomalies: Array<{ area: string; message: string; recordId?: string }> = [];
  const teams = await prisma.fantasyTeam.findMany({ include: { players: true } });
  for (const team of teams) {
    if (team.players.length !== 11)
      anomalies.push({
        area: "teams",
        message: `${team.name}: ${team.players.length} giocatori`,
        recordId: team.id,
      });
    if (team.players.filter((player) => player.isCaptain).length !== 1)
      anomalies.push({
        area: "teams",
        message: `${team.name}: capitano non valido`,
        recordId: team.id,
      });
    if (team.budgetLp < 0)
      anomalies.push({ area: "teams", message: `${team.name}: LP negativi`, recordId: team.id });
  }
  const selections = await prisma.fantasyTeamPlayer.findMany({ select: { playerId: true } });
  const missingStats = await prisma.teamMember.count({
    where: { id: { in: selections.map((selection) => selection.playerId) }, fantasyStat: null },
  });
  if (missingStats > 0)
    anomalies.push({
      area: "scoring",
      message: `${missingStats} giocatori senza FantasyPlayerStat`,
    });
  return anomalies;
}
