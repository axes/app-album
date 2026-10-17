// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Field } from "./field";

afterEach(cleanup);

describe("Field", () => {
  it("renders a labelled input and preserves native attributes", () => {
    render(
      <Field
        label="Usuario"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={30}
        pattern="[a-z0-9_]+"
        title="3 a 30 caracteres"
      />,
    );

    const input = screen.getByLabelText("Usuario") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.className).toContain("input");
    expect(input.className).toContain("h-11");
    expect(input.id).toBe("username");
    expect(input.name).toBe("username");
    expect(input.autocomplete).toBe("username");
    expect(input.required).toBe(true);
    expect(input.minLength).toBe(3);
    expect(input.maxLength).toBe(30);
    expect(input.pattern).toBe("[a-z0-9_]+");
    expect(input.title).toBe("3 a 30 caracteres");
  });

  it("renders a select with its options and default value", () => {
    render(
      <Field
        as="select"
        label="¿A quién pertenece este email?"
        name="emailOwnerType"
        required
        defaultValue="self"
      >
        <option value="self">A mí</option>
        <option value="parent">A mi padre o madre</option>
      </Field>,
    );

    const select = screen.getByLabelText(
      "¿A quién pertenece este email?",
    ) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(select.className).toContain("select");
    expect(select.className).toContain("h-11");
    expect(select.name).toBe("emailOwnerType");
    expect(select.required).toBe(true);
    expect(select.value).toBe("self");
    expect(screen.getByRole("option", { name: "A mi padre o madre" })).toBeTruthy();
  });

  it("renders a textarea", () => {
    render(<Field as="textarea" label="Notas" name="notes" rows={3} />);

    const textarea = screen.getByLabelText("Notas") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.className).toContain("textarea");
    expect(textarea.name).toBe("notes");
    expect(textarea.rows).toBe(3);
  });

  it("marks the control invalid and links the error message", () => {
    render(
      <Field
        label="Usuario"
        name="username"
        error="Ese nombre de usuario no está disponible."
      />,
    );

    const input = screen.getByLabelText("Usuario");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toContain("border-danger");

    const message = screen.getByRole("alert");
    expect(message.textContent).toBe("Ese nombre de usuario no está disponible.");
    expect(message.id).toBe("username-error");
    expect(input.getAttribute("aria-errormessage")).toBe("username-error");
    expect(input.getAttribute("aria-describedby")).toBe("username-error");
  });

  it("renders a hint without alert semantics", () => {
    render(<Field label="Usuario" name="username" hint="3 a 30 caracteres" />);

    const input = screen.getByLabelText("Usuario");
    expect(input.getAttribute("aria-invalid")).toBeNull();

    const hint = screen.getByText("3 a 30 caracteres");
    expect(hint.getAttribute("role")).toBeNull();
    expect(hint.className).toContain("text-xs");
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("renders a decorative leading icon and reserves space for it", () => {
    const { container } = render(
      <Field label="Buscar" name="q" icon="explore" />,
    );

    const input = screen.getByLabelText("Buscar") as HTMLInputElement;
    expect(input.className).toContain("pl-9");
    const svg = container.querySelector("svg[data-icon='explore']");
    expect(svg).toBeTruthy();
    // The glyph is decorative: the visible label already names the control.
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  /**
   * Regression: the icon was in the DOM but invisible. daisyUI's `.input` and
   * `.select` declare `position: relative`, which makes the control a
   * positioned element too; with both at `z-index: auto` the paint order falls
   * back to DOM order, so the control — rendered after the icon — painted its
   * opaque `bg-input` background over the glyph. The existing assertion above
   * only checked that the `<svg>` existed, which is why it never caught it.
   */
  it("stacks the leading icon above the control so its background cannot hide it", () => {
    const { container } = render(
      <Field label="Buscar" name="q" icon="explore" />,
    );

    const svg = container.querySelector("svg[data-icon='explore']");
    const wrapper = svg?.parentElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper!.className).toContain("absolute");
    expect(wrapper!.className).toMatch(/(^|\s)z-\d+/);
    // A click on the glyph must reach the control underneath and focus it.
    expect(wrapper!.className).toContain("pointer-events-none");
    // The control really is positioned, which is what makes the z-index load-bearing.
    const input = screen.getByLabelText("Buscar") as HTMLInputElement;
    expect(input.className).toContain("input");
  });

  it("stacks the leading icon above a select control too", () => {
    const { container } = render(
      <Field as="select" label="Página" name="sectionId" icon="explore">
        <option value="">Sin página asignada</option>
      </Field>,
    );

    const svg = container.querySelector("svg[data-icon='explore']");
    expect(svg?.parentElement?.className).toMatch(/(^|\s)z-\d+/);
  });

  it("renders the error message with the error icon", () => {
    const { container } = render(
      <Field label="Usuario" name="username" error="No disponible" />,
    );

    const message = screen.getByRole("alert");
    expect(message.textContent).toBe("No disponible");
    expect(container.querySelector("svg[data-icon='error']")).toBeTruthy();
  });

  it("combines external descriptions with hint and error semantics", () => {
    render(
      <>
        <p id="external-help">Ayuda externa</p>
        <Field
          label="Usuario"
          name="username"
          hint="3 a 30 caracteres"
          error="Nombre no disponible"
          aria-describedby="external-help"
        />
      </>,
    );

    const input = screen.getByLabelText("Usuario");
    expect(input.getAttribute("aria-describedby")).toBe(
      "external-help username-hint username-error",
    );
    expect(input.getAttribute("aria-errormessage")).toBe("username-error");
    expect(screen.getByText("3 a 30 caracteres").id).toBe("username-hint");
  });

  it("forwards the disabled state", () => {
    render(<Field label="Usuario" name="username" disabled />);

    expect((screen.getByLabelText("Usuario") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
