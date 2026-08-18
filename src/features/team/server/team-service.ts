import "server-only";

import type { TeamApplicationKind, TeamApplicationStatus, TeamMemberRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { TeamMatch, TeamMember, TeamPageData, TeamSupporter } from "../types";

const teamStaffRoles: TeamMemberRole[] = ["COACH", "MANAGER", "SOCIAL_MANAGER"];

function getFullName(name: string | null, surname: string | null) {
  return [name, surname].filter(Boolean).join(" ") || "Utente Leonessa";
}

function getStaffRole(role: TeamMemberRole) {
  switch (role) {
    case "COACH":
      return "Allenatore";
    case "SOCIAL_MANAGER":
      return "Social manager";
    default:
      return "Manager";
  }
}

function mapApplication(
  application: { kind: TeamApplicationKind; status: TeamApplicationStatus } | null,
): TeamPageData["viewer"]["application"] {
  if (!application) {
    return null;
  }

  return {
    kind: application.kind === "PLAYER" ? "player" : "staff",
    status:
      application.status === "PENDING"
        ? "pending"
        : application.status === "APPROVED"
          ? "approved"
          : "rejected",
  };
}

function mapMember(
  member: {
    id: string;
    role: TeamMemberRole;
    user: { name: string | null; surname: string | null; image: string | null };
  },
  role: string,
): TeamMember {
  return {
    id: member.id,
    name: getFullName(member.user.name, member.user.surname),
    image: member.user.image,
    role,
  };
}

function getMatchOutcome(
  match: {
    homeTeamId: string;
    homeScore: number;
    awayScore: number;
  },
  teamId: string,
): TeamMatch["outcome"] {
  const teamScore = match.homeTeamId === teamId ? match.homeScore : match.awayScore;
  const opponentScore = match.homeTeamId === teamId ? match.awayScore : match.homeScore;

  if (teamScore === opponentScore) {
    return "Pareggio";
  }

  return teamScore > opponentScore ? "Vittoria" : "Sconfitta";
}

function mapMatch(
  match: {
    id: string;
    homeTeamId: string;
    startAt: Date;
    homeScore: number;
    awayScore: number;
    homeTeam: { name: string };
    awayTeam: { name: string };
  },
  teamId: string,
  includeScore: boolean,
): TeamMatch {
  return {
    id: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    kickoff: match.startAt.toISOString(),
    homeScore: includeScore ? match.homeScore : null,
    awayScore: includeScore ? match.awayScore : null,
    outcome: includeScore ? getMatchOutcome(match, teamId) : null,
  };
}

export async function getTeamPageData(
  teamId: string,
  viewerId: string,
): Promise<TeamPageData | null> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, deletedAt: null },
    include: {
      competition: { select: { id: true } },
      school: { select: { id: true, name: true, shortName: true, logoUrl: true } },
    },
  });

  if (!team) {
    return null;
  }

  const matchFilter = {
    competitionId: team.competitionId,
    deletedAt: null,
    OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
  };

  const [
    rankings,
    completedMatches,
    upcomingMatches,
    memberships,
    supportersCount,
    topSupporters,
    viewer,
    viewerApplication,
  ] = await Promise.all([
    prisma.schoolRanking.findMany({
      where: { competitionId: team.competition.id },
      select: {
        id: true,
        schoolId: true,
        totalPoints: true,
        matchesPlayed: true,
        wins: true,
        draws: true,
        losses: true,
      },
      orderBy: [{ totalPoints: "desc" }, { wins: "desc" }, { draws: "desc" }, { losses: "asc" }],
    }),
    prisma.match.findMany({
      where: { ...matchFilter, status: "FINISHED" },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { startAt: "desc" },
      take: 3,
    }),
    prisma.match.findMany({
      where: {
        ...matchFilter,
        status: { in: ["SCHEDULED", "LIVE"] },
        startAt: { gte: new Date() },
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    prisma.teamMember.findMany({
      where: {
        teamId: team.id,
        leftAt: null,
        user: { deletedAt: null },
      },
      include: {
        user: { select: { name: true, surname: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.user.count({
      where: {
        schoolId: team.schoolId,
        deletedAt: null,
        teamMemberships: { none: { teamId: team.id, leftAt: null } },
      },
    }),
    prisma.user.findMany({
      where: {
        schoolId: team.schoolId,
        deletedAt: null,
        teamMemberships: { none: { teamId: team.id, leftAt: null } },
      },
      select: {
        id: true,
        name: true,
        surname: true,
        image: true,
        lpBalance: { select: { balance: true } },
      },
      orderBy: { lpBalance: { balance: "desc" } },
      take: 5,
    }),
    prisma.user.findUnique({
      where: { id: viewerId },
      select: {
        schoolId: true,
        teamMemberships: {
          where: { teamId: team.id, leftAt: null },
          select: { role: true },
          take: 1,
        },
      },
    }),
    prisma.teamApplication.findFirst({
      where: { teamId: team.id, userId: viewerId },
      select: { kind: true, status: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const teamRanking = rankings.find((ranking) => ranking.schoolId === team.schoolId);
  const position = teamRanking
    ? rankings.findIndex((ranking) => ranking.id === teamRanking.id) + 1
    : null;
  const statistics = completedMatches.reduce(
    (total, match) => {
      const isHomeTeam = match.homeTeamId === team.id;
      total.goalsFor += isHomeTeam ? match.homeScore : match.awayScore;
      total.goalsAgainst += isHomeTeam ? match.awayScore : match.homeScore;
      return total;
    },
    { goalsFor: 0, goalsAgainst: 0 },
  );
  const viewerRole = viewer?.teamMemberships[0]?.role;

  return {
    id: team.id,
    name: team.name,
    logoUrl: team.school.logoUrl,
    school: team.school,
    ranking: {
      position,
      points: teamRanking?.totalPoints ?? 0,
      matchesPlayed: teamRanking?.matchesPlayed ?? completedMatches.length,
      wins: teamRanking?.wins ?? 0,
      draws: teamRanking?.draws ?? 0,
      losses: teamRanking?.losses ?? 0,
    },
    statistics: {
      ...statistics,
      goalDifference: statistics.goalsFor - statistics.goalsAgainst,
    },
    community: {
      players: memberships
        .filter((member) => member.role === "PLAYER")
        .map((member) => mapMember(member, "Giocatore")),
      staff: memberships
        .filter((member) => teamStaffRoles.includes(member.role))
        .map((member) => mapMember(member, getStaffRole(member.role))),
      supportersCount,
    },
    topSupporters: topSupporters.map<TeamSupporter>((supporter) => ({
      id: supporter.id,
      name: getFullName(supporter.name, supporter.surname),
      image: supporter.image,
      lp: supporter.lpBalance?.balance ?? 0,
    })),
    completedMatches: completedMatches.map((match) => mapMatch(match, team.id, true)),
    upcomingMatches: upcomingMatches.map((match) => mapMatch(match, team.id, false)),
    viewer: {
      membership: viewerRole === "PLAYER" ? "player" : viewerRole ? "staff" : null,
      attendsSchool: viewer?.schoolId === team.schoolId,
      application: mapApplication(viewerApplication),
    },
  };
}
