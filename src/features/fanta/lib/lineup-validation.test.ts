import { describe, expect, it } from "vitest";

import type { EditableLineupEntry } from "./lineup-validation";
import { validateEditableLineup } from "./lineup-validation";

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

describe("validateEditableLineup", () => {
  it("accepts a complete 4-3-3 with four ordered reserves", () => {
    expect(validateEditableLineup(fullLineup)).toMatchObject({
      valid: true,
      starters: 11,
      bench: 4,
      message: null,
    });
  });

  it("rejects an empty slot created during a sale", () => {
    expect(
      validateEditableLineup(fullLineup.slice(1), [{ role: "PORTIERE", status: "STARTER" }]),
    ).toMatchObject({
      valid: false,
      message: "Completa gli slot vuoti prima di confermare la formazione.",
    });
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
});
