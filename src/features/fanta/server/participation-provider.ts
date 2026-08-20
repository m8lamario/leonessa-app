import "server-only";

/**
 * Returns the set of TeamMember ids that participated in a match, or `null`
 * when no reliable participation source is available (current default).
 *
 * Future ESL (or other) integration should implement this without changing
 * the lineup resolver contract.
 */
export async function getPlayedPlayerIdsForMatch(
  _matchId: string,
): Promise<Set<string> | null> {
  return null;
}
