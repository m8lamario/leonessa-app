import { MARKET } from "../constants/fanta";

export const BUDGET_INSUFFICIENT_LABEL = "Budget insufficiente";

export type TransferCostBreakdown = {
  playerValue: number;
  fee: number;
  total: number;
  isFree: boolean;
};

export type SquadMemberForSaleCheck = {
  playerId: string;
  role: string;
  status: "STARTER" | "BENCH";
  value: number;
};

export type MarketPlayerForSaleCheck = {
  id: string;
  role: string;
  fantasyValue: number;
};

export type SellToVacancyDecision =
  | {
      allowed: true;
      reason: "bench_compatible" | "affordable_replacement";
      budgetAfterSale: number;
      minReplacementCost?: number;
    }
  | {
      allowed: false;
      reason: "no_affordable_replacement" | "no_market_replacement";
      budgetAfterSale: number;
      minReplacementCost: number | null;
      message: string;
    };

/** Transfers already used in the current matchday (free + paid). */
export function getTransfersUsed(freeTransfers: number, paidTransfers: number): number {
  return freeTransfers + paidTransfers;
}

/** Commission for the next transfer given how many have already been used. */
export function getTransferFee(transfersUsed: number): number {
  return transfersUsed < MARKET.freeTransfersPerMatchday ? 0 : MARKET.paidTransferCostLp;
}

/**
 * Real purchase cost: player value + optional +10 LP from the 3rd transfer onward.
 * Shared by UI and server — do not reimplement elsewhere.
 */
export function getRealTransferCost(
  playerValue: number,
  transfersUsed: number,
): TransferCostBreakdown {
  const fee = getTransferFee(transfersUsed);
  return {
    playerValue,
    fee,
    total: playerValue + fee,
    isFree: fee === 0,
  };
}

export function canAffordTransfer(
  budgetLp: number,
  playerValue: number,
  transfersUsed: number,
): boolean {
  return budgetLp >= getRealTransferCost(playerValue, transfersUsed).total;
}

/** Net cost when buying one player while selling another in the same transfer. */
export function getNetTransferCost(
  buyValue: number,
  sellValue: number,
  transfersUsed: number,
): number {
  return getRealTransferCost(buyValue, transfersUsed).total - sellValue;
}

export function canAffordNetTransfer(
  budgetLp: number,
  buyValue: number,
  sellValue: number,
  transfersUsed: number,
): boolean {
  return budgetLp >= getNetTransferCost(buyValue, sellValue, transfersUsed);
}

export function formatSellBlockedMessage(
  budgetAfterSale: number,
  minReplacementCost: number,
): string {
  return [
    "Non puoi vendere questo giocatore.",
    "Non avresti abbastanza LP per completare nuovamente la rosa.",
    `Budget dopo vendita: ${budgetAfterSale} LP`,
    `Costo minimo sostituzione: ${minReplacementCost} LP`,
  ].join("\n");
}

/**
 * Before opening a vacancy by selling a player, ensure the slot can still be filled:
 * - starter with a same-role bench → allow (bench can be promoted);
 * - otherwise require that the cheapest compatible market player is affordable
 *   after receiving the sale credit, including any transfer fee.
 */
export function evaluateSellToVacancy(params: {
  selling: SquadMemberForSaleCheck;
  squad: SquadMemberForSaleCheck[];
  marketPlayers: MarketPlayerForSaleCheck[];
  budgetLp: number;
  transfersUsed: number;
}): SellToVacancyDecision {
  const budgetAfterSale = params.budgetLp + params.selling.value;

  if (params.selling.status === "STARTER") {
    const hasCompatibleBench = params.squad.some(
      (member) =>
        member.playerId !== params.selling.playerId &&
        member.status === "BENCH" &&
        member.role === params.selling.role,
    );
    if (hasCompatibleBench) {
      return { allowed: true, reason: "bench_compatible", budgetAfterSale };
    }
  }

  const ownedIds = new Set(params.squad.map((member) => member.playerId));
  const candidates = params.marketPlayers
    .filter(
      (player) =>
        player.id !== params.selling.playerId &&
        !ownedIds.has(player.id) &&
        player.role === params.selling.role,
    )
    .sort((a, b) => a.fantasyValue - b.fantasyValue);

  if (candidates.length === 0) {
    return {
      allowed: false,
      reason: "no_market_replacement",
      budgetAfterSale,
      minReplacementCost: null,
      message: [
        "Non puoi vendere questo giocatore.",
        "Non c'è nessun sostituto compatibile disponibile sul mercato.",
      ].join("\n"),
    };
  }

  const cheapest = candidates[0]!;
  const minReplacementCost = getRealTransferCost(
    cheapest.fantasyValue,
    params.transfersUsed,
  ).total;

  if (budgetAfterSale < minReplacementCost) {
    return {
      allowed: false,
      reason: "no_affordable_replacement",
      budgetAfterSale,
      minReplacementCost,
      message: formatSellBlockedMessage(budgetAfterSale, minReplacementCost),
    };
  }

  return {
    allowed: true,
    reason: "affordable_replacement",
    budgetAfterSale,
    minReplacementCost,
  };
}
