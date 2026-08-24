import type { HubBadge, HubMission, MissionStatusKey } from "../types";

export function isActiveMissionStatus(status: MissionStatusKey) {
  return status === "AVAILABLE" || status === "IN_PROGRESS";
}

export function isCompletedMissionStatus(status: MissionStatusKey) {
  return status === "COMPLETED" || status === "CLAIMED";
}

export function partitionMissions(missions: HubMission[]) {
  return {
    active: missions.filter((mission) => isActiveMissionStatus(mission.status)),
    completed: missions.filter((mission) => isCompletedMissionStatus(mission.status)),
  };
}

export function partitionBadges(badges: HubBadge[]) {
  return {
    earned: badges.filter((badge) => Boolean(badge.earnedAt)),
    locked: badges.filter((badge) => !badge.earnedAt),
  };
}
