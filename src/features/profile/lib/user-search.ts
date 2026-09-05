export const USER_SEARCH_MIN_LENGTH = 2;
export const USER_SEARCH_MAX_LENGTH = 64;
export const USER_SEARCH_LIMIT = 20;

export type UserSearchIssue = "EMPTY" | "TOO_SHORT" | "TOO_LONG";

export function normalizeUserSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getUserSearchIssue(query: string): UserSearchIssue | null {
  const normalized = normalizeUserSearchQuery(query);
  if (!normalized) return "EMPTY";
  if (normalized.length < USER_SEARCH_MIN_LENGTH) return "TOO_SHORT";
  if (normalized.length > USER_SEARCH_MAX_LENGTH) return "TOO_LONG";
  return null;
}

export function getUserSearchTokens(query: string) {
  return normalizeUserSearchQuery(query)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export const USER_SEARCH_MESSAGES: Record<UserSearchIssue, string> = {
  EMPTY: "Inserisci almeno due caratteri.",
  TOO_SHORT: "Inserisci almeno due caratteri.",
  TOO_LONG: "La ricerca è troppo lunga.",
};
