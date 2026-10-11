// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/ui/app-shell", () => ({
  AppShell: ({ user, children }: { user: { username: string; role: string }; children: React.ReactNode }) => (
    <div data-testid="app-shell" data-role={user.role} data-username={user.username}>
      {children}
    </div>
  ),
}));

import AdminLayout from "./layout";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

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

  it("rejects a banned administrator", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      role: "admin",
      status: "banned",
    });
    await expect(AdminLayout({ children: "private" })).rejects.toThrow(
      "NEXT_REDIRECT:/app",
    );
  });

  it("renders active admin routes in the shared authenticated shell", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      role: "admin",
      status: "active",
    });

    render(await AdminLayout({ children: "private" }));

    const shell = screen.getByTestId("app-shell");
    expect(shell.getAttribute("data-username")).toBe("admin");
    expect(shell.getAttribute("data-role")).toBe("admin");
    expect(screen.getByText("private")).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
