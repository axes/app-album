// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";

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
    "aria-current": ariaCurrent,
    "data-current": dataCurrent,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-current"?: string;
    "data-current"?: string;
  }) => (
    <a
      href={href}
      className={className}
      aria-current={ariaCurrent}
      data-current={dataCurrent}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { NavLink } from "./nav-link";

describe("NavLink (UI-05A)", () => {
  it("marks the link as current when the pathname matches exactly", () => {
    mocks.pathname = "/app";
    const { container } = render(<NavLink href="/app">Mis álbumes</NavLink>);
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("aria-current")).toBe("page");
    expect(anchor?.getAttribute("data-current")).toBe("true");
    expect(anchor?.className).toContain("is-current");
  });

  it("does not mark the link as current when the pathname differs", () => {
    mocks.pathname = "/app/albums";
    const { container } = render(<NavLink href="/app">Mis álbumes</NavLink>);
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("aria-current")).toBeNull();
    expect(anchor?.getAttribute("data-current")).toBeNull();
    expect(anchor?.className ?? "").not.toContain("is-current");
  });

  it("uses prematch for parent route highlighting without matching children", () => {
    mocks.pathname = "/app";
    const { container } = render(
      <NavLink href="/app" prematch="/app">
        Mis álbumes
      </NavLink>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("aria-current")).toBe("page");
  });

  it("does not highlight a child route when the parent uses prematch only", () => {
    mocks.pathname = "/admin/users";
    const { container } = render(
      <NavLink href="/app" prematch="/app">
        Mis álbumes
      </NavLink>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("aria-current")).toBeNull();
  });

  it("serialises to a static anchor without hooks for server contexts", () => {
    mocks.pathname = "/app";
    const html = renderToStaticMarkup(
      <NavLink href="/app">Mis álbumes</NavLink>,
    );
    expect(html).toContain('href="/app"');
    expect(html).toContain('aria-current="page"');
  });
});
