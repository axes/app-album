import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveIntegrationDatabaseUrl } from "./integration-database";

/**
 * The guard is the only thing standing between the integration suites and a
 * database that holds real data, so it is tested directly: the suites
 * themselves are skipped in the default run and would never exercise it.
 */
const ORIGINAL = {
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
};

function setEnv(values: { DATABASE_URL?: string; TEST_DATABASE_URL?: string }) {
  for (const key of ["DATABASE_URL", "TEST_DATABASE_URL"] as const) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  setEnv(ORIGINAL);
  vi.unstubAllEnvs();
});

describe("resolveIntegrationDatabaseUrl", () => {
  it("skips the suites when no database is configured", () => {
    setEnv({});
    expect(resolveIntegrationDatabaseUrl()).toBeNull();
  });

  it("treats a blank value as unset", () => {
    setEnv({ DATABASE_URL: "   ", TEST_DATABASE_URL: "" });
    expect(resolveIntegrationDatabaseUrl()).toBeNull();
  });

  it("accepts a local DATABASE_URL", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      setEnv({ DATABASE_URL: `postgresql://app_album:secret@${host}:55432/app_album` });
      expect(resolveIntegrationDatabaseUrl()).toContain(host);
    }
  });

  it("refuses a remote DATABASE_URL and names the offending host", () => {
    setEnv({
      DATABASE_URL:
        "postgresql://neondb_owner:secret@ep-young-dream-b4gwnu1o-pooler.c-6.us-east-2.aws.neon.tech/neondb",
    });

    expect(() => resolveIntegrationDatabaseUrl()).toThrowError(
      /Refusing to run integration tests against a non-local database/,
    );
    expect(() => resolveIntegrationDatabaseUrl()).toThrowError(
      /ep-young-dream-b4gwnu1o-pooler\.c-6\.us-east-2\.aws\.neon\.tech/,
    );
  });

  it("refuses a malformed DATABASE_URL instead of guessing", () => {
    setEnv({ DATABASE_URL: "not-a-url" });
    expect(() => resolveIntegrationDatabaseUrl()).toThrowError(/not a valid URL/);
  });

  it("lets TEST_DATABASE_URL opt in explicitly, whatever the host", () => {
    setEnv({
      DATABASE_URL: "postgresql://app_album:secret@localhost:55432/app_album",
      TEST_DATABASE_URL: "postgresql://tester:secret@db.internal.example:5432/app_album_test",
    });

    expect(resolveIntegrationDatabaseUrl()).toBe(
      "postgresql://tester:secret@db.internal.example:5432/app_album_test",
    );
    // The application client reads DATABASE_URL, so it must follow the opt-in.
    expect(process.env.DATABASE_URL).toBe(
      "postgresql://tester:secret@db.internal.example:5432/app_album_test",
    );
  });

  it("prefers TEST_DATABASE_URL over a local DATABASE_URL", () => {
    setEnv({
      DATABASE_URL: "postgresql://app_album:secret@localhost:55432/app_album",
      TEST_DATABASE_URL: "postgresql://tester:secret@127.0.0.1:55433/app_album_test",
    });

    expect(resolveIntegrationDatabaseUrl()).toContain("55433");
  });
});
