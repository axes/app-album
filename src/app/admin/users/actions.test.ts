import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOperationError } from "@/lib/admin/service";

/**
 * The Server Action is the only place where an `AdminOperationError` code turns
 * into the sentence the administrator actually reads, so the mapping is tested
 * here rather than inferred from the policy tests.
 *
 * `next/cache` and the session are mocked because both are server-only; the
 * repository is mocked so the action's own logic — authorization, delegation
 * and message mapping — is what runs.
 */
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const mutateUserMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

vi.mock("@/lib/admin/drizzle-repository", () => ({
  DrizzleAdminUserRepository: class {
    listUsers = vi.fn();
    mutateUser = (...args: unknown[]) => mutateUserMock(...args);
  },
}));

const { changeRoleAction, changeStatusAction } = await import("./actions");

const ACTOR_ID = "00000000-0000-4000-8000-000000000001";
const TARGET_ID = "00000000-0000-4000-8000-000000000002";

const SELF_MUTATION_MESSAGE =
  "No puedes cambiar tu propio rol ni bloquear tu propia cuenta.";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

beforeEach(() => {
  getCurrentUserMock.mockResolvedValue({
    id: ACTOR_ID,
    username: "gino",
    role: "admin",
    status: "active",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("changeRoleAction", () => {
  it("returns the self-protection message when the policy rejects the change", async () => {
    mutateUserMock.mockRejectedValue(new AdminOperationError("self_mutation"));

    const state = await changeRoleAction(
      {},
      formData({ userId: ACTOR_ID, role: "user" }),
    );

    expect(state).toEqual({ error: SELF_MUTATION_MESSAGE });
    expect(state.error).toBe(
      "No puedes cambiar tu propio rol ni bloquear tu propia cuenta.",
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("passes the actor, the target and the requested role to the service", async () => {
    mutateUserMock.mockResolvedValue(undefined);

    const state = await changeRoleAction(
      {},
      formData({ userId: TARGET_ID, role: "admin" }),
    );

    expect(mutateUserMock).toHaveBeenCalledWith(ACTOR_ID, TARGET_ID, {
      type: "role",
      value: "admin",
    });
    expect(state).toEqual({ success: "Rol actualizado." });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("keeps the other messages distinct from the self-protection one", async () => {
    mutateUserMock.mockRejectedValue(new AdminOperationError("last_active_admin"));
    expect(await changeRoleAction({}, formData({ userId: TARGET_ID, role: "user" })))
      .toEqual({ error: "Debe permanecer al menos un administrador activo." });

    mutateUserMock.mockRejectedValue(new AdminOperationError("forbidden"));
    expect(await changeRoleAction({}, formData({ userId: TARGET_ID, role: "user" })))
      .toEqual({ error: "No tienes autorización para realizar esta operación." });
  });

  it("refuses before touching the repository when the actor is not an active admin", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: ACTOR_ID,
      username: "gino",
      role: "user",
      status: "active",
    });

    const state = await changeRoleAction(
      {},
      formData({ userId: TARGET_ID, role: "admin" }),
    );

    expect(state).toEqual({ error: "No tienes autorización para realizar esta operación." });
    expect(mutateUserMock).not.toHaveBeenCalled();
  });
});

describe("changeStatusAction", () => {
  it("returns the self-protection message when blocking yourself", async () => {
    mutateUserMock.mockRejectedValue(new AdminOperationError("self_mutation"));

    const state = await changeStatusAction(
      {},
      formData({ userId: ACTOR_ID, status: "banned" }),
    );

    expect(state).toEqual({ error: SELF_MUTATION_MESSAGE });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("passes the actor, the target and the requested status to the service", async () => {
    mutateUserMock.mockResolvedValue(undefined);

    const state = await changeStatusAction(
      {},
      formData({ userId: TARGET_ID, status: "banned" }),
    );

    expect(mutateUserMock).toHaveBeenCalledWith(ACTOR_ID, TARGET_ID, {
      type: "status",
      value: "banned",
    });
    expect(state).toEqual({ success: "Estado actualizado." });
  });
});
