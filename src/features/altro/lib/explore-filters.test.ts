import { describe, expect, it } from "vitest";

import {
  defaultExploreCategory,
  filterByQuery,
  groupMatches,
  matchesQuery,
  resolveExploreCategory,
  shouldShowSearch,
} from "./explore-filters";
import type { ExploreMatch } from "../types/explore";

function match(overrides: Partial<ExploreMatch> & Pick<ExploreMatch, "id" | "status" | "startAt">): ExploreMatch {
  return {
    homeTeam: "Home",
    awayTeam: "Away",
    homeTeamId: "h",
    awayTeamId: "a",
    homeScore: null,
    awayScore: null,
    venue: null,
    ...overrides,
  };
}

describe("explore filters", () => {
  it("matches queries ignoring case and accents", () => {
    expect(matchesQuery("Liceo Scientifico Galilei", "galilei")).toBe(true);
    expect(matchesQuery("Forlì", "forli")).toBe(true);
    expect(matchesQuery("Brescia", "roma")).toBe(false);
  });

  it("filters lists by concatenated text", () => {
    const teams = [
      { name: "Leonessa A", school: "Galilei" },
      { name: "Leonessa B", school: "Copernico" },
    ];
    expect(filterByQuery(teams, "cope", (item) => `${item.name} ${item.school}`).map((item) => item.name)).toEqual([
      "Leonessa B",
    ]);
  });

  it("shows search only when the list is long", () => {
    expect(shouldShowSearch(8)).toBe(false);
    expect(shouldShowSearch(9)).toBe(true);
  });

  it("opens partite when a live match exists", () => {
    expect(defaultExploreCategory(true)).toBe("partite");
    expect(defaultExploreCategory(false)).toBe("scuole");
  });

  it("honors an explicit Esplora category from the dashboard", () => {
    expect(resolveExploreCategory("persone", false)).toBe("persone");
    expect(resolveExploreCategory("unknown", true)).toBe("partite");
  });

  it("groups matches by status and sorts them", () => {
    const grouped = groupMatches([
      match({ id: "f1", status: "FINISHED", startAt: "2026-03-01T12:00:00.000Z" }),
      match({ id: "f2", status: "FINISHED", startAt: "2026-03-10T12:00:00.000Z" }),
      match({ id: "u2", status: "SCHEDULED", startAt: "2026-04-02T12:00:00.000Z" }),
      match({ id: "u1", status: "SCHEDULED", startAt: "2026-04-01T12:00:00.000Z" }),
      match({ id: "l1", status: "LIVE", startAt: "2026-04-01T10:00:00.000Z" }),
      match({ id: "c1", status: "CANCELLED", startAt: "2026-03-20T12:00:00.000Z" }),
    ]);

    expect(grouped.live.map((item) => item.id)).toEqual(["l1"]);
    expect(grouped.upcoming.map((item) => item.id)).toEqual(["u1", "u2"]);
    expect(grouped.finished.map((item) => item.id)).toEqual(["f2", "f1"]);
    expect(grouped.cancelled.map((item) => item.id)).toEqual(["c1"]);
  });
});
