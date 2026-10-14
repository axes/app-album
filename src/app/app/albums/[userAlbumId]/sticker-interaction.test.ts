import { describe, expect, it } from "vitest";
import { CLEAR_MS, DURATION_S, intentFor, isCelebration, type Intent } from "./sticker-interaction";

describe("intentFor", () => {
  const cases: Array<[number, number, Intent]> = [
    [0, 1, "obtained"],
    [1, 2, "duplicate"],
    [2, 3, "increment"],
    [3, 4, "increment"],
    [999, 1000, "increment"],
    [3, 2, "decrement"],
    [4, 3, "decrement"],
    [2, 1, "downgrade"],
    [1, 0, "lost"],
  ];

  it.each(cases)("classifies %i → %i as %s", (from, to, expected) => {
    expect(intentFor(from, to)).toBe(expected);
  });

  it("never classifies a loss as a celebration", () => {
    expect(isCelebration(intentFor(1, 0))).toBe(false);
    expect(isCelebration(intentFor(2, 1))).toBe(false);
    expect(isCelebration(intentFor(5, 4))).toBe(false);
  });

  it("celebrates only the first copy and the first duplicate", () => {
    expect(isCelebration(intentFor(0, 1))).toBe(true);
    expect(isCelebration(intentFor(1, 2))).toBe(true);
    expect(isCelebration(intentFor(2, 3))).toBe(false);
  });

  it("keeps every intent inside the documented timing budget", () => {
    const intents: Intent[] = ["obtained", "duplicate", "increment", "decrement", "downgrade", "lost"];
    for (const intent of intents) {
      expect(CLEAR_MS[intent]).toBeGreaterThan(0);
      expect(CLEAR_MS[intent]).toBeLessThanOrEqual(500);
      expect(DURATION_S[intent]).toBeGreaterThan(0);
      expect(DURATION_S[intent] * 1000).toBeLessThanOrEqual(CLEAR_MS[intent]);
    }
  });
});
