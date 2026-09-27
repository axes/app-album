import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import AdminLayout from "./layout";

beforeEach(() => vi.clearAllMocks());

describe("/admin authorization layout", () => {
  it("rejects a normal user even when the URL is requested directly", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      username: "normal",
      role: "user",
      status: "active",
    });
    await expect(AdminLayout({ children: "private" })).rejects.toThrow(
      "NEXT_REDIRECT:/app",
    );
  });

  it("renders admin routes for an active administrator", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      role: "admin",
      status: "active",
    });
    await expect(AdminLayout({ children: "private" })).resolves.toBe("private");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
