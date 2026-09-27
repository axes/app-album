import type { SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
};

export const SESSION_COOKIE_NAME = "app_album_session";

/**
 * Session lifetime: 7 days. `ttl` (iron-session seal validity) and the cookie
 * `maxAge` are kept explicitly aligned so the sealed payload and the browser
 * cookie expire together.
 */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Pure builder for the iron-session options. Kept free of `env` and
 * `next/headers` so it can be unit-tested directly.
 */
export function buildSessionOptions(
  secret: string,
  isProduction: boolean,
): SessionOptions {
  return {
    password: secret,
    cookieName: SESSION_COOKIE_NAME,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}
