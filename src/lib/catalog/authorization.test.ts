import { describe, expect, it } from "vitest";
import { assertActiveAdmin } from "./authorization";
import { CatalogError } from "./service";

function code(actor: { role: "user" | "admin"; status: "active" | "banned" } | null) {
  try { assertActiveAdmin(actor); return null; }
  catch (error) { return error instanceof CatalogError ? error.code : "unexpected"; }
}

describe("catalog mutation authorization", () => {
  it("allows only active admins", () => {
    expect(() => assertActiveAdmin({ role: "admin", status: "active" })).not.toThrow();
    expect(code({ role: "user", status: "active" })).toBe("forbidden");
    expect(code({ role: "admin", status: "banned" })).toBe("forbidden");
    expect(code(null)).toBe("forbidden");
  });
});
