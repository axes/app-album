import { describe, expect, it } from "vitest";
import { assertAdminMutationAllowed } from "./policy";
import { AdminOperationError, type AdminUser } from "./service";

const admin: AdminUser = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "admin",
  email: "admin@example.com",
  emailOwnerType: "self",
  role: "admin",
  status: "active",
};
const user: AdminUser = {
  ...admin,
  id: "00000000-0000-4000-8000-000000000002",
  username: "user",
  email: "user@example.com",
  role: "user",
};

function errorCode(run: () => void) {
  try {
    run();
  } catch (error) {
    return error instanceof AdminOperationError ? error.code : "unexpected";
  }
  return null;
}

describe("admin mutation policy", () => {
  it("allows promotion, degradation, blocking and unblocking when safe", () => {
    expect(() => assertAdminMutationAllowed(admin, user, { type: "role", value: "admin" }, 1)).not.toThrow();
    expect(() => assertAdminMutationAllowed(admin, { ...admin, id: user.id }, { type: "role", value: "user" }, 2)).not.toThrow();
    expect(() => assertAdminMutationAllowed(admin, user, { type: "status", value: "banned" }, 1)).not.toThrow();
    expect(() => assertAdminMutationAllowed(admin, { ...user, status: "banned" }, { type: "status", value: "active" }, 1)).not.toThrow();
  });

  it("rejects degradation or blocking of the last active admin", () => {
    expect(errorCode(() => assertAdminMutationAllowed(admin, admin, { type: "role", value: "user" }, 1))).toBe("last_active_admin");
    expect(errorCode(() => assertAdminMutationAllowed(admin, admin, { type: "status", value: "banned" }, 1))).toBe("last_active_admin");
  });

  it("rejects operations by a normal, banned or missing actor", () => {
    expect(errorCode(() => assertAdminMutationAllowed(user, user, { type: "role", value: "admin" }, 1))).toBe("forbidden");
    expect(errorCode(() => assertAdminMutationAllowed({ ...admin, status: "banned" }, user, { type: "role", value: "admin" }, 1))).toBe("forbidden");
    expect(errorCode(() => assertAdminMutationAllowed(null, user, { type: "role", value: "admin" }, 1))).toBe("forbidden");
  });
});
