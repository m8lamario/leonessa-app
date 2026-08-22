import { describe, expect, it } from "vitest";

import {
  buildMatchStartIdempotencyKey,
  buildMatchStartIdempotencyKeyForDevice,
} from "./idempotency";

describe("match-start idempotency keys remain stable across seconds", () => {
  it("collapses to the same UTC minute", () => {
    const a = new Date("2026-05-13T19:30:01.000Z");
    const b = new Date("2026-05-13T19:30:59.999Z");
    expect(buildMatchStartIdempotencyKey("m1", a)).toBe(buildMatchStartIdempotencyKey("m1", b));
    expect(buildMatchStartIdempotencyKeyForDevice("m1", a, "d1")).toBe(
      buildMatchStartIdempotencyKeyForDevice("m1", b, "d1"),
    );
  });

  it("changes when kickoff minute changes", () => {
    const a = new Date("2026-05-13T19:30:00.000Z");
    const b = new Date("2026-05-13T19:31:00.000Z");
    expect(buildMatchStartIdempotencyKey("m1", a)).not.toBe(buildMatchStartIdempotencyKey("m1", b));
  });
});
