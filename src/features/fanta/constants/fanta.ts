export const INITIAL_BUDGET = 500;
export const STARTER_SIZE = 11;
export const BENCH_SIZE = 4;
export const TEAM_SIZE = STARTER_SIZE + BENCH_SIZE;
export const CAPTAIN_MULTIPLIER = 1.5;
export const AUTO_SUB_REASON = "AUTO_ABSENT_STARTER";

export const MARKET = {
  minValue: 5,
  maxValue: 150,
  freeTransfersPerMatchday: 2,
  paidTransferCostLp: 10,
  marketClosesBeforeKickoffMinutes: 30,
} as const;

export const VALUE_DELTAS = {
  excellent: 5,
  good: 2,
  neutral: 0,
  negative: -2,
  veryNegative: -5,
} as const;

/** Starters per role (1-4-3-3). */
export const STARTER_LIMITS = {
  PORTIERE: 1,
  DIFENSORE: 4,
  CENTROCAMPISTA: 3,
  ATTACCANTE: 3,
} as const;

/** One reserve per role. */
export const BENCH_LIMITS = {
  PORTIERE: 1,
  DIFENSORE: 1,
  CENTROCAMPISTA: 1,
  ATTACCANTE: 1,
} as const;

/** Alias: starter formation limits (historical name). */
export const FORMATION_LIMITS = STARTER_LIMITS;

export const FANTA_CREATION_REWARD = 50;

import type { FantasyRole } from "../types";

const DEFAULT_STARTING_VALUES: Record<FantasyRole, number> = {
  PORTIERE: 20,
  DIFENSORE: 25,
  CENTROCAMPISTA: 30,
  ATTACCANTE: 35,
};

export function getBaseFantasyValue(role: FantasyRole) {
  return DEFAULT_STARTING_VALUES[role];
}

export function totalLimitForRole(role: FantasyRole): number {
  return STARTER_LIMITS[role] + BENCH_LIMITS[role];
}

export type MarketStatus = "OPEN" | "CLOSED";

export type MarketWindow = {
  status: MarketStatus;
  closesAt: Date | null;
  reopensAt: Date | null;
  placeholder: boolean;
};
