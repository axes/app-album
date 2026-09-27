import { describe, expect, it } from "vitest";
import { normalizeBootstrapIdentifier } from "./bootstrap-admin-lib.mjs";

describe("bootstrap admin identifier", () => {
  it("normalizes a username or email", () => {
    expect(normalizeBootstrapIdentifier("  Alice@Example.COM ")).toBe(
      "alice@example.com",
    );
  });

  it("rejects missing or unreasonably long identifiers", () => {
    expect(() => normalizeBootstrapIdentifier(undefined)).toThrow();
    expect(() => normalizeBootstrapIdentifier("x".repeat(255))).toThrow();
  });
});
