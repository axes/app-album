import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  passwordSchema,
  usernameSchema,
} from "./credentials";

describe("usernameSchema", () => {
  it("trims and lowercases valid usernames", () => {
    expect(usernameSchema.parse("  Alice_01  ")).toBe("alice_01");
  });

  it("accepts the boundary lengths 3 and 30", () => {
    expect(usernameSchema.parse("abc")).toBe("abc");
    expect(usernameSchema.parse("a".repeat(30))).toBe("a".repeat(30));
  });

  it("rejects usernames shorter than 3 or longer than 30", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false);
  });

  it("rejects characters outside [a-z0-9_]", () => {
    expect(usernameSchema.safeParse("bad-name").success).toBe(false);
    expect(usernameSchema.safeParse("bad name").success).toBe(false);
    expect(usernameSchema.safeParse("acentué").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts 10 to 128 characters", () => {
    expect(passwordSchema.parse("a".repeat(10))).toBe("a".repeat(10));
    expect(passwordSchema.parse("a".repeat(128))).toBe("a".repeat(128));
  });

  it("rejects passwords outside the allowed length", () => {
    expect(passwordSchema.safeParse("a".repeat(9)).success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("does not trim whitespace", () => {
    const password = "  spaced  ";
    expect(passwordSchema.parse(password)).toBe(password);
  });
});

describe("credentialsSchema", () => {
  it("normalizes the username while preserving the password", () => {
    const result = credentialsSchema.parse({
      username: "  Bob_99 ",
      password: "  secret-pass  ",
    });
    expect(result).toEqual({
      username: "bob_99",
      password: "  secret-pass  ",
    });
  });
});
