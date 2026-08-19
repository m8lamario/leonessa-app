export const INITIAL_BUDGET = 500;
export const TEAM_SIZE = 11;
export const CAPTAIN_MULTIPLIER = 1.5;

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

export const FORMATION_LIMITS = {
  PORTIERE: 1,
  DIFENSORE: 4,
  CENTROCAMPISTA: 3,
  ATTACCANTE: 3,
} as const;

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

export type MarketStatus = "OPEN" | "CLOSED";

export type MarketWindow = {
  status: MarketStatus;
  closesAt: Date | null;
  reopensAt: Date | null;
  placeholder: boolean;
};
