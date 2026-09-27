import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

/**
 * Integration tests for the REAL `/app` Server Component.
 *
 * The module under test is `src/app/app/page.tsx`; its three external
 * boundaries are mocked before import:
 *
 *   - `next/navigation`        -> `redirect` (throws, like Next.js does)
 *   - `@/lib/auth/current-user`-> `getCurrentUser`
 *   - `@/app/logout/actions`   -> `logoutAction`
 *
 * The component function is then invoked directly and its returned React tree
 * is inspected structurally (no DOM/jsdom required).
 */
const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getCurrentUser: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/app/logout/actions", () => ({
  logoutAction: mocks.logoutAction,
}));

import AppPage from "./page";

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }
  const element = node as ReactElement<{ children?: ReactNode }>;
  return collectText(element.props?.children);
}

function findForm(node: ReactNode): ReactElement<{ action?: unknown }> | null {
  if (node === null || node === undefined || typeof node !== "object") {
    return null;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findForm(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
  const element = node as ReactElement<{ action?: unknown; children?: ReactNode }>;
  if (element.type === "form") {
    return element;
  }
  return findForm(element.props?.children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/app Server Component", () => {
  it("redirects to /login when getCurrentUser() returns null", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(AppPage()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the username and a logout form for an authenticated user", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", username: "erin" });

    const tree = await AppPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(collectText(tree)).toContain("erin");

    const form = findForm(tree);
    expect(form).not.toBeNull();
    expect(form?.props.action).toBe(mocks.logoutAction);
  });
});
