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

const SELF_ID = "00000000-0000-4000-8000-000000000001";

const users: AdminUser[] = [
  {
    id: SELF_ID,
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
  {
    id: "00000000-0000-4000-8000-000000000003",
    username: "pedro",
    email: "pedro@example.com",
    emailOwnerType: "guardian",
    role: "admin",
    status: "active",
  },
];

function renderList() {
  return render(<AdminUserList users={users} currentUserId={SELF_ID} />);
}

/** The dialog that is currently open, whichever row opened it. */
function openDialog(): HTMLDialogElement {
  const dialogs = Array.from(
    document.querySelectorAll('[data-component="confirm-action"]'),
  ) as HTMLDialogElement[];
  const open = dialogs.find((dialog) => dialog.open);
  if (!open) throw new Error("no open confirm dialog");
  return open;
}

afterEach(() => {
  cleanup();
  changeRoleActionMock.mockReset();
  changeStatusActionMock.mockReset();
});

describe("AdminUserList", () => {
  it("renders an accessible local search and semantic table with the same user data", () => {
    renderList();

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

  it("keeps the table narrow enough for the shell and lets the email wrap", () => {
    const html = renderToStaticMarkup(
      <AdminUserList users={users} currentUserId={SELF_ID} />,
    );

    // The shell caps the content at max-w-5xl (64rem) minus 2 × 16 px of
    // padding, so 48rem (768 px) always fits inside it.
    expect(html).toContain("min-width:48rem");
    expect(html).not.toContain("min-width:64rem");
    // The email must wrap instead of widening the column.
    expect(html).toContain("break-words");
  });

  it("filters rows locally by username and by email", async () => {
    const user = userEvent.setup();
    renderList();
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
    renderList();

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
    expect(screen.getByRole("status").textContent).toBe("3 resultados");
  });

  it("renders the empty state without search or table when there are no users", () => {
    render(<AdminUserList users={[]} currentUserId={SELF_ID} />);

    expect(screen.getByRole("heading", { name: "Todavía no hay usuarios" })).toBeTruthy();
    expect(screen.queryByRole("searchbox", { name: "Buscar usuario" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Usuarios" })).toBeNull();
  });

  it("uses the approved badge vocabulary and never leaks the internal enum values", () => {
    renderList();

    // "Administrador" and "Activo" appear on more than one row, so scope the
    // lookups to the row that carries the badge.
    const pedro = screen.getByRole("row", { name: /pedro/ });
    expect(within(pedro).getByText("Administrador").className).toContain("bg-primary");
    expect(within(pedro).getByText("Activo").className).toContain("bg-success");

    const maria = screen.getByRole("row", { name: /maria/ });
    expect(within(maria).getByText("Usuario").className).toContain("bg-surface-muted");
    expect(within(maria).getByText("Bloqueado").className).toContain("bg-danger");

    const region = screen.getByRole("region", { name: "Usuarios" });
    expect(region.textContent).not.toMatch(/\badmin\b/);
    expect(region.textContent).not.toMatch(/\bbanned\b/);
    expect(region.textContent).not.toMatch(/\bactive\b/);
  });

  it("names every row action with the user it affects", () => {
    renderList();

    const maria = screen.getByRole("row", { name: /maria/ });
    expect(
      within(maria).getByRole("button", { name: "Promover a maria a administrador" }),
    ).toBeTruthy();
    expect(within(maria).getByRole("button", { name: "Desbloquear a maria" })).toBeTruthy();

    const pedro = screen.getByRole("row", { name: /pedro/ });
    expect(
      within(pedro).getByRole("button", { name: "Degradar a pedro a usuario" }),
    ).toBeTruthy();
    expect(within(pedro).getByRole("button", { name: "Bloquear a pedro" })).toBeTruthy();
  });

  it("uses short visible labels so the actions column stays narrow", () => {
    renderList();

    const pedro = screen.getByRole("row", { name: /pedro/ });
    expect(within(pedro).getByRole("button", { name: "Degradar a pedro a usuario" }).textContent)
      .toBe("Degradar");
    expect(within(pedro).getByRole("button", { name: "Bloquear a pedro" }).textContent)
      .toBe("Bloquear");
  });

  it("keeps the row actions on one wrapping line instead of stacking them full width", () => {
    renderList();

    const pedro = screen.getByRole("row", { name: /pedro/ });
    const actions = within(pedro)
      .getByRole("button", { name: "Bloquear a pedro" })
      .closest("div");
    expect(actions?.className).toContain("flex-wrap");
    expect(actions?.className).toContain("items-center");
    expect(actions?.className).not.toContain("flex-col");
  });

  it("keeps the visible secondary border on the row action buttons", () => {
    renderList();

    // Regression for the previous commit: the secondary variant must declare
    // `border-input-border` and must NOT also carry `border-transparent`, which
    // would win by Tailwind's alphabetical emission order and erase the outline.
    for (const name of ["Degradar a pedro a usuario", "Desbloquear a maria"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("border-input-border");
      expect(button.className).not.toContain("border-transparent");
    }

    // The destructive trigger is `dangerGhost`: transparent border by design.
    const block = screen.getByRole("button", { name: "Bloquear a pedro" });
    expect(block.className).toContain("border-transparent");
    expect(block.className).toContain("text-danger");
  });
});

describe("AdminUserList — confirmación de cambios de rol", () => {
  it("requires confirmation before promoting and states the consequence", async () => {
    changeRoleActionMock.mockResolvedValue({ success: "Rol actualizado." });
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Promover a maria a administrador" }));

    const dialog = openDialog();
    expect(changeRoleActionMock).not.toHaveBeenCalled();

    const titleId = dialog.getAttribute("aria-labelledby") ?? "";
    const descriptionId = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(titleId)?.textContent).toBe("Promover a maria");
    expect(document.getElementById(descriptionId)?.textContent).toBe(
      "maria podrá ver y administrar álbumes y usuarios.",
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Promover" }));

    await waitFor(() => expect(changeRoleActionMock).toHaveBeenCalledTimes(1));
    const payload = changeRoleActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("userId")).toBe("00000000-0000-4000-8000-000000000002");
    expect(payload.get("role")).toBe("admin");
  });

  it("requires confirmation before demoting and states the consequence", async () => {
    changeRoleActionMock.mockResolvedValue({ success: "Rol actualizado." });
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Degradar a pedro a usuario" }));

    const dialog = openDialog();
    expect(changeRoleActionMock).not.toHaveBeenCalled();

    const titleId = dialog.getAttribute("aria-labelledby") ?? "";
    const descriptionId = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(titleId)?.textContent).toBe("Degradar a pedro");
    expect(document.getElementById(descriptionId)?.textContent).toBe(
      "pedro perderá el acceso de administración.",
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Degradar" }));

    await waitFor(() => expect(changeRoleActionMock).toHaveBeenCalledTimes(1));
    const payload = changeRoleActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("userId")).toBe("00000000-0000-4000-8000-000000000003");
    expect(payload.get("role")).toBe("user");
  });

  it("sends nothing when the role confirmation is cancelled", async () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Promover a maria a administrador" }));
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(changeRoleActionMock).not.toHaveBeenCalled();
  });

  it("confirms before blocking and explains the consequence", async () => {
    changeStatusActionMock.mockResolvedValue({ success: "Estado actualizado." });
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Bloquear a pedro" }));

    const dialog = openDialog();
    expect(changeStatusActionMock).not.toHaveBeenCalled();

    const titleId = dialog.getAttribute("aria-labelledby") ?? "";
    const descriptionId = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(titleId)?.textContent).toBe("Bloquear a pedro");
    expect(document.getElementById(descriptionId)?.textContent).toContain(
      "perderá el acceso de inmediato",
    );

    fireEvent.click(within(dialog).getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(changeStatusActionMock).toHaveBeenCalledTimes(1));
    const payload = changeStatusActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("userId")).toBe("00000000-0000-4000-8000-000000000003");
    expect(payload.get("status")).toBe("banned");
  });

  it("sends nothing when the block confirmation is cancelled", async () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Bloquear a pedro" }));
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(changeStatusActionMock).not.toHaveBeenCalled();
  });

  it("unblocks without a confirmation step", async () => {
    changeStatusActionMock.mockResolvedValue({ success: "Estado actualizado." });
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Desbloquear a maria" }));

    await waitFor(() => expect(changeStatusActionMock).toHaveBeenCalledTimes(1));
    const payload = changeStatusActionMock.mock.calls[0]?.[1] as FormData;
    expect(payload.get("status")).toBe("active");
  });
});

describe("AdminUserList — fila propia", () => {
  it("marks the current user with a neutral badge and hides the destructive actions", () => {
    renderList();

    const gino = screen.getByRole("row", { name: /gino/ });
    const badge = within(gino).getByText("Tú");
    expect(badge.className).toContain("bg-surface-muted");

    // No self-demotion and no self-blocking.
    expect(within(gino).queryByRole("button", { name: /Degradar/ })).toBeNull();
    expect(within(gino).queryByRole("button", { name: /Bloquear/ })).toBeNull();
    // The other rows keep theirs.
    expect(screen.getByRole("button", { name: "Degradar a pedro a usuario" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bloquear a pedro" })).toBeTruthy();
  });

  it("does not mark any row when the current user is not in the list", () => {
    render(<AdminUserList users={users} currentUserId="00000000-0000-4000-8000-0000000000ff" />);

    expect(screen.queryByText("Tú")).toBeNull();
    expect(screen.getByRole("button", { name: "Degradar a gino a usuario" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bloquear a gino" })).toBeTruthy();
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
    const html = renderToStaticMarkup(
      <AdminUserList users={users} currentUserId={SELF_ID} />,
    );

    for (const icon of ["chevronDown", "chevronUp", "lock", "unlock"]) {
      expect(html, `missing ${icon} glyph`).toContain(`data-icon="${icon}"`);
    }

    // One glyph per action button: gino has none (own row), maria and pedro
    // have two each.
    const buttons = html.match(/<button[^>]*>.*?<\/button>/gs) ?? [];
    const withIcon = buttons.filter((button) => button.includes("<svg"));
    expect(withIcon).toHaveLength(4);
  });

  it("renders the magnifier <svg> inside the search field", () => {
    const html = renderToStaticMarkup(
      <AdminUserList users={users} currentUserId={SELF_ID} />,
    );
    const searchBlock = html.match(/<div class="relative">.*?<\/div>/s)?.[0] ?? "";

    expect(searchBlock).toContain("<svg");
    expect(searchBlock).toContain('data-icon="explore"');
    // The glyph must sit above the control: daisyUI's `.input` is
    // `position: relative`, so without a positive z-index the input's opaque
    // background paints over the icon.
    expect(searchBlock).toContain("z-10");
  });
});
