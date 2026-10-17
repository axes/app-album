// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdminUser } from "@/lib/admin/service";
import { AdminUserList } from "./user-list";

/**
 * jsdom does not implement HTMLDialogElement's modal machinery: `showModal()`
 * and `close()` are no-ops and `dialog.open` is never updated. We polyfill
 * enough of the API surface for `ConfirmAction` to behave the way it does in a
 * real browser, while keeping the semantics observable from the tests.
 */
type DialogLike = HTMLDialogElement & { open: boolean };

if (typeof window !== "undefined" && typeof window.HTMLDialogElement !== "undefined") {
  const proto = window.HTMLDialogElement.prototype as DialogLike;
  if (!proto.showModal) {
    proto.showModal = function showModal(this: DialogLike) {
      this.open = true;
    };
  }
  if (!proto.close) {
    proto.close = function close(this: DialogLike) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}

/**
 * The Server Actions are mocked: `./actions.ts` is a `"use server"` module that
 * imports `next/cache` and the server-only repository, none of which can load
 * in jsdom. The mock keeps the exact `useActionState` signature so the
 * component under test is the real one.
 */
const changeRoleActionMock = vi.fn();
const changeStatusActionMock = vi.fn();

vi.mock("./actions", () => ({
  changeRoleAction: (state: unknown, data: FormData) => changeRoleActionMock(state, data),
  changeStatusAction: (state: unknown, data: FormData) => changeStatusActionMock(state, data),
}));

const users: AdminUser[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    username: "gino",
    email: "gino@example.com",
    emailOwnerType: "self",
    role: "admin",
    status: "active",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "maria",
    email: "maria@example.com",
    emailOwnerType: "parent",
    role: "user",
    status: "banned",
  },
];

afterEach(() => {
  cleanup();
  changeRoleActionMock.mockReset();
  changeStatusActionMock.mockReset();
});

