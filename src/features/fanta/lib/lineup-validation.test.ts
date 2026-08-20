import { describe, expect, it } from "vitest";

import type { EditableLineupEntry } from "./lineup-validation";
import { validateEditableLineup, validateRosterPlayers } from "./lineup-validation";

const fullLineup: EditableLineupEntry[] = [
  { role: "PORTIERE", status: "STARTER", isCaptain: true },
  ...Array.from({ length: 4 }, () => ({
    role: "DIFENSORE",
    status: "STARTER" as const,
    isCaptain: false,
  })),
  ...Array.from({ length: 3 }, () => ({
    role: "CENTROCAMPISTA",
    status: "STARTER" as const,
    isCaptain: false,
  })),
  ...Array.from({ length: 3 }, () => ({
    role: "ATTACCANTE",
    status: "STARTER" as const,
    isCaptain: false,
  })),
  ...(["PORTIERE", "DIFENSORE", "CENTROCAMPISTA", "ATTACCANTE"] as const).map((role) => ({
    role,
    status: "BENCH" as const,
    isCaptain: false,
  })),
];

const starters = fullLineup.filter((player) => player.status === "STARTER");
const bench = fullLineup.filter((player) => player.status === "BENCH");

function roster(starterCount: number, benchCount: number): EditableLineupEntry[] {
  return [...starters.slice(0, starterCount), ...bench.slice(0, benchCount)];
}

describe("validateEditableLineup", () => {
  it("11 giocatori → invalido", () => {
    expect(validateEditableLineup(roster(11, 0))).toMatchObject({
      valid: false,
      message: "La rosa deve avere almeno 1 riserva.",
    });
  });

  it("12 → valido", () => {
    expect(validateEditableLineup(roster(11, 1))).toMatchObject({
      valid: true,
      starters: 11,
      bench: 1,
      message: null,
    });
  });

  it("13 → valido", () => {
    expect(validateEditableLineup(roster(11, 2))).toMatchObject({ valid: true, bench: 2 });
  });

  it("14 → valido", () => {
    expect(validateEditableLineup(roster(11, 3))).toMatchObject({ valid: true, bench: 3 });
  });

  it("15 → valido", () => {
    expect(validateEditableLineup(roster(11, 4))).toMatchObject({
      valid: true,
      starters: 11,
      bench: 4,
      message: null,
    });
  });

  it("10 titolari + 2 riserve → invalido", () => {
    expect(validateEditableLineup(roster(10, 2))).toMatchObject({
      valid: false,
      message: "La rosa deve avere esattamente 11 titolari.",
    });
  });

  it("11 titolari + 0 riserve → invalido", () => {
    expect(validateEditableLineup(roster(11, 0))).toMatchObject({
      valid: false,
      message: "La rosa deve avere almeno 1 riserva.",
    });
  });

  it("11 titolari + 5 riserve → invalido", () => {
    const extraBench: EditableLineupEntry = {
      role: "ATTACCANTE",
      status: "BENCH",
      isCaptain: false,
    };
    expect(validateEditableLineup([...roster(11, 4), extraBench])).toMatchObject({
      valid: false,
      message: "La rosa può avere al massimo 4 riserve.",
    });
  });

  it("rejects an empty starter slot created during a sale", () => {
    expect(
      validateEditableLineup(fullLineup.slice(1), [{ role: "PORTIERE", status: "STARTER" }]),
    ).toMatchObject({
      valid: false,
      message: "Completa gli slot vuoti tra i titolari prima di confermare la formazione.",
    });
  });

  it("allows a bench vacancy when 11 starters and at least one reserve remain", () => {
    expect(
      validateEditableLineup(roster(11, 2), [{ role: "ATTACCANTE", status: "BENCH" }]),
    ).toMatchObject({ valid: true });
  });

  it("requires exactly one starter captain", () => {
    const withoutCaptain = fullLineup.map((player) => ({ ...player, isCaptain: false }));

    expect(validateEditableLineup(withoutCaptain)).toMatchObject({
      valid: false,
      message: "Scegli un capitano tra i titolari.",
    });
  });

  it("rejects a role-invalid starter formation", () => {
    const invalid = fullLineup.map((player, index) =>
      index === 1 ? { ...player, role: "ATTACCANTE" } : player,
    );

    expect(validateEditableLineup(invalid)).toMatchObject({
      valid: false,
      message: "I titolari richiedono 4 difensore.",
    });
  });

  it("market shape checks do not require a captain", () => {
    const withoutCaptain = roster(11, 1).map((player) => ({ ...player, isCaptain: false }));
    expect(validateRosterPlayers(withoutCaptain, { requireCaptain: false })).toMatchObject({
      valid: true,
    });
  });
});
