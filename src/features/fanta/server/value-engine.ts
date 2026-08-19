import { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { MARKET, VALUE_DELTAS } from "../constants/fanta";

const MIN_VALUE = MARKET.minValue;
const MAX_VALUE = MARKET.maxValue;

function valueDeltaFromPoints(points: number) {
  if (points >= 100) return VALUE_DELTAS.excellent;
  if (points >= 30) return VALUE_DELTAS.good;
  if (points <= -40) return VALUE_DELTAS.veryNegative;
  if (points < 0) return VALUE_DELTAS.negative;
  return VALUE_DELTAS.neutral;
}

export type ValueAdjustment = {
  playerId: string;
  oldValue: number;
  newValue: number;
  points: number;
};

export async function applyMatchdayValueAdjustments(
  transaction: Prisma.TransactionClient,
  adjustments: ValueAdjustment[],
  matchdayId: string,
  reason = "Prestazione giornata",
) {
  let changed = 0;

  for (const adjustment of adjustments) {
    const clamped = Math.max(MIN_VALUE, Math.min(MAX_VALUE, adjustment.newValue));
    if (clamped === adjustment.oldValue) continue;

    await transaction.teamMember.update({
      where: { id: adjustment.playerId },
      data: { fantasyValue: clamped },
    });
    await transaction.fantasyPlayerValueHistory.create({
      data: {
        playerId: adjustment.playerId,
        oldValue: adjustment.oldValue,
        newValue: clamped,
        reason,
      },
    });
    changed += 1;
  }

  if (changed > 0) {
    await transaction.fantasyMatchday.update({
      where: { id: matchdayId },
      data: { valueUpdatedAt: new Date() },
    });
    logger.info(
      { playerId: "__matchday__", oldValue: 0, newValue: changed },
      "Player values updated",
    );
  }

  return changed;
}

export function adjustmentFromPoints(
  playerId: string,
  oldValue: number,
  points: number,
): ValueAdjustment {
  return {
    playerId,
    oldValue,
    newValue: oldValue + valueDeltaFromPoints(points),
    points,
  };
}