describe("AdminUserList", () => {
  it("renders an accessible local search and semantic table with the same user data", () => {
    render(<AdminUserList users={users} />);

    expect(screen.getByRole("searchbox", { name: "Buscar usuario" })).toBeTruthy();
    const region = screen.getByRole("region", { name: "Usuarios" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");

    for (const heading of ["Usuario", "Email", "Contacto", "Rol", "Estado", "Acciones"]) {
      expect(screen.getByRole("columnheader", { name: heading }).getAttribute("scope"))
        .toBe("col");
    }

    const gino = screen.getByRole("row", { name: /gino/ });
    expect(gino.textContent).toContain("gino@example.com");
    expect(gino.textContent).toContain("Propio");
    expect(gino.textContent).toContain("Administrador");
    expect(gino.textContent).toContain("Activo");

    const maria = screen.getByRole("row", { name: /maria/ });
    expect(maria.textContent).toContain("maria@example.com");
    expect(maria.textContent).toContain("Padre/madre");
    expect(maria.textContent).toContain("Usuario");
    expect(maria.textContent).toContain("Bloqueado");
  });

  it("filters rows locally by username and by email", async () => {
    const user = userEvent.setup();
    render(<AdminUserList users={users} />);
    const search = screen.getByRole("searchbox", { name: "Buscar usuario" });

    await user.type(search, "maria");
    expect(screen.getByRole("row", { name: /maria/ })).toBeTruthy();
    expect(screen.queryByRole("row", { name: /gino/ })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("1 resultado");

    await user.clear(search);
    await user.type(search, "gino@example.com");
    expect(screen.getByRole("row", { name: /gino/ })).toBeTruthy();
    expect(screen.queryByRole("row", { name: /maria/ })).toBeNull();
  });

  it("announces no results and clears the local filter", async () => {
    const user = userEvent.setup();
    render(<AdminUserList users={users} />);

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar usuario" }),
      "sin coincidencias",
    );

    expect(screen.getByRole("status").textContent).toBe("0 resultados");
    expect(screen.getByRole("heading", { name: "No encontramos usuarios" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Usuarios" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(screen.getByRole("region", { name: "Usuarios" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Buscar usuario" })).toHaveProperty("value", "");
    expect(screen.getByRole("status").textContent).toBe("2 resultados");
  });

  it("renders the empty state without search or table when there are no users", () => {
    render(<AdminUserList users={[]} />);

    expect(screen.getByRole("heading", { name: "Todavía no hay usuarios" })).toBeTruthy();
    expect(screen.queryByRole("searchbox", { name: "Buscar usuario" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Usuarios" })).toBeNull();
  });

  it("uses the approved badge vocabulary and never leaks the internal enum values", () => {
    render(<AdminUserList users={users} />);

    const admin = screen.getByText("Administrador");
    expect(admin.className).toContain("bg-primary");
    expect(screen.getByText("Activo").className).toContain("bg-success");
    expect(screen.getByText("Bloqueado").className).toContain("bg-danger");

    // "Usuario" is both a column header and a badge label, so scope the lookup
    // to the row that actually carries the badge.
    const maria = screen.getByRole("row", { name: /maria/ });
    expect(within(maria).getByText("Usuario").className).toContain("bg-surface-muted");

    // The raw values must not be visible anywhere in the table.
    const region = screen.getByRole("region", { name: "Usuarios" });
    expect(region.textContent).not.toMatch(/\badmin\b/);
    expect(region.textContent).not.toMatch(/\bbanned\b/);
    expect(region.textContent).not.toMatch(/\bactive\b/);
  });

  it("names every row action with the user it affects", () => {
    render(<AdminUserList users={users} />);

    const gino = screen.getByRole("row", { name: /gino/ });
    expect(within(gino).getByRole("button", { name: "Degradar a usuario a gino" })).toBeTruthy();
    expect(within(gino).getByRole("button", { name: "Bloquear a gino" })).toBeTruthy();

    const maria = screen.getByRole("row", { name: /maria/ });
    expect(
      within(maria).getByRole("button", { name: "Promover a administrador a maria" }),
    ).toBeTruthy();
    expect(within(maria).getByRole("button", { name: "Desbloquear a maria" })).toBeTruthy();
  });

  it("keeps the row actions on one wrapping line instead of stacking them full width", () => {
    render(<AdminUserList users={users} />);

    const gino = screen.getByRole("row", { name: /gino/ });
    const actions = within(gino).getByRole("button", { name: "Bloquear a gino" }).closest("div");
    expect(actions?.className).toContain("flex-wrap");
    expect(actions?.className).toContain("items-center");
    expect(actions?.className).not.toContain("flex-col");
  });

  it("keeps the visible secondary border on the row action buttons", () => {
    render(<AdminUserList users={users} />);

    // Regression for the previous commit: the secondary variant must declare
    // `border-input-border` and must NOT also carry `border-transparent`, which
    // would win by Tailwind's alphabetical emission order and erase the outline.
    for (const name of ["Degradar a usuario a gino", "Desbloquear a maria"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("border-input-border");
      expect(button.className).not.toContain("border-transparent");
    }

    // The destructive trigger is `dangerGhost`: transparent border by design.
    const block = screen.getByRole("button", { name: "Bloquear a gino" });
    expect(block.className).toContain("border-transparent");
    expect(block.className).toContain("text-danger");
  });

  it("confirms before blocking and explains the consequence", async () => {
    changeStatusActionMock.mockResolvedValue({ success: "Estado actualizado." });
    render(<AdminUserList users={users} />);

    fireEvent.click(screen.getByRole("button", { name: "Bloquear a gino" }));

    const dialog = document.querySelector(
      '[data-component="confirm-action"]',
    ) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(changeStatusActionMock).not.toHaveBeenCalled();

    const titleId = dialog.getAttribute("aria-labelledby") ?? "";
    const descriptionId = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(titleId)?.textContent).toBe("Bloquear a gino");
    expect(document.getElementById(descriptionId)?.textContent).toContain(
      "perderá el acceso de inmediato",
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(changeStatusActionMock).toHaveBeenCalledTimes(1));
    const payload = changeStatusActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("userId")).toBe("00000000-0000-4000-8000-000000000001");
    expect(payload.get("status")).toBe("banned");
  });

  it("submits the role change with the untouched payload", async () => {
    changeRoleActionMock.mockResolvedValue({ success: "Rol actualizado." });
    render(<AdminUserList users={users} />);

    fireEvent.click(screen.getByRole("button", { name: "Degradar a usuario a gino" }));

    await waitFor(() => expect(changeRoleActionMock).toHaveBeenCalledTimes(1));
    const payload = changeRoleActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("userId")).toBe("00000000-0000-4000-8000-000000000001");
    expect(payload.get("role")).toBe("user");
  });
});

/**
 * Regression: the row actions and the search field must actually paint their
 * glyphs. The `asChild` branch of `Button` used to drop the `icon` slot and the
 * `Field` icon used to be painted underneath the control's opaque background;
 * both bugs were invisible to text/role assertions, so these tests inspect the
 * serialised markup instead.
 */
describe("AdminUserList — iconos visibles", () => {
  it("renders an <svg> inside every row action button", () => {
    const html = renderToStaticMarkup(<AdminUserList users={users} />);

    for (const icon of ["chevronDown", "chevronUp", "lock", "unlock"]) {
      expect(html, `missing ${icon} glyph`).toContain(`data-icon="${icon}"`);
    }

    // One glyph per action button: 2 users × 2 actions.
    const buttons = html.match(/<button[^>]*>.*?<\/button>/gs) ?? [];
    const withIcon = buttons.filter((button) => button.includes("<svg"));
    expect(withIcon).toHaveLength(users.length * 2);
  });

  it("renders the magnifier <svg> inside the search field", () => {
    const html = renderToStaticMarkup(<AdminUserList users={users} />);
    const searchBlock = html.match(/<div class="relative">.*?<\/div>/s)?.[0] ?? "";

    expect(searchBlock).toContain("<svg");
    expect(searchBlock).toContain('data-icon="explore"');
    // The glyph must sit above the control: daisyUI's `.input` is
    // `position: relative`, so without a positive z-index the input's opaque
    // background paints over the icon.
    expect(searchBlock).toContain("z-10");
  });
});
