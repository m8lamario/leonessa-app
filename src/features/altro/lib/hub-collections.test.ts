import { describe, expect, it } from "vitest";

import { partitionBadges, partitionMissions } from "./hub-collections";
import type { HubBadge, HubMission } from "../types";

function mission(overrides: Partial<HubMission> & Pick<HubMission, "id" | "status">): HubMission {
  return {
    title: "Missione",
    description: "Descrizione",
    reward: 50,
    progress: 0,
    statusLabel: "Disponibile",
    completedAt: null,
    ...overrides,
  };
}

function badge(overrides: Partial<HubBadge> & Pick<HubBadge, "id">): HubBadge {
  return {
    name: "Badge",
    description: "Descrizione",
    iconUrl: null,
    earnedAt: null,
    ...overrides,
  };
}

describe("partitionMissions", () => {
  it("separates active missions from completed ones", () => {
    const grouped = partitionMissions([
      mission({ id: "a", status: "AVAILABLE" }),
      mission({ id: "b", status: "IN_PROGRESS" }),
      mission({ id: "c", status: "COMPLETED", completedAt: "12 mar 2026" }),
      mission({ id: "d", status: "CLAIMED", completedAt: "13 mar 2026" }),
    ]);

    expect(grouped.active.map((item) => item.id)).toEqual(["a", "b"]);
    expect(grouped.completed.map((item) => item.id)).toEqual(["c", "d"]);
  });
});

describe("partitionBadges", () => {
  it("separates earned badges from locked ones", () => {
    const grouped = partitionBadges([
      badge({ id: "earned", earnedAt: "12 mar 2026" }),
      badge({ id: "locked" }),
    ]);

    expect(grouped.earned.map((item) => item.id)).toEqual(["earned"]);
    expect(grouped.locked.map((item) => item.id)).toEqual(["locked"]);
  });
});
