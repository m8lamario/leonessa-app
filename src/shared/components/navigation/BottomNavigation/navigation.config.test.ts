import { describe, expect, it } from "vitest";

import { bottomNavigationItems, isBottomNavItemActive } from "./navigation.config";

describe("bottom navigation", () => {
  it("replaces profile with altro as the fourth destination", () => {
    expect(bottomNavigationItems.map((item) => item.id)).toEqual([
      "home",
      "fanta",
      "ranking",
      "altro",
    ]);
    expect(bottomNavigationItems[3]?.href).toBe("/altro");
  });

  it("marks altro active on the hub and its subpages", () => {
    const altro = bottomNavigationItems.find((item) => item.id === "altro");
    expect(altro).toBeDefined();
    if (!altro) return;

    expect(isBottomNavItemActive("/altro", altro)).toBe(true);
    expect(isBottomNavItemActive("/altro/missioni", altro)).toBe(true);
    expect(isBottomNavItemActive("/profile", altro)).toBe(false);
    expect(isBottomNavItemActive("/dashboard", altro)).toBe(false);
  });

  it("keeps home inactive on other authenticated routes", () => {
    const home = bottomNavigationItems[0];
    expect(isBottomNavItemActive("/dashboard", home)).toBe(true);
    expect(isBottomNavItemActive("/altro", home)).toBe(false);
    expect(isBottomNavItemActive("/profile", home)).toBe(false);
  });
});
