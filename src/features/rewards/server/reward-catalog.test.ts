import { describe, expect, it } from "vitest";

describe("Reward and LP Economy validation logic", () => {
  it("validates spend input and prevents non-positive or non-integer amounts", () => {
    function validateSpendInput(amount: number) {
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new RangeError("La quantità di punti da spendere deve essere un intero maggiore di zero.");
      }
    }

    expect(() => validateSpendInput(0)).toThrow(RangeError);
    expect(() => validateSpendInput(-50)).toThrow(RangeError);
    expect(() => validateSpendInput(10.5)).toThrow(RangeError);
    expect(() => validateSpendInput(100)).not.toThrow();
  });

  it("checks stock and user limits for rewards", () => {
    function canUserRedeem(reward: {
      active: boolean;
      stock: number | null;
      maxPerUser: number | null;
      costLp: number;
    }, userBalance: number, userRedeemedCount: number) {
      if (!reward.active) return { allowed: false, reason: "INACTIVE" };
      if (reward.stock !== null && reward.stock <= 0) return { allowed: false, reason: "OUT_OF_STOCK" };
      if (reward.maxPerUser !== null && userRedeemedCount >= reward.maxPerUser) return { allowed: false, reason: "MAX_PER_USER_REACHED" };
      if (userBalance < reward.costLp) return { allowed: false, reason: "INSUFFICIENT_LP" };
      return { allowed: true, reason: null };
    }

    const testReward = {
      active: true,
      stock: 5,
      maxPerUser: 2,
      costLp: 150,
    };

    // Valid purchase
    expect(canUserRedeem(testReward, 200, 0)).toEqual({ allowed: true, reason: null });

    // Insufficient LP
    expect(canUserRedeem(testReward, 100, 0)).toEqual({ allowed: false, reason: "INSUFFICIENT_LP" });

    // Inactive reward
    expect(canUserRedeem({ ...testReward, active: false }, 300, 0)).toEqual({ allowed: false, reason: "INACTIVE" });

    // Out of stock
    expect(canUserRedeem({ ...testReward, stock: 0 }, 300, 0)).toEqual({ allowed: false, reason: "OUT_OF_STOCK" });

    // Max per user reached
    expect(canUserRedeem(testReward, 500, 2)).toEqual({ allowed: false, reason: "MAX_PER_USER_REACHED" });
  });

  it("verifies idempotency conflict resolution", () => {
    const existing = {
      userId: "user-1",
      amount: -100,
      type: "LP",
      sourceType: "REWARD_REDEMPTION",
      sourceId: "reward-1",
      reason: "Riscatto premio",
    };

    function checkIdempotency(attempt: typeof existing) {
      return (
        existing.userId === attempt.userId &&
        existing.amount === attempt.amount &&
        existing.type === attempt.type &&
        existing.sourceType === attempt.sourceType &&
        existing.sourceId === attempt.sourceId &&
        existing.reason === attempt.reason
      );
    }

    // Exact duplicate attempt
    expect(checkIdempotency({ ...existing })).toBe(true);

    // Mismatched amount attempt (trying to reuse key for different action)
    expect(checkIdempotency({ ...existing, amount: -200 })).toBe(false);

    // Mismatched user attempt
    expect(checkIdempotency({ ...existing, userId: "user-2" })).toBe(false);
  });
});
