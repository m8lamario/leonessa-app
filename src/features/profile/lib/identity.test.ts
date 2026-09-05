import { describe, expect, it } from "vitest";

import { compareNumericRows, formatUserInitials, formatUserName } from "./identity";

describe("identity helpers", () => {
  it("formats public names without inventing usernames", () => {
    expect(formatUserName({ name: "Mario", surname: "Rossi" })).toBe("Mario Rossi");
    expect(formatUserName({ name: null, surname: null })).toBe("Tifoso");
    expect(formatUserInitials({ name: "Mario", surname: "Rossi" })).toBe("MR");
  });

  it("compares real numeric stats, including inverted ranks", () => {
    expect(compareNumericRows("Livello", 18, 21).highlight).toBe("theirs");
    expect(compareNumericRows("Fanta", 24, 8, { invert: true, prefix: "#" }).highlight).toBe("theirs");
    expect(compareNumericRows("Badge", 12, 12).highlight).toBe("tie");
    expect(compareNumericRows("Pronostici", null, 72, { suffix: "%" }).theirs).toBe("72%");
  });
});
