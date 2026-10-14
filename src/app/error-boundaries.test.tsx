// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * UI-06B — shared contract for the two route-level `error.tsx` boundaries.
 *
 * Both boundaries are the same composition with a different secondary action,
 * so the common contract is asserted once here and only the segment-specific
 * navigation is asserted per boundary. A new boundary only has to be added to
 * `CASES`.
 *
 * `next/navigation` is mocked with `vi.hoisted` (the pattern already used by
 * `nav-link.test.tsx` and `app-shell.test.tsx`) and `next/link` is a passthrough
 * anchor, so the assertions read the real `href` the user would follow.
 *
 * The HTTP contracts — the existing redirects and the `/share/[token]` 404 —
 * are deliberately not asserted here: they are status-code behaviour, verified
 * against a production build, not component behaviour.
 */
const mocks = vi.hoisted(() => ({
  pathname: "/app",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

import AppError from "./app/error";
import AdminError from "./admin/error";

afterEach(cleanup);

const TITLE = "Algo salió mal";
const DESCRIPTION = "No pudimos cargar esta sección. Puedes intentar nuevamente.";

/** A message and a stack that must never reach the DOM. */
const SECRET_MESSAGE = "SENTINEL_INTERNAL_MESSAGE_9f3a";
const SECRET_STACK = "SENTINEL_INTERNAL_STACK_9f3a";

function makeError(): Error & { digest?: string } {
  const error = new Error(SECRET_MESSAGE) as Error & { digest?: string };
  error.stack = SECRET_STACK;
  error.digest = "SENTINEL_DIGEST_9f3a";
  return error;
}

type BoundaryComponent = (props: {
  error: Error & { digest?: string };
  reset: () => void;
}) => React.ReactElement;

const CASES: Array<{ name: string; Component: BoundaryComponent }> = [
  { name: "/app segment", Component: AppError },
  { name: "/admin segment", Component: AdminError },
];

describe("route error boundaries (UI-06B)", () => {
  it.each(CASES)("$name renders the visible copy", ({ Component }) => {
    render(<Component error={makeError()} reset={() => {}} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(TITLE);
    expect(screen.getByText(DESCRIPTION)).toBeTruthy();
  });

  it.each(CASES)("$name calls reset exactly once when Reintentar is pressed", async ({
    Component,
  }) => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<Component error={makeError()} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it.each(CASES)("$name never exposes the error message, stack or digest", ({
    Component,
  }) => {
    const { container } = render(<Component error={makeError()} reset={() => {}} />);

    const text = container.textContent ?? "";
    expect(text).not.toContain(SECRET_MESSAGE);
    expect(text).not.toContain(SECRET_STACK);
    expect(text).not.toContain("SENTINEL_DIGEST_9f3a");
    expect(container.innerHTML).not.toContain(SECRET_STACK);
  });

  it.each(CASES)("$name exposes exactly one live region", ({ Component }) => {
    const { container } = render(<Component error={makeError()} reset={() => {}} />);

    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
  });

  it.each(CASES)("$name offers Reintentar as a real, keyboard-reachable button", ({
    Component,
  }) => {
    render(<Component error={makeError()} reset={() => {}} />);

    const retry = screen.getByRole("button", { name: "Reintentar" });
    expect(retry.tagName).toBe("BUTTON");
    expect(retry.getAttribute("type")).toBe("button");
    expect(retry.hasAttribute("disabled")).toBe(false);
  });
});

describe("/app error boundary secondary navigation", () => {
  it("points to the catalogue when the failure happened on /app itself", () => {
    mocks.pathname = "/app";
    render(<AppError error={makeError()} reset={() => {}} />);

    const link = screen.getByRole("link", { name: "Explorar álbumes" });
    expect(link.getAttribute("href")).toBe("/app/albums");
  });

  it("points back to the collection from /app/albums", () => {
    mocks.pathname = "/app/albums";
    render(<AppError error={makeError()} reset={() => {}} />);

    const link = screen.getByRole("link", { name: "Volver a mis álbumes" });
    expect(link.getAttribute("href")).toBe("/app");
  });

  it("points back to the collection from an album detail route", () => {
    mocks.pathname = "/app/albums/6f1c2f9e-0000-4000-8000-000000000000";
    render(<AppError error={makeError()} reset={() => {}} />);

    const link = screen.getByRole("link", { name: "Volver a mis álbumes" });
    expect(link.getAttribute("href")).toBe("/app");
  });

  it("never links to the route it is currently rendering", () => {
    for (const pathname of ["/app", "/app/albums", "/app/albums/abc"]) {
      mocks.pathname = pathname;
      const { container, unmount } = render(
        <AppError error={makeError()} reset={() => {}} />,
      );

      const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
        a.getAttribute("href"),
      );
      expect(hrefs).not.toContain(pathname);
      unmount();
    }
  });
});

describe("/admin error boundary secondary navigation", () => {
  it("points back to the authenticated collection", () => {
    render(<AdminError error={makeError()} reset={() => {}} />);

    const link = screen.getByRole("link", { name: "Volver a mis álbumes" });
    expect(link.getAttribute("href")).toBe("/app");
  });

  it("never offers a public route", () => {
    const { container } = render(<AdminError error={makeError()} reset={() => {}} />);

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).not.toContain("/");
    expect(hrefs).not.toContain("/login");
    expect(hrefs).not.toContain("/register");
  });
});
