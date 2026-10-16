// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

afterEach(cleanup);

const variantExpectations: Array<[ButtonVariant, string]> = [
  ["primary", "btn-primary"],
  ["accent", "btn-accent"],
  ["secondary", "bg-transparent"],
  ["ghost", "btn-ghost"],
  ["danger", "btn-error"],
  ["dangerGhost", "danger-ghost"],
  ["link", "btn-link"],
];

describe("Button (DESIGN v2 §7)", () => {
  it("renders a native button that defaults to type=button", () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("defaults to the primary variant and the md size (44 px)", () => {
    render(<Button>Guardar</Button>);

    const className = screen.getByRole("button", { name: "Guardar" }).className;
    expect(className).toContain("btn");
    expect(className).toContain("btn-primary");
    expect(className).toContain("h-11");
    expect(className).toContain("min-h-11");
    expect(className).toContain("rounded-control");
    expect(className).toContain("border-[1.5px]");
    expect(className).toContain("gap-2");
    expect(className).toContain("duration-[var(--transition-fast)]");
  });

  it.each(variantExpectations)("applies the %s variant", (variant, expected) => {
    render(<Button variant={variant}>Acción</Button>);

    expect(screen.getByRole("button", { name: "Acción" }).className).toContain(
      expected,
    );
  });

  it("uses text-on as the foreground on filled variants", () => {
    for (const variant of ["primary", "accent", "danger"] as const) {
      const { unmount } = render(<Button variant={variant}>X</Button>);
      expect(screen.getByRole("button", { name: "X" }).className).toContain(
        "text-on",
      );
      unmount();
    }
  });

  it("renders dangerGhost as a transparent, borderless danger control", () => {
    render(<Button variant="dangerGhost">Eliminar</Button>);

    const className = screen.getByRole("button", { name: "Eliminar" })
      .className;
    // The hover tint (danger 12% + surface) is centralised in globals.css as
    // the `.danger-ghost` class; the component only references it.
    expect(className).toContain("danger-ghost");
    expect(className).toContain("bg-transparent");
    expect(className).toContain("text-danger");
    // The variant guarantees a borderless control on its own, without relying
    // on the base class.
    expect(className).toContain("border-transparent");
    expect(className).not.toContain("btn-error");
  });

  it("switches to 36 px (h-9) for the sm size and keeps the 44 px touch target", () => {
    const sizeExpectations: Array<[ButtonSize, string]> = [
      ["sm", "h-9"],
      ["md", "h-11"],
    ];
    for (const [size, expected] of sizeExpectations) {
      const { unmount } = render(<Button size={size}>Acción</Button>);
      const className = screen.getByRole("button", { name: "Acción" }).className;
      expect(className).toContain(expected);
      expect(className).toContain("min-h-11");
      if (size === "sm") expect(className).toContain("type-button-compact");
      unmount();
    }
  });

  it("forces aria-label and a 44x44 shape when iconOnly is set", () => {
    render(
      <Button
        aria-label="Cerrar"
        iconOnly
        onClick={() => undefined}
      >
        <span>x</span>
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Cerrar" });
    expect(button.className).toContain("aspect-square");
    expect(button.className).toContain("w-11");
    expect(button.className).toContain("justify-center");
    expect(button.className).toContain("px-0");
  });

  it("throws in development when iconOnly is set without an aria-label", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      expect(() =>
        render(
          // The eslint rule would catch this in a real file; the cast makes
          // it explicit that we are testing the runtime guard.
          <Button iconOnly onClick={() => undefined}>
            x
          </Button>,
        ),
      ).toThrowError(/aria-label/);
    } finally {
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }
  });

  it("logs an error in production when iconOnly is set without an aria-label", () => {
    const previous = process.env.NODE_ENV;
    const originalError = console.error;
    const calls: string[] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args.map(String).join(" "));
    };
    process.env.NODE_ENV = "production";
    try {
      // The error path is a side effect; the render must still succeed.
      render(
        <Button iconOnly onClick={() => undefined}>
          x
        </Button>,
      );
      expect(calls.some((m) => /iconOnly/.test(m))).toBe(true);
    } finally {
      process.env.NODE_ENV = previous;
      console.error = originalError;
    }
  });

  it("throws in development when loading is set without a loadingLabel", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      expect(() =>
        render(
          <Button onClick={() => undefined} loading>
            Guardar
          </Button>,
        ),
      ).toThrowError(/loadingLabel/);
    } finally {
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }
  });

  it("logs an error in production when loading is set without a loadingLabel", () => {
    const previous = process.env.NODE_ENV;
    const originalError = console.error;
    const calls: string[] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args.map(String).join(" "));
    };
    process.env.NODE_ENV = "production";
    try {
      render(
        <Button onClick={() => undefined} loading>
          Guardar
        </Button>,
      );
      expect(calls.some((m) => /loadingLabel/.test(m))).toBe(true);
    } finally {
      process.env.NODE_ENV = previous;
      console.error = originalError;
    }
  });

  it("renders the gerund label and spinner in the loading state", () => {
    render(
      <Button
        loading
        loadingLabel="Guardando…"
        onClick={() => undefined}
        icon={<span aria-hidden="true">★</span>}
      >
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Guardando/ });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.className).toContain("cursor-wait");
    expect(button.querySelector("svg.animate-spin")).toBeTruthy();
    expect(button.textContent).toContain("Guardando");
  });

  it("preserves the caller-provided aria-label while loading", () => {
    render(
      <Button
        loading
        loadingLabel="Guardando…"
        aria-label="Guardar cambios"
        onClick={() => undefined}
      >
        Guardar
      </Button>,
    );

    // The caller's aria-label wins over the visible gerund label.
    const button = screen.getByRole("button", { name: "Guardar cambios" });
    expect(button.getAttribute("aria-busy")).toBe("true");
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

  it("forwards a ref to the underlying button", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Guardar</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Guardar" }));
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
    expect(className).toContain(
      "transition-[color,background-color,border-color,opacity,transform]",
    );
    expect(className).not.toContain("transition-all");
  });

  it("applies hover brightness, active scale, and disabled opacity tokens", () => {
    render(<Button>Guardar</Button>);

    const className = screen.getByRole("button", { name: "Guardar" }).className;
    expect(className).toContain("hover:[filter:brightness(1.1)]");
    expect(className).toContain("active:scale-[.97]");
    expect(className).toContain("disabled:opacity-45");
    expect(className).toContain("disabled:cursor-not-allowed");
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
