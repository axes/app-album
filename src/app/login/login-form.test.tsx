// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  loginAction: vi.fn(async () => ({}) as { error?: string }),
}));

vi.mock("./actions", () => ({
  loginAction: mocks.loginAction,
}));

import { LoginForm } from "./login-form";

beforeEach(() => {
  // `clearAllMocks` only clears call history, so a never-resolving
  // implementation set by one test would leak into the next one. Reset the
  // implementation and restore the resolved default before every test.
  mocks.loginAction.mockReset();
  mocks.loginAction.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  it("keeps the username and password contracts", () => {
    render(<LoginForm />);

    const username = screen.getByLabelText("Usuario") as HTMLInputElement;
    expect(username.name).toBe("username");
    expect(username.autocomplete).toBe("username");
    expect(username.required).toBe(true);
    expect(username.minLength).toBe(3);
    expect(username.maxLength).toBe(30);
    expect(username.pattern).toBe("[a-z0-9_]+");

    const password = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(password.name).toBe("password");
    expect(password.type).toBe("password");
    expect(password.autocomplete).toBe("current-password");
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(10);
    expect(password.maxLength).toBe(128);
  });

  it("keeps the link to the registration route", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("link", { name: "Crear una cuenta" }).getAttribute("href"),
    ).toBe("/register");
  });

  it("submits the login action with the form data", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(mocks.loginAction).toHaveBeenCalledTimes(1));
    const formData = mocks.loginAction.mock.lastCall?.[1] as FormData;
    expect(formData.get("username")).toBe("ada_lovelace");
    expect(formData.get("password")).toBe("supersecret1");
  });

  it("renders the server error as an accessible alert", async () => {
    const user = userEvent.setup();
    mocks.loginAction.mockResolvedValue({
      error: "Usuario o contraseña incorrectos.",
    });
    render(<LoginForm />);

    // Required fields must be valid for the submit to reach the action.
    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Usuario o contraseña incorrectos.",
      ),
    );
  });

  // Keep the intentionally unresolved action last: React's action queue remains
  // pending for that mounted instance even after Testing Library cleanup.
  it("disables the submit button and shows the pending label while the action runs", async () => {
    const user = userEvent.setup();
    mocks.loginAction.mockImplementation(() => new Promise(() => {}));
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Ingresando…",
    });
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
  });
});
