import { describe, expect, it } from "vitest";
import {
  ARGON2_OPTIONS,
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "./password";

describe("ARGON2_OPTIONS", () => {
  it("pins the Argon2id variant and OWASP baseline parameters", () => {
    // 2 is Algorithm.Argon2id in @node-rs/argon2 (ambient const enum, unusable
    // under isolatedModules). Locking the literal keeps the variant explicit.
    expect(ARGON2_OPTIONS.algorithm).toBe(2);
    expect(ARGON2_OPTIONS.memoryCost).toBe(19456);
    expect(ARGON2_OPTIONS.timeCost).toBe(2);
    expect(ARGON2_OPTIONS.parallelism).toBe(1);
  });
});

describe("password hashing", () => {
  it("produces an Argon2id hash that is not the plaintext", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery");
    await expect(verifyPassword(hash, "correct horse battery")).resolves.toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery");
    await expect(verifyPassword(hash, "wrong password")).resolves.toBe(false);
  });

  it("salts hashes so identical passwords differ", async () => {
    const first = await hashPassword("same-password");
    const second = await hashPassword("same-password");
    expect(first).not.toBe(second);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    await expect(verifyPassword("not-a-hash", "whatever")).resolves.toBe(false);
  });

  it("ships a precomputed dummy hash that is a valid Argon2id hash", async () => {
    expect(DUMMY_PASSWORD_HASH.startsWith("$argon2id$")).toBe(true);
    // Same parameters as real hashes (m=19456,t=2,p=1).
    expect(DUMMY_PASSWORD_HASH).toContain("m=19456,t=2,p=1");
    // It must be a real, verifiable hash (not a placeholder string).
    await expect(
      verifyPassword(DUMMY_PASSWORD_HASH, "dummy-password-for-timing"),
    ).resolves.toBe(true);
    await expect(
      verifyPassword(DUMMY_PASSWORD_HASH, "some-other-password"),
    ).resolves.toBe(false);
  });
});
