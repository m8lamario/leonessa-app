import { AUTO_SUB_REASON } from "../constants/fanta";

export type LineupPlayer = {
  playerId: string;
  role: string;
  status: "STARTER" | "BENCH";
  isCaptain: boolean;
  benchOrder: number | null;
};

export type PlannedSubstitution = {
  playerOutId: string;
  playerInId: string;
  reason: string;
  sequence: number;
};

export type EffectiveLineupResult = {
  /** Selections that count for fantasy team scoring this match. */
  effective: Array<{
    playerId: string;
    role: string;
    isCaptain: boolean;
  }>;
  substitutions: PlannedSubstitution[];
};

/**
 * Resolve the effective fantasy lineup for a match.
 *
 * @param playedPlayerIds - When `null`, participation data is unavailable:
 *   no automatic substitutions are applied; only starters involved in the match score.
 *   When a Set is provided, starters in the match who are not in the set are replaced
 *   by the same-role bench player if that bench player is in the match and did play.
 */
export function resolveEffectiveLineup(
  roster: LineupPlayer[],
  matchPlayerIds: Set<string>,
  playedPlayerIds: Set<string> | null,
): EffectiveLineupResult {
  const starters = roster.filter((player) => player.status === "STARTER");
  const bench = roster
    .filter((player) => player.status === "BENCH")
    .slice()
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));

  const usedBench = new Set<string>();
  const substitutions: PlannedSubstitution[] = [];
  const effective: EffectiveLineupResult["effective"] = [];
  let sequence = 0;

  for (const starter of starters) {
    const starterInMatch = matchPlayerIds.has(starter.playerId);

    if (!starterInMatch) {
      // Starter's team is not in this match — no contribution, no auto-sub for this match.
      continue;
    }

    if (playedPlayerIds === null) {
      // No reliable participation: score starters in match, never auto-sub.
      effective.push({
        playerId: starter.playerId,
        role: starter.role,
        isCaptain: starter.isCaptain,
      });
      continue;
    }

    if (playedPlayerIds.has(starter.playerId)) {
      effective.push({
        playerId: starter.playerId,
        role: starter.role,
        isCaptain: starter.isCaptain,
      });
      continue;
    }

    // Participation known and starter did not play → try same-role bench.
    const replacement = bench.find(
      (player) =>
        player.role === starter.role &&
        !usedBench.has(player.playerId) &&
        matchPlayerIds.has(player.playerId) &&
        playedPlayerIds.has(player.playerId),
    );

    if (!replacement) {
      // No valid bench entry — starter scores 0, captain bonus lost if applicable.
      continue;
    }

    usedBench.add(replacement.playerId);
    sequence += 1;
    substitutions.push({
      playerOutId: starter.playerId,
      playerInId: replacement.playerId,
      reason: AUTO_SUB_REASON,
      sequence,
    });
    effective.push({
      playerId: replacement.playerId,
      role: replacement.role,
      isCaptain: false, // captain bonus never transfers
    });
  }

  return { effective, substitutions };
}
