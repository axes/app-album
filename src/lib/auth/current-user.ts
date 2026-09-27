import "server-only";
import { DrizzleUserRepository } from "./drizzle-repository";
import { AuthService, type AuthenticatedUser } from "./service";
import { getSession } from "./session";
import { resolveCurrentUser } from "./resolve-current-user";

/**
 * Resolves the current user server-side from the sealed session cookie.
 *
 * The session only carries a user id; the identity (and its existence) is
 * always re-checked against PostgreSQL. Returns null when the cookie is
 * missing, malformed, tampered with, or points to a user that no longer
 * exists. This function never mutates cookies: an orphaned session is simply
 * treated as unauthenticated, so `/app` redirects to `/login`. The dead cookie
 * expires on its own (7-day `maxAge`) or is removed by logout.
 *
 * The decision logic lives in the pure `resolveCurrentUser` helper so it can be
 * unit-tested without a database or a real session.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  const service = new AuthService(new DrizzleUserRepository());

  return resolveCurrentUser(session.userId, (id) => service.resolveUserById(id));
}
