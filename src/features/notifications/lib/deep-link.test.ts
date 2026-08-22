import { describe, expect, it } from "vitest";

import {
  extractMatchIdFromLivePath,
  liveDeepLinkForMatch,
  livePathForMatch,
  resolveAppPathFromDeepLink,
} from "./deep-link";

describe("deep-link helpers", () => {
  it("builds live path and custom scheme", () => {
    expect(livePathForMatch("abc")).toBe("/live/abc");
    expect(liveDeepLinkForMatch("abc")).toBe("leonessa://live/abc");
  });

  it("resolves leonessa://live/{id}", () => {
    expect(resolveAppPathFromDeepLink("leonessa://live/2353708")).toBe("/live/2353708");
  });

  it("resolves leonessa://match/{id} as live", () => {
    expect(resolveAppPathFromDeepLink("leonessa://match/2353708")).toBe("/live/2353708");
  });

  it("resolves https live path", () => {
    expect(resolveAppPathFromDeepLink("https://app.example/live/xyz?x=1")).toBe("/live/xyz");
  });

  it("extracts match id", () => {
    expect(extractMatchIdFromLivePath("/live/abc")).toBe("abc");
    expect(extractMatchIdFromLivePath("/profile")).toBeNull();
  });
});
