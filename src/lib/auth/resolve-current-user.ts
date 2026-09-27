import type { AuthenticatedUser } from "./service";

/**
 * Resolver contract: given a session-stored id, return the matching user or
 * null. In production this is `AuthService.resolveUserById`, which validates
 * the id as a UUID and re-checks the database.
 */
export type UserResolver = (id: unknown) => Promise<AuthenticatedUser | null>;

/**
 * Pure, injectable resolution of the current user from a session-stored id.
 *
 * It performs no I/O and never touches cookies: it only decides whether the
 * session carries an id and delegates the lookup to the injected resolver.
 * An absent or empty id resolves to null without calling the resolver; a
 * malformed or orphaned id resolves to null through the resolver.
 *
 * Keeping this free of Next.js request APIs, `server-only` and the database
 * makes it directly unit-testable; `getCurrentUser()` is the server-only
 * wrapper.
 */
export async function resolveCurrentUser(
  sessionUserId: unknown,
  resolveUserById: UserResolver,
): Promise<AuthenticatedUser | null> {
  if (typeof sessionUserId !== "string" || sessionUserId.length === 0) {
    return null;
  }

  return resolveUserById(sessionUserId);
}
