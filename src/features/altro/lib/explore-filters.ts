import type { ExploreMatch, ExploreMatchStatus } from "../types/explore";

export const EXPLORE_SEARCH_THRESHOLD = 8;

export function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchesQuery(haystack: string, query: string) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return normalizeSearch(haystack).includes(needle);
}

export function filterByQuery<T>(items: T[], query: string, getText: (item: T) => string) {
  const needle = normalizeSearch(query);
  if (!needle) return items;
  return items.filter((item) => normalizeSearch(getText(item)).includes(needle));
}

export function shouldShowSearch(count: number) {
  return count > EXPLORE_SEARCH_THRESHOLD;
}

export function defaultExploreCategory(hasLiveMatch: boolean): "partite" | "scuole" {
  return hasLiveMatch ? "partite" : "scuole";
}

export function groupMatches(matches: ExploreMatch[]) {
  const live: ExploreMatch[] = [];
  const upcoming: ExploreMatch[] = [];
  const finished: ExploreMatch[] = [];
  const cancelled: ExploreMatch[] = [];

  for (const match of matches) {
    if (match.status === "LIVE") live.push(match);
    else if (match.status === "SCHEDULED") upcoming.push(match);
    else if (match.status === "FINISHED") finished.push(match);
    else cancelled.push(match);
  }

  live.sort((a, b) => a.startAt.localeCompare(b.startAt));
  upcoming.sort((a, b) => a.startAt.localeCompare(b.startAt));
  finished.sort((a, b) => b.startAt.localeCompare(a.startAt));
  cancelled.sort((a, b) => b.startAt.localeCompare(a.startAt));

  return { live, upcoming, finished, cancelled };
}

export function isScoredMatchStatus(status: ExploreMatchStatus) {
  return status === "LIVE" || status === "FINISHED";
}
