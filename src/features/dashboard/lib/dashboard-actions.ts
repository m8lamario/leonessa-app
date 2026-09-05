import type { DashboardTodayAction } from "../types";

export const DASHBOARD_TODAY_ACTION_LIMIT = 3;

export function pickTodayActions(candidates: Array<DashboardTodayAction | null | undefined>) {
  return candidates.filter((action): action is DashboardTodayAction => Boolean(action)).slice(
    0,
    DASHBOARD_TODAY_ACTION_LIMIT,
  );
}
