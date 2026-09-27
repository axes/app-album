import { describe, expect, it } from "vitest";
import { isActiveAdmin } from "./authorization";

describe("isActiveAdmin", () => {
  it("allows only active administrators", () => {
    expect(isActiveAdmin({ id: "1", username: "a", role: "admin", status: "active" })).toBe(true);
    expect(isActiveAdmin({ id: "2", username: "u", role: "user", status: "active" })).toBe(false);
    expect(isActiveAdmin(null)).toBe(false);
  });
});
