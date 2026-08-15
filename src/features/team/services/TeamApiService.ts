import type { TeamApplication, TeamPageData } from "../types";

function isTeamPageResponse(value: unknown): value is { team: TeamPageData } {
  if (!value || typeof value !== "object" || !("team" in value)) {
    return false;
  }

  const team = value.team;
  return Boolean(
    team &&
    typeof team === "object" &&
    "id" in team &&
    typeof team.id === "string" &&
    "name" in team &&
    typeof team.name === "string",
  );
}

function isTeamApplicationResponse(value: unknown): value is { application: TeamApplication } {
  if (!value || typeof value !== "object" || !("application" in value)) {
    return false;
  }

  const application = value.application;
  return Boolean(
    application &&
    typeof application === "object" &&
    "kind" in application &&
    "status" in application &&
    (application.kind === "player" || application.kind === "staff") &&
    (application.status === "pending" ||
      application.status === "approved" ||
      application.status === "rejected"),
  );
}

export class TeamApiService {
  async getTeam(teamId: string): Promise<TeamPageData> {
    const response = await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "La squadra richiesta non è disponibile."
          : `Team request failed with status ${response.status}`,
      );
    }

    const payload: unknown = await response.json();

    if (!isTeamPageResponse(payload)) {
      throw new Error("Team response has an unsupported shape");
    }

    return payload.team;
  }

  async apply(teamId: string, kind: "player" | "staff"): Promise<TeamApplication> {
    const response = await fetch(`/api/teams/${encodeURIComponent(teamId)}/applications`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind: kind === "player" ? "PLAYER" : "STAFF" }),
    });

    const payload: unknown = await response.json();

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Team application request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (!isTeamApplicationResponse(payload)) {
      throw new Error("Team application response has an unsupported shape");
    }

    return payload.application;
  }
}

export const teamApiService = new TeamApiService();
