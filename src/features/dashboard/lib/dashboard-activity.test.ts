import { describe, expect, it } from "vitest";

import { pickDashboardActivities } from "./dashboard-activity";
import type { DashboardActivity } from "../types";

function activity(
  overrides: Partial<DashboardActivity> & Pick<DashboardActivity, "id" | "title" | "occurredAt">,
): DashboardActivity {
  return {
    kind: "community",
    detail: null,
    icon: "flame",
    actorUserId: null,
    href: null,
    fromFollowed: false,
    ...overrides,
  };
}

describe("dashboard activity", () => {
  it("keeps the most recent unique real activities", () => {
    const selected = pickDashboardActivities([
      activity({
        id: "old",
        title: "Acquisto",
        occurredAt: "2026-09-01T08:00:00.000Z",
      }),
      activity({
        id: "badge",
        kind: "badge",
        title: "Anna ha ottenuto il badge Esordio",
        occurredAt: "2026-09-05T10:00:00.000Z",
        icon: "award",
      }),
      activity({
        id: "dup",
        kind: "badge",
        title: "Anna ha ottenuto il badge Esordio",
        occurredAt: "2026-09-05T09:00:00.000Z",
        icon: "award",
      }),
      activity({
        id: "empty",
        title: "   ",
        occurredAt: "2026-09-05T11:00:00.000Z",
      }),
    ]);

    expect(selected.map((item) => item.id)).toEqual(["badge", "old"]);
  });

  it("drops the current user's own activity", () => {
    const selected = pickDashboardActivities(
      [
        activity({
          id: "self",
          kind: "badge",
          title: "Mario ha ottenuto un badge",
          occurredAt: "2026-09-05T12:00:00.000Z",
          actorUserId: "mario",
        }),
        activity({
          id: "other",
          title: "Attività globale",
          occurredAt: "2026-09-05T10:00:00.000Z",
        }),
      ],
      "mario",
    );

    expect(selected.map((item) => item.id)).toEqual(["other"]);
  });

  it("prioritizes followed users over newer global activity", () => {
    const selected = pickDashboardActivities([
      activity({
        id: "global",
        title: "Attività globale",
        occurredAt: "2026-09-05T12:00:00.000Z",
      }),
      activity({
        id: "friend",
        kind: "badge",
        title: "Luca ha ottenuto il badge Esordio",
        occurredAt: "2026-09-04T12:00:00.000Z",
        actorUserId: "luca",
        fromFollowed: true,
        icon: "award",
      }),
    ]);

    expect(selected.map((item) => item.id)).toEqual(["friend", "global"]);
  });
});
