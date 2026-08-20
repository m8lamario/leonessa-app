import {
  BENCH_LIMITS,
  MAX_BENCH_SIZE,
  MIN_BENCH_SIZE,
  STARTER_LIMITS,
  STARTER_SIZE,
} from "../constants/fanta";
import type { FantasyRole } from "../types";

export type EditableLineupEntry = {
  role: string;
  status: "STARTER" | "BENCH";
  isCaptain: boolean;
};

export type EditableLineupVacancy = Pick<EditableLineupEntry, "role" | "status">;

export type LineupValidation = {
  valid: boolean;
  starters: number;
  bench: number;
  message: string | null;
};

const roles = Object.keys(STARTER_LIMITS) as FantasyRole[];

export function validateRosterPlayers(
  players: Array<{ role: string; status: string; isCaptain?: boolean }>,
  options?: { requireCaptain?: boolean },
): LineupValidation {
  const starters = players.filter((player) => player.status === "STARTER");
  const bench = players.filter((player) => player.status === "BENCH");
  const starterCount = starters.length;
  const benchCount = bench.length;
  const requireCaptain = options?.requireCaptain ?? true;

  if (starterCount !== STARTER_SIZE) {
    return {
      valid: false,
      starters: starterCount,
      bench: benchCount,
      message: "La rosa deve avere esattamente 11 titolari.",
    };
  }
  if (benchCount < MIN_BENCH_SIZE) {
    return {
      valid: false,
      starters: starterCount,
      bench: benchCount,
      message: "La rosa deve avere almeno 1 riserva.",
    };
  }
  if (benchCount > MAX_BENCH_SIZE) {
    return {
      valid: false,
      starters: starterCount,
      bench: benchCount,
      message: "La rosa può avere al massimo 4 riserve.",
    };
  }

  for (const role of roles) {
    if (starters.filter((player) => player.role === role).length !== STARTER_LIMITS[role]) {
      return {
        valid: false,
        starters: starterCount,
        bench: benchCount,
        message: `I titolari richiedono ${STARTER_LIMITS[role]} ${role.toLowerCase()}.`,
      };
    }
    if (bench.filter((player) => player.role === role).length > BENCH_LIMITS[role]) {
      return {
        valid: false,
        starters: starterCount,
        bench: benchCount,
        message: `Le riserve ammettono al massimo ${BENCH_LIMITS[role]} ${role.toLowerCase()}.`,
      };
    }
  }

  if (requireCaptain) {
    const captains = starters.filter((player) => player.isCaptain).length;
    if (captains !== 1) {
      return {
        valid: false,
        starters: starterCount,
        bench: benchCount,
        message: "Scegli un capitano tra i titolari.",
      };
    }
  }

  return { valid: true, starters: starterCount, bench: benchCount, message: null };
}

/**
 * Validates the editable lineup, including temporary slots opened by market sales.
 * Ready to confirm: 11 starters, 1–4 bench, no empty starter slots. Bench vacancies are optional.
 */
export function validateEditableLineup(
  players: EditableLineupEntry[],
  vacancies: EditableLineupVacancy[] = [],
): LineupValidation {
  const starters = players.filter((player) => player.status === "STARTER").length;
  const bench = players.filter((player) => player.status === "BENCH").length;
  const starterVacancies = vacancies.filter((vacancy) => vacancy.status === "STARTER");

  if (starterVacancies.length > 0) {
    return {
      valid: false,
      starters,
      bench,
      message: "Completa gli slot vuoti tra i titolari prima di confermare la formazione.",
    };
  }

  return validateRosterPlayers(players, { requireCaptain: true });
}
