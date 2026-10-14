// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * UI-06A — shared contract for every route-level `loading.tsx` boundary.
 *
 * The five boundaries are pure presentational compositions with no logic of
 * their own, so their real contract is the same in all of them: exactly one
 * accessible status region, at least one placeholder, and nothing focusable.
 * Asserting that once here keeps the five files from drifting apart, and a new
 * boundary only has to be added to `CASES`.
 *
 * `AppShell` is covered by its own suite; here it is a passthrough so this file
 * does not have to mock the logout Server Action, the theme toggle or
 * `next/link`.
 */
vi.mock("@/components/ui/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import AppLoading from "./app/loading";
import UserAlbumLoading from "./app/albums/[userAlbumId]/loading";
import AdminLoading from "./admin/loading";
import AdminAlbumLoading from "./admin/albums/[id]/loading";

afterEach(cleanup);

const FOCUSABLE = "button, a, input, select, textarea, [tabindex]";

type LoadingComponent = () => ReactElement;

/**
 * `/share/[token]` deliberately has no boundary: its page calls `notFound()`,
 * and a route-level Suspense boundary commits the 200 headers before that
 * throws, turning the documented 404 into a 200. See
 * `docs/UI_06A_LOADING_STATES.md`.
 */
const CASES: Array<{ name: string; Component: LoadingComponent; label: string }> = [
  { name: "/app and /app/albums", Component: AppLoading, label: "Cargando tus álbumes" },
  { name: "/app/albums/[userAlbumId]", Component: UserAlbumLoading, label: "Cargando el álbum" },
  { name: "/admin/albums and /admin/users", Component: AdminLoading, label: "Cargando la administración" },
  { name: "/admin/albums/[id]", Component: AdminAlbumLoading, label: "Cargando el álbum" },
];

describe("route loading boundaries", () => {
  it.each(CASES)("$name exposes exactly one status region with its label", ({ Component, label }) => {
    render(<Component />);

    const regions = screen.getAllByRole("status");
    expect(regions).toHaveLength(1);
    expect(regions[0].textContent).toContain(label);
  });

  it.each(CASES)("$name renders placeholders and nothing focusable", ({ Component }) => {
    const { container } = render(<Component />);

    expect(container.querySelectorAll('[data-testid="skeleton"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll(FOCUSABLE).length).toBe(0);
  });

  it.each(CASES)("$name hides the placeholder geometry from assistive tech", ({ Component }) => {
    const { container } = render(<Component />);

    const hidden = container.querySelector('[data-testid="loading-region"] > div');
    expect(hidden?.getAttribute("aria-hidden")).toBe("true");
  });
});
