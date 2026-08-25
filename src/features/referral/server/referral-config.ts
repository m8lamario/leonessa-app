import "server-only";

import { env } from "@/env";

import type { ReferralCompletionEvent } from "../lib/referral-domain";

export type ReferralProgramConfig = {
  completionEvent: ReferralCompletionEvent | null;
  referrerRewardLp: number | null;
  inviteeRewardLp: number | null;
};

export function getReferralProgramConfig(): ReferralProgramConfig {
  return {
    completionEvent: env.REFERRAL_COMPLETION_EVENT ?? null,
    referrerRewardLp: env.REFERRAL_REFERRER_REWARD_LP ?? null,
    inviteeRewardLp: env.REFERRAL_INVITEE_REWARD_LP ?? null,
  };
}

export function isReferralProgramConfigured(config: ReferralProgramConfig) {
  return Boolean(config.completionEvent && config.referrerRewardLp && config.inviteeRewardLp);
}
