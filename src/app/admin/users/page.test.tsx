import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Integration tests for the REAL `/admin/users` Server Component.
 *
 * The page only talks to the admin user service; the admin guard lives in
 * `src/app/admin/layout.tsx`, so no auth boundary is mocked here. The Drizzle
 * repository and the `AdminUserService` are replaced before import so the test
 * never touches a database.
 *
 * The Server Actions are NOT involved: this page is read-only.
 */
const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
}));

vi.mock("@/lib/admin/drizzle-repository", () => ({
  DrizzleAdminUserRepository: class {},
}));

vi.mock("@/lib/admin/service", () => ({
  AdminUserService: class {
    listUsers = mocks.listUsers;
  },
}));

/**
 * `user-list.tsx` renders `UserActions`, which imports the `"use server"`
 * module. That module pulls in `next/cache` and the server-only auth stack
 * (and therefore the database client and its environment validation), none of
 * which belong in a render-only test of the page.
 */
vi.mock("./actions", () => ({
  changeRoleAction: vi.fn(),
  changeStatusAction: vi.fn(),
}));

/**
 * The page resolves the signed-in administrator to protect their own row. The
 * auth stack is server-only (session cookie + database), so it is replaced
 * here; the layout guard is not under test.
 */
vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "00000000-0000-4000-8000-000000000001",
    username: "gino",
    role: "admin",
    status: "active",
  })),
}));

import AdminUsersPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listUsers.mockResolvedValue([]);
});

describe("/admin/users Server Component", () => {
  it("shows the empty state instead of a bare table when there are no users", async () => {
    const text = renderToStaticMarkup(await AdminUsersPage());

    expect(text).toContain("Administración de usuarios");
    expect(text).toContain("0 usuarios");
    expect(text).toContain("Todavía no hay usuarios");
    expect(text).not.toContain("<table");
    expect(text).not.toContain("<tbody");
  });

  it("renders the user table and the total count when users exist", async () => {
    mocks.listUsers.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        username: "gino",
        email: "gino@example.com",
        emailOwnerType: "self",
        role: "admin",
        status: "active",
      },
    ]);

    const text = renderToStaticMarkup(await AdminUsersPage());

    expect(text).toContain("1 usuario");
    expect(text).not.toContain("Todavía no hay usuarios");
    expect(text).toContain("<table");
    expect(text).toContain("gino@example.com");
    expect(text).toContain("Administrador");
    expect(text).toContain("Activo");
    // The signed-in administrator's own row is marked and protected.
    expect(text).toContain("Tú");
    expect(text).not.toContain("Degradar");
    expect(text).not.toContain("Bloquear");
  });
});
