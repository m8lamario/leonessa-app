import type { Match, MatchStatus, MatchVenue, Team } from "../types";

const LEONESSA_CUP_SLUG = "leonessa-cup";

type EslTeam = {
  id: number | string;
  local_league: string;
  slug?: string | null;
  name: string;
  short_name?: string | null;
  logo?: string | null;
  pts?: number | null;
  record?: string | null;
};

type EslMatchEvent = {
  id: number | string;
  minute: number;
  event_type: string;
  player?: { id: number | string; first_name?: string | null; last_name?: string | null } | null;
};

type EslTeamMatch = {
  is_home: boolean;
  penalties?: number | null;
  score?: number | null;
  team: EslTeam;
  events?: EslMatchEvent[];
};

type EslStadium = {
  name: string;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

type EslMatch = {
  id: number | string;
  datetime: string;
  stadium?: EslStadium | null;
  score_text?: string | null;
  name?: string | null;
  finished?: boolean;
  teams: EslTeamMatch[];
  status?: string | null;
  isLive?: boolean;
  stage?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asNumericLike(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asEslTeam(value: unknown): EslTeam | null {
  if (!isRecord(value) || (typeof value.id !== "number" && typeof value.id !== "string")) {
    return null;
  }

  const localLeague = asString(value.local_league);
  const name = asString(value.name);

  if (!localLeague || !name) {
    return null;
  }

  return {
    id: value.id,
    local_league: localLeague,
    slug: asString(value.slug),
    name,
    short_name: asString(value.short_name),
    logo: asString(value.logo),
    pts: asNumber(value.pts),
    record: asString(value.record),
  };
}

function asEslMatchEvent(value: unknown): EslMatchEvent | null {
  if (!isRecord(value) || (typeof value.id !== "number" && typeof value.id !== "string")) {
    return null;
  }

  const minute = asNumber(value.minute);
  const eventType = asString(value.event_type);
  const player =
    isRecord(value.player) &&
    (typeof value.player.id === "number" || typeof value.player.id === "string")
      ? {
          id: value.player.id,
          first_name: asString(value.player.first_name),
          last_name: asString(value.player.last_name),
        }
      : null;

  if (minute === null || !eventType) {
    return null;
  }

  return { id: value.id, minute, event_type: eventType, player };
}

function asEslTeamMatch(value: unknown): EslTeamMatch | null {
  if (!isRecord(value) || typeof value.is_home !== "boolean") {
    return null;
  }

  const team = asEslTeam(value.team);

  if (!team) {
    return null;
  }

  const events = Array.isArray(value.events)
    ? value.events.map(asEslMatchEvent).filter((event): event is EslMatchEvent => event !== null)
    : [];

  return {
    is_home: value.is_home,
    penalties: asNumber(value.penalties),
    score: asNumber(value.score),
    team,
    events,
  };
}

function asEslStadium(value: unknown): EslStadium | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asString(value.name);

  return name
    ? {
        name,
        address: asString(value.address),
        latitude: asNumericLike(value.latitude),
        longitude: asNumericLike(value.longitude),
      }
    : null;
}

function asEslMatch(value: unknown): EslMatch | null {
  if (
    !isRecord(value) ||
    (typeof value.id !== "number" && typeof value.id !== "string") ||
    typeof value.datetime !== "string" ||
    !Array.isArray(value.teams)
  ) {
    return null;
  }

  const teams = value.teams.map(asEslTeamMatch);

  if (!teams.every((team): team is EslTeamMatch => team !== null)) {
    return null;
  }

  return {
    id: value.id,
    datetime: value.datetime,
    stadium: asEslStadium(value.stadium),
    score_text: asString(value.score_text),
    name: asString(value.name),
    finished: asBoolean(value.finished),
    teams,
    status: asString(value.status),
    isLive: asBoolean(value.isLive),
    stage: asString(value.stage),
  };
}

function extractEslMatches(payload: unknown): EslMatch[] | null {
  const values = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.results)
      ? payload.results
      : null;

  if (!values) {
    return null;
  }

  return values.map(asEslMatch).filter((match): match is EslMatch => match !== null);
}

function normalizeStatus(match: EslMatch): MatchStatus {
  const status = match.status?.toUpperCase();

  if (match.isLive || status === "LIVE") {
    return "live";
  }

  if (match.finished || status === "FT" || status === "FINISHED" || status === "COMPLETED") {
    return "completed";
  }

  if (status === "CANCELLED" || status === "CANCELED") {
    return "cancelled";
  }

  return "scheduled";
}

function normalizeTeam(team: EslTeam): Team {
  return {
    id: String(team.id),
    slug: team.slug ?? String(team.id),
    name: team.name,
    shortName: team.short_name ?? team.name.slice(0, 3).toUpperCase(),
    logoUrl: team.logo ?? null,
    points: team.pts ?? null,
    record: team.record ?? null,
  };
}

function normalizeVenue(stadium: EslStadium | null): MatchVenue | null {
  if (!stadium) {
    return null;
  }

  return {
    name: stadium.name,
    address: stadium.address ?? null,
    latitude: asNumber(stadium.latitude),
    longitude: asNumber(stadium.longitude),
  };
}

function normalizeEvents(teams: EslTeamMatch[]): Match["events"] {
  const supportedTypes = new Set<Match["events"][number]["type"]>([
    "GOAL",
    "ASSIST",
    "YELLOW_CARD",
    "RED_CARD",
    "OWN_GOAL",
  ]);

  return teams.flatMap((team) =>
    (team.events ?? []).flatMap((event) => {
      const type = event.event_type.toUpperCase().replace(/\s+/g, "_");
      if (!supportedTypes.has(type as Match["events"][number]["type"])) {
        return [];
      }

      return [
        {
          id: String(event.id),
          playerEslId: event.player ? String(event.player.id) : null,
          playerFirstName: event.player?.first_name ?? null,
          playerLastName: event.player?.last_name ?? null,
          teamEslId: String(team.team.id),
          minute: event.minute,
          type: type as Match["events"][number]["type"],
        },
      ];
    }),
  );
}

function normalizeMatch(match: EslMatch): Match | null {
  const home = match.teams.find((team) => team.is_home);
  const away = match.teams.find((team) => !team.is_home);
  const kickoff = new Date(match.datetime);

  if (!home || !away || Number.isNaN(kickoff.getTime())) {
    return null;
  }

  return {
    id: String(match.id),
    competition: {
      id: LEONESSA_CUP_SLUG,
      slug: LEONESSA_CUP_SLUG,
      name: "Leonessa Cup",
    },
    homeTeam: normalizeTeam(home.team),
    awayTeam: normalizeTeam(away.team),
    kickoff: kickoff.toISOString(),
    status: normalizeStatus(match),
    stage: match.stage ?? null,
    homeScore: home.score ?? null,
    awayScore: away.score ?? null,
    homePenalties: home.penalties ?? null,
    awayPenalties: away.penalties ?? null,
    scoreText: match.score_text ?? null,
    isLive: match.isLive ?? false,
    events: normalizeEvents(match.teams),
    venue: normalizeVenue(match.stadium ?? null),
  };
}

export function mapEslMatches(payload: unknown): Match[] {
  const matches = extractEslMatches(payload);

  if (!matches) {
    return [];
  }

  return matches
    .filter((match) => match.teams.length === 2)
    .filter((match) => match.teams.every((team) => team.team.local_league === LEONESSA_CUP_SLUG))
    .map(normalizeMatch)
    .filter((match): match is Match => match !== null);
}

export function isEslMatchPayload(payload: unknown): boolean {
  return Array.isArray(payload) || (isRecord(payload) && Array.isArray(payload.results));
}
