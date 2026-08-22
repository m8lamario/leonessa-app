import { MATCH_START_NOTIFICATION_TYPE } from "../constants";

/** Idempotency key: matchId + type + kickoff minute (UTC ISO). */
export function buildMatchStartIdempotencyKey(matchId: string, startAt: Date): string {
  const kickoff = startAt.toISOString().slice(0, 16);
  return `${matchId}-${MATCH_START_NOTIFICATION_TYPE.toLowerCase().replace("_", "-")}-${kickoff}`;
}

export function buildMatchStartIdempotencyKeyForDevice(
  matchId: string,
  startAt: Date,
  deviceId: string,
): string {
  return `${buildMatchStartIdempotencyKey(matchId, startAt)}:${deviceId}`;
}
