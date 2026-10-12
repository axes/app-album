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

import AppLayout from "./layout";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("/app authenticated layout", () => {
  it("redirects to login when there is no current user", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(AppLayout({ children: "private" })).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the shared authenticated shell for the current user", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      username: "erin",
      role: "user",
      status: "active",
    });

    render(await AppLayout({ children: "Contenido privado" }));

    const shell = screen.getByTestId("app-shell");
    expect(shell.getAttribute("data-username")).toBe("erin");
    expect(shell.getAttribute("data-role")).toBe("user");
    expect(screen.getByText("Contenido privado")).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
