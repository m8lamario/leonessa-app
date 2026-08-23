import "server-only";

import { prisma } from "@/lib/prisma";
import { FORMATION_LIMITS } from "../constants/fanta";
import type { FantasyRole } from "../types";

export type PlayerProfileDto = {
  entryId: string;
  id: string;
  name: string;
  school: string;
  schoolName: string;
  roleLabel: string;
  role: FantasyRole;
  fantasyValue: number;
  jerseyNumber: number | null;
  schoolYear: string | null;
  avatarUrl: string | null;
  isVerifiedPlayer: boolean;
  isCurrentUser: boolean;
  avatarText: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
    totalPoints: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
  };
  badges: Array<{ key: string; label: string; icon: string }>;
  market: {
    ownedCount: number;
    ownedPercentage: number;
    initialValue: number;
    valueHistory: Array<{
      oldValue: number;
      newValue: number;
      reason: string | null;
      createdAt: string;
    }>;
  };
  performance: Array<{ matchday: string; points: number }>;
  recentMatches: Array<{
    id: string;
    opponent: string;
    result: string;
    playerPoints: number;
    startAt: string;
  }>;
  isRookie: boolean;
  positionRank: number | null;
  captainCount: number;
};

const fantasyRoles = Object.keys(FORMATION_LIMITS) as FantasyRole[];

const ROLE_LABELS: Record<string, string> = {
  PORTIERE: "Portiere",
  DIFENSORE: "Difensore",
  CENTROCAMPISTA: "Centrocampista",
  ATTACCANTE: "Attaccante",
};

const BASE_VALUES: Record<FantasyRole, number> = {
  PORTIERE: 20,
  DIFENSORE: 25,
  CENTROCAMPISTA: 30,
  ATTACCANTE: 35,
};

const EVENT_POINTS: Record<string, number> = {
  GOAL: 100,
  ASSIST: 50,
  YELLOW_CARD: -20,
  RED_CARD: -50,
  OWN_GOAL: -70,
};

type EntryRow = {
  id: string;
  teamId: string;
  fantasyRole: string;
  fantasyValue: number;
  jerseyNumber: number | null;
  schoolYear: string | null;
  avatarUrl: string | null;
  isVerifiedPlayer: boolean;
  userId: string;
  user: { name: string | null; surname: string | null };
  team: { school: { name: string; shortName: string } };
};

function playerPointsForMatch(
  match: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    events: Array<{ type: string }>;
  },
  entry: Pick<EntryRow, "teamId" | "fantasyRole">,
) {
  const isHome = match.homeTeamId === entry.teamId;
  const ownScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;
  let points = match.events.reduce((sum, event) => sum + (EVENT_POINTS[event.type] ?? 0), 0);

  if (ownScore > opponentScore) points += 20;
  if (ownScore === opponentScore) points += 5;
  if (
    opponentScore === 0 &&
    (entry.fantasyRole === "PORTIERE" || entry.fantasyRole === "DIFENSORE")
  ) {
    points += 30;
  }

  return points;
}

function countCleanSheets(
  teamId: string,
  fantasyRole: string,
  matches: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }>,
) {
  if (fantasyRole !== "PORTIERE" && fantasyRole !== "DIFENSORE") return 0;
  return matches.filter((match) => {
    const opponentScore = match.homeTeamId === teamId ? match.awayScore : match.homeScore;
    return opponentScore === 0;
  }).length;
}

function buildBadges(input: {
  isVerifiedPlayer: boolean;
  matches: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  ownedPercentage: number;
}) {
  const badges: PlayerProfileDto["badges"] = [];

  if (input.isVerifiedPlayer) {
    badges.push({ key: "verified", label: "Giocatore Verificato", icon: "badge-check" });
  }
  if (input.matches === 0) {
    badges.push({ key: "rookie", label: "Rookie", icon: "sparkles" });
  }
  if (input.goals > 0) {
    badges.push({ key: "bomber", label: "Bomber", icon: "goal" });
  }
  if (input.assists > 0) {
    badges.push({ key: "assistman", label: "Assist Man", icon: "target" });
  }
  if (input.cleanSheets > 0) {
    badges.push({ key: "wall", label: "Muro", icon: "brick-wall" });
  }
  if (input.ownedPercentage >= 25) {
    badges.push({ key: "hot", label: "Molto Scelto", icon: "flame" });
  } else if (input.ownedPercentage >= 10) {
    badges.push({ key: "popular", label: "Popolare", icon: "star" });
  }

  return badges;
}

