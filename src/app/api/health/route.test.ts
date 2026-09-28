import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the real `GET /api/health` handler.
 *
 * `@/lib/db/client` is mocked so the suite never opens a PostgreSQL connection;
 * the handler itself is imported and executed for real. The assertions cover
 * both the happy path and the failure path, and pin the response shape so no
 * host, database name, version or secret can leak into the payload.
 */
const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: { execute: mocks.execute },
}));

import { GET, dynamic, runtime } from "./route";

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("returns 200 ok when the database answers", async () => {
    mocks.execute.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ status: "ok" });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it("returns 503 unavailable when the database fails", async () => {
    mocks.execute.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({ status: "unavailable" });
  });

  it("never exposes infrastructure details or secrets", async () => {
    mocks.execute.mockRejectedValue(
      new Error("postgres://user:secret@db.internal:5432/app_album refused"),
    );

    const response = await GET();
    const body = JSON.stringify(await readJson(response));

    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("db.internal");
    expect(body).not.toContain("app_album");
    expect(body).not.toContain("5432");
  });

  it("is never cached", async () => {
    mocks.execute.mockResolvedValue([]);

    const response = await GET();

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dynamic).toBe("force-dynamic");
    expect(runtime).toBe("nodejs");
  });
});
