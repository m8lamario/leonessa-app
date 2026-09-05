import type { DashboardActivity } from "../types";

export const DASHBOARD_ACTIVITY_LIMIT = 5;

const KIND_WEIGHT: Record<DashboardActivity["kind"], number> = {
  overtake: 6,
  achievement: 5,
  badge: 4,
  fanta_score: 4,
  mission: 3,
  community: 2,
};

const COMMUNITY_ICONS: Record<string, string> = {
  ranking_up: "trending-up",
  player_bought: "trending-up",
  big_points: "goal",
  captain_change: "crown",
  best_buy: "gem",
  achievement: "award",
};

export function iconForCommunityActivity(type: string) {
  return COMMUNITY_ICONS[type] ?? "flame";
}

export function pickDashboardActivities(items: DashboardActivity[]) {
  const seen = new Set<string>();

  return items
    .filter((item) => item.title.trim().length > 0)
    .sort((left, right) => {
      if (left.fromFollowed !== right.fromFollowed) {
        return left.fromFollowed ? -1 : 1;
      }
      const byDate = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
      if (byDate !== 0) return byDate;
      return KIND_WEIGHT[right.kind] - KIND_WEIGHT[left.kind];
    })
    .filter((item) => {
      const key = `${item.kind}:${item.title.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, DASHBOARD_ACTIVITY_LIMIT);
}
