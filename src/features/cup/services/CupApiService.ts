import type { Match, Team } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCupMatchesResponse(value: unknown): value is { matches: Match[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.matches) &&
    value.matches.every(
      (match) =>
        isRecord(match) &&
        typeof match.id === "string" &&
        isRecord(match.homeTeam) &&
        isRecord(match.awayTeam) &&
        typeof match.kickoff === "string" &&
        typeof match.status === "string",
    )
  );
}

function isCupTeamsResponse(value: unknown): value is { teams: Team[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.teams) &&
    value.teams.every(
      (team) =>
        isRecord(team) &&
        typeof team.id === "string" &&
        typeof team.name === "string" &&
        typeof team.shortName === "string",
    )
  );
}

export class CupApiService {
  async getMatches(): Promise<Match[]> {
    const response = await fetch("/api/cup/matches", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Cup matches request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isCupMatchesResponse(payload)) {
      throw new Error("Cup matches response has an unsupported shape");
    }

    return payload.matches;
  }

  async getTeams(): Promise<Team[]> {
    const response = await fetch("/api/cup/teams", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Cup teams request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isCupTeamsResponse(payload)) {
      throw new Error("Cup teams response has an unsupported shape");
    }

    return payload.teams;
  }
}

export const cupApiService = new CupApiService();
