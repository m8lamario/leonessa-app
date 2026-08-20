import { describe, expect, it } from "vitest";

import { AUTO_SUB_REASON } from "../constants/fanta";
import { resolveEffectiveLineup, type LineupPlayer } from "./lineup-resolver";

function player(
  partial: Partial<LineupPlayer> & Pick<LineupPlayer, "playerId" | "role" | "status">,
): LineupPlayer {
  return {
    isCaptain: false,
    benchOrder: null,
    ...partial,
  };
}

const roster: LineupPlayer[] = [
  player({ playerId: "s-por", role: "PORTIERE", status: "STARTER", isCaptain: true }),
  player({ playerId: "s-dif-1", role: "DIFENSORE", status: "STARTER" }),
  player({ playerId: "s-dif-2", role: "DIFENSORE", status: "STARTER" }),
  player({ playerId: "s-dif-3", role: "DIFENSORE", status: "STARTER" }),
  player({ playerId: "s-dif-4", role: "DIFENSORE", status: "STARTER" }),
  player({ playerId: "s-cen-1", role: "CENTROCAMPISTA", status: "STARTER" }),
  player({ playerId: "s-cen-2", role: "CENTROCAMPISTA", status: "STARTER" }),
  player({ playerId: "s-cen-3", role: "CENTROCAMPISTA", status: "STARTER" }),
  player({ playerId: "s-att-1", role: "ATTACCANTE", status: "STARTER" }),
  player({ playerId: "s-att-2", role: "ATTACCANTE", status: "STARTER" }),
  player({ playerId: "s-att-3", role: "ATTACCANTE", status: "STARTER" }),
  player({ playerId: "b-por", role: "PORTIERE", status: "BENCH", benchOrder: 0 }),
  player({ playerId: "b-dif", role: "DIFENSORE", status: "BENCH", benchOrder: 1 }),
  player({ playerId: "b-cen", role: "CENTROCAMPISTA", status: "BENCH", benchOrder: 2 }),
  player({ playerId: "b-att", role: "ATTACCANTE", status: "BENCH", benchOrder: 3 }),
];

const allMatchIds = new Set(roster.map((entry) => entry.playerId));

describe("resolveEffectiveLineup", () => {
  it("keeps 11 starters + 4 bench shape in input roster", () => {
    expect(roster.filter((entry) => entry.status === "STARTER")).toHaveLength(11);
    expect(roster.filter((entry) => entry.status === "BENCH")).toHaveLength(4);
  });

  it("with null participation applies no auto-subs and scores starters in match", () => {
    const result = resolveEffectiveLineup(roster, allMatchIds, null);
    expect(result.substitutions).toEqual([]);
    expect(result.effective).toHaveLength(11);
    expect(result.effective.every((entry) => entry.playerId.startsWith("s-"))).toBe(true);
    expect(result.effective.find((entry) => entry.playerId === "s-por")?.isCaptain).toBe(true);
  });

  it("respects bench order when choosing same-role replacement", () => {
    const withTwoDefBench: LineupPlayer[] = [
      ...roster.filter((entry) => entry.playerId !== "b-dif"),
      player({ playerId: "b-dif-late", role: "DIFENSORE", status: "BENCH", benchOrder: 5 }),
      player({ playerId: "b-dif-early", role: "DIFENSORE", status: "BENCH", benchOrder: 1 }),
    ];
    const matchIds = new Set(withTwoDefBench.map((entry) => entry.playerId));
    const played = new Set(matchIds);
    played.delete("s-dif-1");
    const result = resolveEffectiveLineup(withTwoDefBench, matchIds, played);
    expect(result.substitutions).toEqual([
      {
        playerOutId: "s-dif-1",
        playerInId: "b-dif-early",
        reason: AUTO_SUB_REASON,
        sequence: 1,
      },
    ]);
  });

  it("auto-subs absent starter with same-role bench who played", () => {
    const played = new Set(allMatchIds);
    played.delete("s-att-1");
    const result = resolveEffectiveLineup(roster, allMatchIds, played);
    expect(result.substitutions).toEqual([
      {
        playerOutId: "s-att-1",
        playerInId: "b-att",
        reason: AUTO_SUB_REASON,
        sequence: 1,
      },
    ]);
    expect(result.effective.find((entry) => entry.playerId === "b-att")).toEqual({
      playerId: "b-att",
      role: "ATTACCANTE",
      isCaptain: false,
    });
    expect(result.effective.find((entry) => entry.playerId === "s-att-1")).toBeUndefined();
  });

  it("does not transfer captain bonus to substitute", () => {
    const played = new Set(allMatchIds);
    played.delete("s-por");
    const result = resolveEffectiveLineup(roster, allMatchIds, played);
    expect(result.substitutions[0]?.playerInId).toBe("b-por");
    expect(result.effective.find((entry) => entry.playerId === "b-por")?.isCaptain).toBe(false);
  });

  it("supports multiple substitutions in one match", () => {
    const played = new Set(allMatchIds);
    played.delete("s-dif-1");
    played.delete("s-cen-2");
    const result = resolveEffectiveLineup(roster, allMatchIds, played);
    expect(result.substitutions).toHaveLength(2);
    expect(result.substitutions.map((item) => item.sequence)).toEqual([1, 2]);
    expect(result.effective.some((entry) => entry.playerId === "b-dif")).toBe(true);
    expect(result.effective.some((entry) => entry.playerId === "b-cen")).toBe(true);
  });

  it("skips auto-sub when no valid same-role bench played", () => {
    const played = new Set(allMatchIds);
    played.delete("s-att-1");
    played.delete("b-att");
    const result = resolveEffectiveLineup(roster, allMatchIds, played);
    expect(result.substitutions).toEqual([]);
    expect(result.effective.find((entry) => entry.playerId === "s-att-1")).toBeUndefined();
    expect(result.effective.find((entry) => entry.playerId === "b-att")).toBeUndefined();
  });

  it("ignores starters not involved in the match", () => {
    const matchIds = new Set(["s-por", "b-por", "other"]);
    const result = resolveEffectiveLineup(roster, matchIds, null);
    expect(result.effective).toEqual([
      { playerId: "s-por", role: "PORTIERE", isCaptain: true },
    ]);
    expect(result.substitutions).toEqual([]);
  });

  it("does not use bench when starter played", () => {
    const result = resolveEffectiveLineup(roster, allMatchIds, allMatchIds);
    expect(result.substitutions).toEqual([]);
    expect(result.effective.every((entry) => entry.playerId.startsWith("s-"))).toBe(true);
  });
});
