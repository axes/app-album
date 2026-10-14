// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button, type ButtonVariant } from "./button";

afterEach(cleanup);

const variantExpectations: Array<[ButtonVariant, string]> = [
  ["primary", "btn-primary"],
  ["secondary", "btn-secondary"],
  ["danger", "btn-error"],
  ["ghost", "btn-ghost"],
  ["link", "btn-link"],
];

describe("Button", () => {
  it("renders a native button that defaults to type=button", () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("defaults to the primary variant and the md size", () => {
    render(<Button>Guardar</Button>);

    const className = screen.getByRole("button", { name: "Guardar" }).className;
    expect(className).toContain("btn");
    expect(className).toContain("btn-primary");
    expect(className).toContain("h-10");
    expect(className).toContain("min-h-11");
  });

  it.each(variantExpectations)("applies the %s variant", (variant, expected) => {
    render(<Button variant={variant}>Acción</Button>);

    expect(screen.getByRole("button", { name: "Acción" }).className).toContain(
      expected,
    );
  });

  it("keeps compact size styles with a 44px minimum touch target", () => {
    const { rerender } = render(<Button size="sm">Acción</Button>);
    let className = screen.getByRole("button", { name: "Acción" }).className;
    expect(className).toContain("h-8");
    expect(className).toContain("min-h-11");

    rerender(<Button size="md">Acción</Button>);
    className = screen.getByRole("button", { name: "Acción" }).className;
    expect(className).toContain("h-10");
    expect(className).toContain("min-h-11");
  });

  it("forwards native button props untouched", () => {
    render(
      <Button
        type="submit"
        name="intent"
        value="save"
        disabled
        aria-label="Guardar cambios"
      >
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Guardar cambios",
    }) as HTMLButtonElement;
    expect(button.type).toBe("submit");
    expect(button.name).toBe("intent");
    expect(button.value).toBe("save");
    expect(button.disabled).toBe(true);
  });

  it("merges a caller-provided className", () => {
    render(<Button className="w-full">Guardar</Button>);

    expect(screen.getByRole("button", { name: "Guardar" }).className).toContain(
      "w-full",
    );
  });

  it("transitions specific properties with the shared tokens", () => {
    render(<Button>Guardar</Button>);

    const className = screen.getByRole("button", { name: "Guardar" }).className;
    expect(className).toContain("duration-[var(--transition-fast)]");
    expect(className).toContain("ease-[var(--ease-standard)]");
    expect(className).not.toContain("transition-all");
  });

  it("styles a single child element instead of nesting a button when asChild is set", () => {
    render(
      <Button asChild variant="primary">
        <a href="/register">Crear cuenta</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Crear cuenta" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("btn-primary");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("merges the child className when asChild is set", () => {
    render(
      <Button asChild className="w-full">
        <a href="/x" className="custom-link">
          Ir
        </a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ir" });
    expect(link.className).toContain("custom-link");
    expect(link.className).toContain("w-full");
  });

  it("rejects a non-element child when asChild is set", () => {
    expect(() => render(<Button asChild>Texto suelto</Button>)).toThrow(
      /asChild/,
    );
  });
});