async function buildProfile(
  entry: EntryRow,
  options: { viewerId?: string | null } = {},
): Promise<PlayerProfileDto> {
  const [stat, ownedCount, captainCount, valueHistory, matches] = await Promise.all([
    prisma.fantasyPlayerStat.findUnique({ where: { playerId: entry.id } }),
    prisma.fantasyTeamPlayer.count({ where: { playerId: entry.id } }),
    prisma.fantasyTeamPlayer.count({ where: { playerId: entry.id, isCaptain: true } }),
    prisma.fantasyPlayerValueHistory.findMany({
      where: { playerId: entry.id },
      orderBy: { createdAt: "asc" },
      select: { oldValue: true, newValue: true, reason: true, createdAt: true },
    }),
    prisma.match.findMany({
      where: {
        deletedAt: null,
        status: "FINISHED",
        OR: [{ homeTeamId: entry.teamId }, { awayTeamId: entry.teamId }],
      },
      include: {
        events: { where: { playerId: entry.id }, select: { type: true } },
        homeTeam: { select: { name: true, school: { select: { shortName: true } } } },
        awayTeam: { select: { name: true, school: { select: { shortName: true } } } },
      },
      orderBy: { startAt: "desc" },
      take: 12,
    }),
  ]);

  const cleanSheets = countCleanSheets(entry.teamId, entry.fantasyRole, matches);

  const allPoints = await prisma.fantasyPlayerStat.findMany({
    select: { playerId: true },
    orderBy: { totalPoints: "desc" },
  });
  const positionRank =
    stat && allPoints.some((row) => row.playerId === entry.id)
      ? allPoints.findIndex((row) => row.playerId === entry.id) + 1
      : null;

  const totalTeams = await prisma.fantasyTeam.count();
  const ownedPercentage = totalTeams > 0 ? (ownedCount / totalTeams) * 100 : 0;
  const matchesCount = stat?.matches ?? 0;
  const goals = stat?.goals ?? 0;
  const assists = stat?.assists ?? 0;

  const role = (
    fantasyRoles.includes(entry.fantasyRole as FantasyRole) ? entry.fantasyRole : "CENTROCAMPISTA"
  ) as FantasyRole;
  const name = [entry.user.name, entry.user.surname].filter(Boolean).join(" ") || "Giocatore";

  return {
    entryId: entry.id,
    id: entry.id,
    name,
    school: entry.team.school.shortName,
    schoolName: entry.team.school.name,
    roleLabel: ROLE_LABELS[role] ?? role,
    role,
    fantasyValue: entry.fantasyValue,
    jerseyNumber: entry.jerseyNumber,
    schoolYear: entry.schoolYear,
    avatarUrl: entry.avatarUrl,
    isVerifiedPlayer: entry.isVerifiedPlayer,
    isCurrentUser: options.viewerId != null && entry.userId === options.viewerId,
    avatarText: name.slice(0, 2).toUpperCase(),
    stats: {
      goals,
      assists,
      matches: matchesCount,
      totalPoints: stat?.totalPoints ?? 0,
      yellowCards: stat?.yellowCards ?? 0,
      redCards: stat?.redCards ?? 0,
      cleanSheets,
    },
    badges: buildBadges({
      isVerifiedPlayer: entry.isVerifiedPlayer,
      matches: matchesCount,
      goals,
      assists,
      cleanSheets,
      ownedPercentage,
    }),
    market: {
      ownedCount,
      ownedPercentage,
      initialValue: valueHistory[0]?.oldValue ?? BASE_VALUES[role],
      valueHistory: valueHistory.map((history) => ({
        oldValue: history.oldValue,
        newValue: history.newValue,
        reason: history.reason,
        createdAt: history.createdAt.toISOString(),
      })),
    },
    performance: matches.map((match) => ({
      matchday: new Date(match.startAt).toLocaleDateString("it-IT"),
      points: playerPointsForMatch(match, entry),
    })),
    recentMatches: matches.slice(0, 6).map((match) => {
      const isHome = match.homeTeamId === entry.teamId;
      const opponent = isHome
        ? (match.awayTeam.school?.shortName ?? match.awayTeam.name)
        : (match.homeTeam.school?.shortName ?? match.homeTeam.name);
      return {
        id: match.id,
        opponent,
        result: `${match.homeScore} - ${match.awayScore}`,
        playerPoints: playerPointsForMatch(match, entry),
        startAt: match.startAt.toISOString(),
      };
    }),
    isRookie: matchesCount === 0,
    positionRank,
    captainCount,
  };
}

export async function getPlayerProfile(
  playerId: string,
  viewerId?: string | null,
): Promise<PlayerProfileDto | null> {
  const entry = await prisma.teamMember.findFirst({
    where: { id: playerId, role: "PLAYER", leftAt: null },
    select: {
      id: true,
      teamId: true,
      fantasyRole: true,
      fantasyValue: true,
      jerseyNumber: true,
      schoolYear: true,
      avatarUrl: true,
      isVerifiedPlayer: true,
      userId: true,
      user: { select: { name: true, surname: true } },
      team: { select: { school: { select: { name: true, shortName: true } } } },
    },
  });
  if (!entry) return null;
  return buildProfile(entry, { viewerId: viewerId ?? null });
}

export async function getMyPlayerProfile(userId: string): Promise<PlayerProfileDto | null> {
  const entry = await prisma.teamMember.findFirst({
    where: { userId, role: "PLAYER", leftAt: null },
    select: {
      id: true,
      teamId: true,
      fantasyRole: true,
      fantasyValue: true,
      jerseyNumber: true,
      schoolYear: true,
      avatarUrl: true,
      isVerifiedPlayer: true,
      userId: true,
      user: { select: { name: true, surname: true } },
      team: { select: { school: { select: { name: true, shortName: true } } } },
    },
  });
  if (!entry) return null;
  return buildProfile(entry, { viewerId: userId });
}
