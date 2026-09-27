import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for the REAL production boundary `getCurrentUser()`.
 *
 * Unlike `resolve-current-user.test.ts` (which exercises the pure helper), this
 * file imports and runs `src/lib/auth/current-user.ts` itself. Only its true
 * external boundaries are mocked:
 *
 *   - `./session`            -> the sealed-cookie session (no next/headers)
 *   - `./drizzle-repository` -> the PostgreSQL repository (no real DB)
 *
 * `AuthService` and `resolveCurrentUser` stay real, so the wiring
 * getSession -> AuthService -> resolveCurrentUser -> repository is exercised.
 */
const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  getSession: vi.fn(),
  save: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("./drizzle-repository", () => ({
  DrizzleUserRepository: class {
    findById(id: string) {
      return mocks.findById(id);
    }
    findByUsername() {
      return Promise.resolve(null);
    }
    findByEmail() {
      return Promise.resolve(null);
    }
    createUser() {
      return Promise.reject(new Error("createUser must not be called"));
    }
  },
}));

vi.mock("./session", () => ({
  getSession: mocks.getSession,
}));

import { getCurrentUser } from "./current-user";

const VALID_ID = "11111111-1111-4111-8111-111111111111";
const ORPHAN_ID = "22222222-2222-4222-8222-222222222222";

const session = {
  userId: undefined as string | undefined,
  save: mocks.save,
  destroy: mocks.destroy,
};

function setSessionUserId(userId: string | undefined) {
  session.userId = userId;
}

beforeEach(() => {
  vi.clearAllMocks();
  setSessionUserId(undefined);
  mocks.getSession.mockResolvedValue(session);
});

describe("getCurrentUser (real production boundary)", () => {
  it("returns null for an absent session without touching the repository", async () => {
    setSessionUserId(undefined);

    await expect(getCurrentUser()).resolves.toBeNull();

    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns null for an empty session id without touching the repository", async () => {
    setSessionUserId("");

    await expect(getCurrentUser()).resolves.toBeNull();

    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns null for a malformed UUID without querying the repository", async () => {
    setSessionUserId("not-a-uuid");

    await expect(getCurrentUser()).resolves.toBeNull();

    // AuthService.resolveUserById validates the UUID before hitting the repo.
    expect(mocks.findById).not.toHaveBeenCalled();
  });

  it("returns null for a well-formed but orphaned UUID", async () => {
    setSessionUserId(ORPHAN_ID);
    mocks.findById.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();

    expect(mocks.findById).toHaveBeenCalledTimes(1);
    expect(mocks.findById).toHaveBeenCalledWith(ORPHAN_ID);
  });

  it("returns the authenticated user for an existing session id", async () => {
    setSessionUserId(VALID_ID);
    mocks.findById.mockResolvedValue({
      id: VALID_ID,
      username: "erin",
      email: "erin@example.com",
      emailOwnerType: "self",
      role: "user",
      status: "active",
      passwordHash: "$argon2id$fake",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: VALID_ID,
      username: "erin",
      role: "user",
      status: "active",
    });

    expect(mocks.findById).toHaveBeenCalledTimes(1);
    expect(mocks.findById).toHaveBeenCalledWith(VALID_ID);
  });

  it("returns null when an existing session belongs to a banned user", async () => {
    setSessionUserId(VALID_ID);
    mocks.findById.mockResolvedValue({
      id: VALID_ID,
      username: "erin",
      email: "erin@example.com",
      emailOwnerType: "self",
      role: "user",
      status: "banned",
      passwordHash: "$argon2id$fake",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("never calls session.save() or session.destroy() on any render path", async () => {
    // absent
    setSessionUserId(undefined);
    await getCurrentUser();

    // malformed
    setSessionUserId("not-a-uuid");
    await getCurrentUser();

    // orphaned
    setSessionUserId(ORPHAN_ID);
    mocks.findById.mockResolvedValue(null);
    await getCurrentUser();

    // existing
    setSessionUserId(VALID_ID);
    mocks.findById.mockResolvedValue({
      id: VALID_ID,
      username: "erin",
      email: "erin@example.com",
      emailOwnerType: "self",
      role: "user",
      status: "active",
      passwordHash: "$argon2id$fake",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await getCurrentUser();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
});
