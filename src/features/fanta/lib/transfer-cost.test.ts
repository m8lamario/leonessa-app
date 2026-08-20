import { describe, expect, it } from "vitest";

import { networkErrorMessage, readApiErrorMessage } from "./market-feedback";
import {
  BUDGET_INSUFFICIENT_LABEL,
  canAffordNetTransfer,
  canAffordTransfer,
  evaluateSellToVacancy,
  formatSellBlockedMessage,
  getNetTransferCost,
  getRealTransferCost,
  getTransferFee,
  getTransfersUsed,
} from "./transfer-cost";

const squad = [
  { playerId: "starter-att", role: "ATTACCANTE", status: "STARTER" as const, value: 50 },
  { playerId: "bench-att", role: "ATTACCANTE", status: "BENCH" as const, value: 20 },
  { playerId: "starter-cen", role: "CENTROCAMPISTA", status: "STARTER" as const, value: 40 },
];

const market = [
  { id: "cheap-att", role: "ATTACCANTE", fantasyValue: 50 },
  { id: "pricey-att", role: "ATTACCANTE", fantasyValue: 80 },
  { id: "cen", role: "CENTROCAMPISTA", fantasyValue: 30 },
];

describe("getRealTransferCost", () => {
  it("1° cambio → solo costo giocatore", () => {
    expect(getTransfersUsed(0, 0)).toBe(0);
    expect(getTransferFee(0)).toBe(0);
    expect(getRealTransferCost(50, 0)).toEqual({
      playerValue: 50,
      fee: 0,
      total: 50,
      isFree: true,
    });
  });

  it("2° cambio → solo costo giocatore", () => {
    expect(getRealTransferCost(50, 1).total).toBe(50);
    expect(getRealTransferCost(50, 1).isFree).toBe(true);
  });

  it("3° cambio → costo +10 LP", () => {
    expect(getTransferFee(2)).toBe(10);
    expect(getRealTransferCost(50, 2)).toEqual({
      playerValue: 50,
      fee: 10,
      total: 60,
      isFree: false,
    });
  });

  it("giocatore da 50 con budget 50 al 3° cambio → non acquistabile", () => {
    expect(canAffordTransfer(50, 50, 2)).toBe(false);
  });

  it("giocatore da 50 con budget 60 al 3° cambio → acquistabile", () => {
    expect(canAffordTransfer(60, 50, 2)).toBe(true);
  });

  it("vendita 50 → riacquisto 50 con commissione e budget sufficiente", () => {
    expect(canAffordTransfer(60, 50, 2)).toBe(true);
    expect(getNetTransferCost(50, 50, 2)).toBe(10);
    expect(canAffordNetTransfer(10, 50, 50, 2)).toBe(true);
  });

  it("vendita 50 → riacquisto 50 con budget insufficiente", () => {
    expect(canAffordTransfer(55, 50, 2)).toBe(false);
    expect(getRealTransferCost(50, 2).total).toBe(60);
    expect(canAffordNetTransfer(5, 50, 50, 2)).toBe(false);
  });
});

describe("evaluateSellToVacancy", () => {
  it("vendita con riserva compatibile → consentita", () => {
    expect(
      evaluateSellToVacancy({
        selling: squad[0]!,
        squad,
        marketPlayers: market,
        budgetLp: 5,
        transfersUsed: 2,
      }),
    ).toMatchObject({ allowed: true, reason: "bench_compatible" });
  });

  it("vendita senza riserva e con sostituto acquistabile → consentita", () => {
    expect(
      evaluateSellToVacancy({
        selling: squad[2]!,
        squad,
        marketPlayers: market,
        budgetLp: 30,
        transfersUsed: 2,
      }),
    ).toMatchObject({
      allowed: true,
      reason: "affordable_replacement",
      budgetAfterSale: 70,
      minReplacementCost: 40,
    });
  });

  it("vendita senza riserva e senza budget sufficiente per il sostituto → bloccata", () => {
    const decision = evaluateSellToVacancy({
      selling: {
        playerId: "starter-att",
        role: "ATTACCANTE",
        status: "STARTER",
        value: 50,
      },
      squad: [squad[0]!],
      marketPlayers: market,
      budgetLp: 5,
      transfersUsed: 2,
    });

    expect(decision).toEqual({
      allowed: false,
      reason: "no_affordable_replacement",
      budgetAfterSale: 55,
      minReplacementCost: 60,
      message: formatSellBlockedMessage(55, 60),
    });
    if (!decision.allowed) {
      expect(decision.message).toContain("Non puoi vendere questo giocatore");
      expect(decision.message).toContain(
        "Non avresti abbastanza LP per completare nuovamente la rosa.",
      );
      expect(decision.message).toContain("Budget dopo vendita: 55 LP");
      expect(decision.message).toContain("Costo minimo sostituzione: 60 LP");
    }
  });
});

describe("market feedback", () => {
  it("errore server → messaggio visibile dalla risposta API", () => {
    expect(readApiErrorMessage({ message: "Budget LP insufficiente." })).toBe(
      "Budget LP insufficiente.",
    );
    expect(readApiErrorMessage({})).toBe("Operazione non riuscita. Riprova.");
    expect(networkErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(BUDGET_INSUFFICIENT_LABEL).toBe("Budget insufficiente");
  });
});
