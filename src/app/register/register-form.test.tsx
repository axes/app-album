// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  registerAction: vi.fn(async () => ({}) as { error?: string }),
}));

vi.mock("./actions", () => ({
  registerAction: mocks.registerAction,
}));

import { RegisterForm } from "./register-form";

beforeEach(() => {
  // `clearAllMocks` only clears call history, so a never-resolving
  // implementation set by one test would leak into the next one. Reset the
  // implementation and restore the resolved default before every test.
  mocks.registerAction.mockReset();
  mocks.registerAction.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
});

describe("RegisterForm", () => {
  it("keeps the username, email, owner type and password contracts", () => {
    render(<RegisterForm />);

    const username = screen.getByLabelText("Usuario") as HTMLInputElement;
    expect(username.name).toBe("username");
    expect(username.autocomplete).toBe("username");
    expect(username.required).toBe(true);
    expect(username.minLength).toBe(3);
    expect(username.maxLength).toBe(30);
    expect(username.pattern).toBe("[a-z0-9_]+");

    const email = screen.getByLabelText("Email") as HTMLInputElement;
    expect(email.name).toBe("email");
    expect(email.type).toBe("email");
    expect(email.autocomplete).toBe("email");
    expect(email.required).toBe(true);
    expect(email.maxLength).toBe(254);

    const ownerType = screen.getByLabelText(
      "¿A quién pertenece este email?",
    ) as HTMLSelectElement;
    expect(ownerType.name).toBe("emailOwnerType");
    expect(ownerType.required).toBe(true);
    expect(ownerType.value).toBe("self");
    expect(screen.getAllByRole("option")).toHaveLength(4);

    const password = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(password.name).toBe("password");
    expect(password.type).toBe("password");
    expect(password.autocomplete).toBe("new-password");
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(10);
    expect(password.maxLength).toBe(128);
  });

  it("keeps the link to the login route", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("link", { name: "Ya tengo cuenta" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("submits the register action with the form data", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.selectOptions(
      screen.getByLabelText("¿A quién pertenece este email?"),
      "guardian",
    );
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(mocks.registerAction).toHaveBeenCalledTimes(1));
    const formData = mocks.registerAction.mock.lastCall?.[1] as FormData;
    expect(formData.get("username")).toBe("ada_lovelace");
    expect(formData.get("email")).toBe("ada@example.com");
    expect(formData.get("emailOwnerType")).toBe("guardian");
    expect(formData.get("password")).toBe("supersecret1");
  });

  it("renders the server error as an accessible alert", async () => {
    const user = userEvent.setup();
    mocks.registerAction.mockResolvedValue({
      error: "Ese email ya está registrado.",
    });
    render(<RegisterForm />);

    // Required fields must be valid for the submit to reach the action.
    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.selectOptions(
      screen.getByLabelText("¿A quién pertenece este email?"),
      "guardian",
    );
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Ese email ya está registrado.",
      ),
    );
  });

  // Keep the intentionally unresolved action last: React's action queue remains
  // pending for that mounted instance even after Testing Library cleanup.
  it("disables the submit button and shows the pending label while the action runs", async () => {
    const user = userEvent.setup();
    mocks.registerAction.mockImplementation(() => new Promise(() => {}));
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Usuario"), "ada_lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.selectOptions(
      screen.getByLabelText("¿A quién pertenece este email?"),
      "guardian",
    );
    await user.type(screen.getByLabelText("Contraseña"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Creando…",
    });
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
  });
});
