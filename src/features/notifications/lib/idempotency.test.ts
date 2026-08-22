import { describe, expect, it } from "vitest";

import {
  buildMatchStartIdempotencyKey,
  buildMatchStartIdempotencyKeyForDevice,
} from "./idempotency";

describe("buildMatchStartIdempotencyKey", () => {
  it("uses match id, type, and kickoff minute", () => {
    const startAt = new Date("2026-05-13T19:30:45.123Z");
    expect(buildMatchStartIdempotencyKey("2353708b", startAt)).toBe(
      "2353708b-match-start-2026-05-13T19:30",
    );
  });

  it("changes when kickoff minute changes", () => {
    const a = buildMatchStartIdempotencyKey("m1", new Date("2026-05-13T19:30:00Z"));
    const b = buildMatchStartIdempotencyKey("m1", new Date("2026-05-13T20:00:00Z"));
    expect(a).not.toBe(b);
  });

  it("scopes per device", () => {
    const startAt = new Date("2026-05-13T19:30:00Z");
    expect(buildMatchStartIdempotencyKeyForDevice("m1", startAt, "dev-a")).toBe(
      "m1-match-start-2026-05-13T19:30:dev-a",
    );
  });
});
