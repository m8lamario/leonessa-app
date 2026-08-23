import { describe, expect, it } from "vitest";

import { filterBuilderPlayers } from "./builder-player-filters";
import type { FantasyPlayer } from "../types";

function player(overrides: Partial<FantasyPlayer> & Pick<FantasyPlayer, "id" | "name">): FantasyPlayer {
  return {
    school: "Calini",
    role: "ATTACCANTE",
    fantasyValue: 20,
    badges: [],
    ...overrides,
  };
}

describe("filterBuilderPlayers", () => {
  const roster: FantasyPlayer[] = [
    player({ id: "a", name: "Anna Rossi", school: "Calini", fantasyValue: 8, totalPoints: 12 }),
    player({ id: "b", name: "Bruno Bianchi", school: "Abba", fantasyValue: 15, totalPoints: 4 }),
    player({ id: "c", name: "Carlo Verdi", school: "Calini", fantasyValue: 55, totalPoints: 30 }),
  ];

  const base = {
    search: "",
    priceFilter: "all" as const,
    schoolFilter: "all",
    sort: "price-asc" as const,
  };

  it("filters by player name and school", () => {
    expect(filterBuilderPlayers(roster, { ...base, search: "calini" }).map((item) => item.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filterBuilderPlayers(roster, { ...base, search: "bruno" }).map((item) => item.id)).toEqual([
      "b",
    ]);
  });

  it("filters by price band without dropping other players from the source list", () => {
    expect(filterBuilderPlayers(roster, { ...base, priceFilter: "0-10" }).map((item) => item.id)).toEqual([
      "a",
    ]);
    expect(filterBuilderPlayers(roster, { ...base, priceFilter: "50+" }).map((item) => item.id)).toEqual([
      "c",
    ]);
  });

  it("filters by school", () => {
    expect(filterBuilderPlayers(roster, { ...base, schoolFilter: "Abba" }).map((item) => item.id)).toEqual([
      "b",
    ]);
  });

  it("sorts by points, name and descending price", () => {
    expect(filterBuilderPlayers(roster, { ...base, sort: "points" }).map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(filterBuilderPlayers(roster, { ...base, sort: "name" }).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(filterBuilderPlayers(roster, { ...base, sort: "price-desc" }).map((item) => item.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });
});
