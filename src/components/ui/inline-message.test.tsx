// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { InlineMessage, type InlineMessageVariant } from "./inline-message";

afterEach(cleanup);

const nonCriticalVariants: InlineMessageVariant[] = [
  "success",
  "warning",
  "info",
  "pending",
];

describe("InlineMessage", () => {
  it("announces errors assertively with role=alert", () => {
    render(<InlineMessage variant="error">No se pudo guardar.</InlineMessage>);

    const message = screen.getByRole("alert");
    expect(message.textContent).toBe("No se pudo guardar.");
    expect(message.className).toContain("alert");
    expect(message.className).toContain("text-content");
    expect(message.className).toContain("border-danger");
  });

  it.each(nonCriticalVariants)(
    "announces the %s variant politely with role=status",
    (variant) => {
      render(<InlineMessage variant={variant}>Estado</InlineMessage>);

      const message = screen.getByRole("status");
      expect(message.textContent).toBe("Estado");
    },
  );

  it("defaults to the info variant", () => {
    render(<InlineMessage>Información</InlineMessage>);

    expect(screen.getByRole("status").className).toContain("border-info");
  });

  it("maps each variant to its semantic colour", () => {
    const { rerender } = render(
      <InlineMessage variant="success">ok</InlineMessage>,
    );
    expect(screen.getByRole("status").className).toContain("border-success");

    rerender(<InlineMessage variant="warning">ojo</InlineMessage>);
    expect(screen.getByRole("status").className).toContain("border-warning");

    rerender(<InlineMessage variant="pending">…</InlineMessage>);
    expect(screen.getByRole("status").className).toContain("border-border");
  });
});
