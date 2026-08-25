import { describe, expect, it } from "vitest";

import {
  buildReferralLink,
  generateReferralCode,
  getReferralAttributionIssue,
  getReferralCompletionOutcome,
  getReferralRewardKeys,
  isSameDeviceReferral,
  normalizeReferralCode,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_LENGTH,
} from "./referral-domain";

describe("referral codes", () => {
  it("generates a stable-format code from random bytes", () => {
    const code = generateReferralCode(new Uint8Array(REFERRAL_CODE_LENGTH).fill(1));

    expect(code).toBe(REFERRAL_CODE_ALPHABET[1].repeat(REFERRAL_CODE_LENGTH));
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });

  it("normalizes a code and builds the configured app link", () => {
    expect(normalizeReferralCode("  abc234  ")).toBe("ABC234");
    expect(buildReferralLink("https://app.example.test/base", "abc234")).toBe(
      "https://app.example.test/register?ref=ABC234",
    );
  });
});

describe("referral attribution", () => {
  const validInput = {
    codeOwnerId: "referrer",
    codeOwnerEmail: "referrer@example.test",
    referredUserId: "invitee",
    referredEmail: "invitee@example.test",
    hasExistingReferral: false,
  };

  it("accepts a valid referral", () => {
    expect(getReferralAttributionIssue(validInput)).toBeNull();
  });

  it("rejects an invalid code", () => {
    expect(
      getReferralAttributionIssue({
        ...validInput,
        codeOwnerId: null,
        codeOwnerEmail: null,
      }),
    ).toBe("INVALID_CODE");
  });

  it("rejects self-referral by identity or email", () => {
    expect(getReferralAttributionIssue({ ...validInput, referredUserId: "referrer" })).toBe(
      "SELF_REFERRAL",
    );
    expect(
      getReferralAttributionIssue({
        ...validInput,
        referredEmail: "REFERRER@example.test",
      }),
    ).toBe("SELF_REFERRAL");
  });

  it("rejects a second attribution for the same invitee", () => {
    expect(getReferralAttributionIssue({ ...validInput, hasExistingReferral: true })).toBe(
      "ALREADY_ATTRIBUTED",
    );
  });

  it("blocks a known referrer device", () => {
    expect(
      isSameDeviceReferral({
        referredDeviceHash: "same-device",
        referrerDeviceHashes: new Set(["same-device"]),
      }),
    ).toBe(true);
    expect(
      isSameDeviceReferral({
        referredDeviceHash: "other-device",
        referrerDeviceHashes: new Set(["same-device"]),
      }),
    ).toBe(false);
  });
});

describe("referral completion", () => {
  it("supports pending, blocked, and repeated completion states", () => {
    expect(getReferralCompletionOutcome("PENDING")).toBe("COMPLETE");
    expect(getReferralCompletionOutcome("BLOCKED")).toBe("BLOCKED");
    expect(getReferralCompletionOutcome("COMPLETED")).toBe("ALREADY_COMPLETED");
  });

  it("uses one deterministic reward key per beneficiary", () => {
    expect(getReferralRewardKeys("ref-1")).toEqual({
      referrer: "referral:ref-1:referrer",
      invitee: "referral:ref-1:invitee",
    });
  });
});
