import { BENCH_LIMITS, BENCH_SIZE, STARTER_LIMITS, STARTER_SIZE } from "../constants/fanta";
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

/**
 * Validates the editable lineup, including temporary slots opened by market sales.
 * A formation is ready to confirm only when every 4-3-3 and bench slot is filled.
 */
export function validateEditableLineup(
  players: EditableLineupEntry[],
  vacancies: EditableLineupVacancy[] = [],
): LineupValidation {
  const starters = players.filter((player) => player.status === "STARTER").length;
  const bench = players.filter((player) => player.status === "BENCH").length;

  if (vacancies.length > 0) {
    return {
      valid: false,
      starters,
      bench,
      message: "Completa gli slot vuoti prima di confermare la formazione.",
    };
  }
  if (starters !== STARTER_SIZE || bench !== BENCH_SIZE) {
    return {
      valid: false,
      starters,
      bench,
      message: "La rosa deve avere 11 titolari e 4 riserve.",
    };
  }

  for (const role of roles) {
    if (
      players.filter((player) => player.status === "STARTER" && player.role === role).length !==
      STARTER_LIMITS[role]
    ) {
      return {
        valid: false,
        starters,
        bench,
        message: `I titolari richiedono ${STARTER_LIMITS[role]} ${role.toLowerCase()}.`,
      };
    }
    if (
      players.filter((player) => player.status === "BENCH" && player.role === role).length !==
      BENCH_LIMITS[role]
    ) {
      return {
        valid: false,
        starters,
        bench,
        message: `Le riserve richiedono ${BENCH_LIMITS[role]} ${role.toLowerCase()}.`,
      };
    }
  }

  if (players.filter((player) => player.status === "STARTER" && player.isCaptain).length !== 1) {
    return {
      valid: false,
      starters,
      bench,
      message: "Scegli un capitano tra i titolari.",
    };
  }

  return { valid: true, starters, bench, message: null };
}
