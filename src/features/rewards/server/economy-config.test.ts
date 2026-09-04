import { describe, expect, it } from "vitest";
import { DEFAULT_REWARD_CONFIGS } from "./economy-config-service";

describe("DEFAULT_REWARD_CONFIGS", () => {
  it("defines default values for dailyLogin, streak, and referral", () => {
    expect(DEFAULT_REWARD_CONFIGS.dailyLogin.rewardLp).toBe(10);
    expect(DEFAULT_REWARD_CONFIGS["streak.threeDays"].rewardLp).toBe(25);
    expect(DEFAULT_REWARD_CONFIGS["streak.sevenDays"].rewardLp).toBe(75);
    expect(DEFAULT_REWARD_CONFIGS["referral.inviter"].rewardLp).toBe(100);
    expect(DEFAULT_REWARD_CONFIGS["referral.invitee"].rewardLp).toBe(50);
  });

  it("all default configs have enabled true and positive integer rewardLp", () => {
    for (const [key, cfg] of Object.entries(DEFAULT_REWARD_CONFIGS)) {
      expect(cfg.key).toBe(key);
      expect(cfg.enabled).toBe(true);
      expect(cfg.rewardLp).toBeGreaterThan(0);
      expect(Number.isInteger(cfg.rewardLp)).toBe(true);
    }
  });
});
