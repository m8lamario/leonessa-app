import "server-only";

import { LEONESSA_CUP_SLUG } from "@/features/cup/server";
import { prisma } from "@/lib/prisma";

import type {
  ExploreData,
  ExploreMatch,
  ExplorePlayer,
  ExploreSchool,
  ExploreSchoolTableRow,
  ExploreTeam,
  ExploreUserRank,
} from "../types/explore";

const PLAYER_ROLE_LABELS: Record<string, string> = {
  PORTIERE: "Portiere",
  DIFENSORE: "Difensore",
  CENTROCAMPISTA: "Centrocampista",
  ATTACCANTE: "Attaccante",
};

function fullName(name: string | null, surname: string | null, fallback: string) {
  return [name, surname].filter(Boolean).join(" ") || fallback;
}

function emptyExploreData(): ExploreData {
  return {
    schools: [],
    teams: [],
    players: [],
    matches: [],
    schoolTable: [],
    userLeaders: [],
    partnersAvailable: false,
  };
}

export async function getExploreData(
  userId: string,
  schoolId: string | null,
): Promise<ExploreData> {
  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
    select: { id: true },
  });

  if (!competition) {
    return emptyExploreData();
  }

  const [schools, teams, rankingRows, members, matches, topUsers] = await Promise.all([
    prisma.school.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true,
        supportBalance: { select: { points: true } },
      },
      orderBy: [{ supportBalance: { points: "desc" } }, { name: "asc" }],
    }),
    prisma.team.findMany({
      where: { competitionId: competition.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        schoolId: true,
        school: { select: { name: true, shortName: true, logoUrl: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.schoolRanking.findMany({
      where: { competitionId: competition.id },
      select: {
        schoolId: true,
        totalPoints: true,
        wins: true,
        draws: true,
        losses: true,
        matchesPlayed: true,
        school: { select: { name: true, shortName: true } },
      },
      orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
    }),
    prisma.teamMember.findMany({
      where: {
        role: "PLAYER",
        leftAt: null,
        user: { deletedAt: null },
        team: { competitionId: competition.id, deletedAt: null },
      },
      select: {
        id: true,
        fantasyRole: true,
        jerseyNumber: true,
        teamId: true,
        team: { select: { name: true, school: { select: { shortName: true } } } },
        user: { select: { name: true, surname: true } },
      },
      orderBy: [{ team: { name: "asc" } }, { jerseyNumber: "asc" }, { user: { surname: "asc" } }],
    }),
    prisma.match.findMany({
      where: { competitionId: competition.id, deletedAt: null },
      select: {
        id: true,
        startAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        venue: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.userLPBalance.findMany({
      where: { user: { deletedAt: null } },
      orderBy: [{ balance: "desc" }, { createdAt: "asc" }],
      take: 10,
      select: {
        balance: true,
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            school: { select: { shortName: true, name: true } },
          },
        },
      },
    }),
  ]);

  const rankingBySchoolId = new Map(rankingRows.map((row) => [row.schoolId, row]));
  const teamBySchoolId = new Map(teams.map((team) => [team.schoolId, team]));

  const exploreSchools: ExploreSchool[] = schools.map((school, index) => ({
    id: school.id,
    name: school.name,
    shortName: school.shortName,
    logoUrl: school.logoUrl,
    ssp: school.supportBalance?.points ?? 0,
    teamId: teamBySchoolId.get(school.id)?.id ?? null,
    isCurrentSchool: school.id === schoolId,
    rank: index + 1,
  }));

  const exploreTeams: ExploreTeam[] = teams.map((team) => {
    const ranking = rankingBySchoolId.get(team.schoolId);
    return {
      id: team.id,
      name: team.name,
      schoolId: team.schoolId,
      schoolName: team.school.name,
      schoolShortName: team.school.shortName,
      logoUrl: team.school.logoUrl,
      points: ranking?.totalPoints ?? 0,
      wins: ranking?.wins ?? 0,
      draws: ranking?.draws ?? 0,
      losses: ranking?.losses ?? 0,
      matchesPlayed: ranking?.matchesPlayed ?? 0,
      isCurrentTeam: team.schoolId === schoolId,
    };
  });

  const players: ExplorePlayer[] = members.map((member) => ({
    id: member.id,
    name: fullName(member.user.name, member.user.surname, "Giocatore"),
    school: member.team.school.shortName,
    teamId: member.teamId,
    teamName: member.team.name,
    role: member.fantasyRole,
    roleLabel: PLAYER_ROLE_LABELS[member.fantasyRole] ?? member.fantasyRole,
    jerseyNumber: member.jerseyNumber,
  }));

  const exploreMatches: ExploreMatch[] = matches.map((match) => {
    const scored = match.status === "LIVE" || match.status === "FINISHED";
    return {
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: scored ? match.homeScore : null,
      awayScore: scored ? match.awayScore : null,
      startAt: match.startAt.toISOString(),
      status: match.status,
      venue: match.venue,
    };
  });

  const schoolTable: ExploreSchoolTableRow[] = rankingRows.map((row, index) => ({
    rank: index + 1,
    schoolId: row.schoolId,
    name: row.school.name,
    shortName: row.school.shortName,
    teamId: teamBySchoolId.get(row.schoolId)?.id ?? null,
    points: row.totalPoints,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    matchesPlayed: row.matchesPlayed,
    isCurrentSchool: row.schoolId === schoolId,
  }));

  const userLeaders: ExploreUserRank[] = topUsers.map((entry, index) => ({
    id: entry.user.id,
    rank: index + 1,
    name: fullName(entry.user.name, entry.user.surname, "Utente"),
    school: entry.user.school?.shortName ?? entry.user.school?.name ?? "—",
    lp: entry.balance,
    isCurrentUser: entry.user.id === userId,
  }));

  return {
    schools: exploreSchools,
    teams: exploreTeams,
    players,
    matches: exploreMatches,
    schoolTable,
    userLeaders,
    partnersAvailable: false,
  };
}
