import type { Prisma } from "@prisma/client";

import type { Competition, Match, MatchStatus, Team } from "../types";

export type CupDbTeam = Prisma.TeamGetPayload<{
  include: { school: true };
}>;

export type CupDbMatch = Prisma.MatchGetPayload<{
  include: {
    competition: true;
    homeTeam: { include: { school: true } };
    awayTeam: { include: { school: true } };
  };
}>;

export function toCompetitionDto(competition: CupDbMatch["competition"]): Competition {
  return {
    id: competition.id,
    slug: competition.slug,
    name: competition.name,
  };
}

export function toTeamDto(team: CupDbTeam): Team {
  return {
    id: team.id,
    slug: team.eslId ?? team.id,
    name: team.name,
    shortName: team.school.shortName,
    logoUrl: team.school.logoUrl,
    points: null,
    record: null,
  };
}

function toMatchStatus(status: CupDbMatch["status"]): MatchStatus {
  switch (status) {
    case "LIVE":
      return "live";
    case "FINISHED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export function toMatchDto(match: CupDbMatch): Match {
  const isScored = match.status === "LIVE" || match.status === "FINISHED";

  return {
    id: match.id,
    competition: toCompetitionDto(match.competition),
    homeTeam: toTeamDto(match.homeTeam),
    awayTeam: toTeamDto(match.awayTeam),
    kickoff: match.startAt.toISOString(),
    status: toMatchStatus(match.status),
    stage: null,
    homeScore: isScored ? match.homeScore : null,
    awayScore: isScored ? match.awayScore : null,
    homePenalties: null,
    awayPenalties: null,
    scoreText: isScored ? `${match.homeScore} - ${match.awayScore}` : null,
    isLive: match.status === "LIVE",
    venue: match.venue
      ? {
          name: match.venue,
          address: null,
          latitude: null,
          longitude: null,
        }
      : null,
  };
}
