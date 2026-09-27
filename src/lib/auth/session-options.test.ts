import { describe, expect, it } from "vitest";
import {
  buildSessionOptions,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "./session-options";

const SECRET = "a".repeat(48);

describe("buildSessionOptions", () => {
  it("aligns the iron-session ttl with the cookie maxAge (7 days)", () => {
    const options = buildSessionOptions(SECRET, false);
    expect(options.ttl).toBe(SESSION_TTL_SECONDS);
    expect(options.cookieOptions?.maxAge).toBe(SESSION_TTL_SECONDS);
    expect(SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
  });

  it("uses a hardened cookie configuration", () => {
    const options = buildSessionOptions(SECRET, false);
    expect(options.cookieName).toBe(SESSION_COOKIE_NAME);
    expect(options.cookieOptions?.httpOnly).toBe(true);
    expect(options.cookieOptions?.sameSite).toBe("lax");
    expect(options.cookieOptions?.path).toBe("/");
  });

  it("only marks the cookie Secure in production", () => {
    expect(buildSessionOptions(SECRET, false).cookieOptions?.secure).toBe(false);
    expect(buildSessionOptions(SECRET, true).cookieOptions?.secure).toBe(true);
  });

  it("passes the secret through as the sealing password", () => {
    expect(buildSessionOptions(SECRET, false).password).toBe(SECRET);
  });
});
