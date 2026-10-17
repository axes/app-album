/**
 * Safety gate for the integration suites.
 *
 * The integration tests in this repository create and delete real rows
 * (`users`, `albums`, `stickers`, `user_albums`, …). They must never run
 * against a database that holds data somebody cares about, so every suite
 * resolves its connection string through this module instead of reading
 * `process.env.DATABASE_URL` directly.
 *
 * Rules, in order:
 *
 *   1. `TEST_DATABASE_URL` wins when it is set. It is the explicit opt-in: the
 *      operator has named a database on purpose, so the host is not inspected.
 *      The value is also copied into `DATABASE_URL`, because the application's
 *      own client (`@/lib/db/client`) reads that variable — without the copy
 *      the repositories would keep talking to a different database than the
 *      suite's raw `sql` client.
 *   2. Otherwise `DATABASE_URL` is used, but only when its host is local
 *      (`localhost`, `127.0.0.1` or `::1`). A remote host — a Neon branch, a
 *      staging server, anything else — aborts the run.
 *   3. When neither variable is set the suites are skipped, which is the
 *      default in CI and in a plain `npm test`.
 *
 * A rejected URL throws at import time, so Vitest reports the file as a failed
 * suite with the message below instead of quietly mutating a remote database.
 */

/** Hosts that are unambiguously a local, disposable database. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const REFUSAL = [
  "Refusing to run integration tests against a non-local database.",
  "",
  "These suites insert and delete real rows, so they only run against a local,",
  "disposable PostgreSQL instance.",
  "",
  "  - Point DATABASE_URL at localhost / 127.0.0.1, or",
  "  - set TEST_DATABASE_URL to the database you explicitly want to use.",
  "",
  "Never point either variable at a shared or production database.",
].join("\n");

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Resolves the connection string for an integration suite.
 *
 * @returns the URL to connect to, or `null` when the suite must be skipped.
 * @throws when a URL is configured but is not safe to use.
 */
export function resolveIntegrationDatabaseUrl(): string | null {
  const explicit = process.env.TEST_DATABASE_URL?.trim();
  if (explicit) {
    // Keep the application client and the suite's raw client on the same
    // database; `@/lib/db/client` reads `DATABASE_URL`.
    process.env.DATABASE_URL = explicit;
    return explicit;
  }

  const fallback = process.env.DATABASE_URL?.trim();
  if (!fallback) return null;

  const host = hostOf(fallback);
  if (host === null) {
    throw new Error(`${REFUSAL}\n\nDATABASE_URL is not a valid URL.`);
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`${REFUSAL}\n\nDATABASE_URL points at "${host}".`);
  }

  return fallback;
}
