import { CAPTAIN_MULTIPLIER } from "../constants/fanta";

/** Single source of truth for fantasy point values. */
export const SCORING = {
  goal: 100,
  assist: 50,
  win: 20,
  draw: 5,
  cleanSheet: 30,
  yellowCard: -20,
  redCard: -50,
  ownGoal: -70,
  mvp: 0,
} as const;

/** Event-type keyed view of the same rules (for inspectors / UI). */
export const SCORING_RULES = {
  GOAL: SCORING.goal,
  ASSIST: SCORING.assist,
  YELLOW_CARD: SCORING.yellowCard,
  RED_CARD: SCORING.redCard,
  OWN_GOAL: SCORING.ownGoal,
  MVP: SCORING.mvp,
  WIN: SCORING.win,
  DRAW: SCORING.draw,
  CLEAN_SHEET: SCORING.cleanSheet,
} as const;

export type ScorableEvent = {
  playerId: string | null;
  type: string;
};

export type ScorableMatch = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  events: ScorableEvent[];
};

export type ScorablePlayer = {
  id: string;
  teamId: string;
  fantasyRole: string;
};

export type FantasySelection = {
  playerId: string;
  role: string;
  isCaptain: boolean;
};

export type PlayerMatchBreakdown = {
  eventPoints: number;
  resultPoints: number;
  cleanSheetPoints: number;
  basePoints: number;
  finalPoints: number;
  isCaptain: boolean;
  role: string;
  events: Array<{ type: string; points: number }>;
};

export function getEventPointsForType(type: string): number {
  switch (type) {
    case "GOAL":
      return SCORING.goal;
    case "ASSIST":
      return SCORING.assist;
    case "YELLOW_CARD":
      return SCORING.yellowCard;
    case "RED_CARD":
      return SCORING.redCard;
    case "OWN_GOAL":
      return SCORING.ownGoal;
    case "MVP":
      return SCORING.mvp;
    default:
      return 0;
  }
}

export function getEventPoints(events: ScorableEvent[], playerId: string): number {
  return events.reduce((points, event) => {
    if (event.playerId !== playerId) return points;
    return points + getEventPointsForType(event.type);
  }, 0);
}

export function getMatchResultPoints(ownScore: number, opponentScore: number): number {
  if (ownScore > opponentScore) return SCORING.win;
  if (ownScore === opponentScore) return SCORING.draw;
  return 0;
}

export function getCleanSheetPoints(fantasyRole: string, opponentScore: number): number {
  if (opponentScore !== 0) return 0;
  if (fantasyRole === "PORTIERE" || fantasyRole === "DIFENSORE") {
    return SCORING.cleanSheet;
  }
  return 0;
}

/**
 * Role used for clean sheet and lineup context.
 * Prefer the fantasy selection role (how the player is fielded); otherwise TeamMember.fantasyRole.
 */
export function resolveFantasyRole(
  player: ScorablePlayer,
  selection?: Pick<FantasySelection, "role"> | null,
): string {
  return selection?.role ?? player.fantasyRole;
}

export function getPlayerBasePoints(
  match: ScorableMatch,
  player: ScorablePlayer,
  selection?: Pick<FantasySelection, "role"> | Pick<FantasySelection, "role" | "isCaptain"> | null,
): number {
  return getPlayerMatchBreakdown(match, player, selection ?? null).basePoints;
}

export function applyCaptainMultiplier(points: number, isCaptain = false): number {
  if (!isCaptain) return points;
  return Math.round(points * CAPTAIN_MULTIPLIER);
}

export function getPlayerMatchBreakdown(
  match: ScorableMatch,
  player: ScorablePlayer,
  selection?: Partial<Pick<FantasySelection, "role" | "isCaptain">> | null,
): PlayerMatchBreakdown {
  const role = resolveFantasyRole(player, selection?.role ? { role: selection.role } : null);
  const isHome = player.teamId === match.homeTeamId;
  const ownScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;
  const playerEvents = match.events.filter((event) => event.playerId === player.id);
  const eventPoints = playerEvents.reduce(
    (sum, event) => sum + getEventPointsForType(event.type),
    0,
  );
  const resultPoints = getMatchResultPoints(ownScore, opponentScore);
  const cleanSheetPoints = getCleanSheetPoints(role, opponentScore);
  const basePoints = eventPoints + resultPoints + cleanSheetPoints;
  const isCaptain = Boolean(selection?.isCaptain);

  return {
    eventPoints,
    resultPoints,
    cleanSheetPoints,
    basePoints,
    finalPoints: applyCaptainMultiplier(basePoints, isCaptain),
    isCaptain,
    role,
    events: playerEvents.map((event) => ({
      type: event.type,
      points: getEventPointsForType(event.type),
    })),
  };
}

export function getPlayerMatchScore(
  match: ScorableMatch,
  player: ScorablePlayer,
  selection?: Partial<Pick<FantasySelection, "role" | "isCaptain">> | null,
): number {
  return getPlayerMatchBreakdown(match, player, selection).finalPoints;
}

export function getStatDelta(events: ScorableEvent[], playerId: string) {
  return events.reduce(
    (delta, event) => {
      if (event.playerId !== playerId) return delta;

      switch (event.type) {
        case "GOAL":
          delta.goals += 1;
          break;
        case "ASSIST":
          delta.assists += 1;
          break;
        case "YELLOW_CARD":
          delta.yellowCards += 1;
          break;
        case "RED_CARD":
          delta.redCards += 1;
          break;
        default:
          break;
      }

      return delta;
    },
    { goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
  );
}

export function getMatchdayRound(startAt: Date): number {
  return Number(
    `${startAt.getUTCFullYear()}${String(startAt.getUTCMonth() + 1).padStart(2, "0")}${String(
      startAt.getUTCDate(),
    ).padStart(2, "0")}`,
  );
}

export type MatchScoringComputation = {
  playerPoints: Array<{
    playerId: string;
    points: number;
    delta: ReturnType<typeof getStatDelta>;
  }>;
  teamPoints: Array<{ fantasyTeamId: string; points: number }>;
};

/**
 * Pure match scoring shared by Production persistence and Sandbox rebuild.
 * Player career points use TeamMember.fantasyRole; fantasy team points use selection.role + captain.
 */
export function computeMatchScoring(
  match: ScorableMatch,
  players: ScorablePlayer[],
  fantasyTeams: Array<{ id: string; players: FantasySelection[] }>,
): MatchScoringComputation {
  const playerById = new Map(players.map((player) => [player.id, player]));

  const playerPoints = players.map((player) => ({
    playerId: player.id,
    points: getPlayerBasePoints(match, player),
    delta: getStatDelta(match.events, player.id),
  }));

  const teamPoints = fantasyTeams.map((team) => {
    const points = team.players.reduce((total, selection) => {
      const player = playerById.get(selection.playerId);
      if (!player) return total;
      return total + getPlayerMatchScore(match, player, selection);
    }, 0);
    return { fantasyTeamId: team.id, points };
  });

  return { playerPoints, teamPoints };
}
