// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import type { AlbumSummary } from "@/lib/catalog/service";
import { AdminAlbumList } from "./album-list";

const albums: AlbumSummary[] = [
  {
    id: "album-1",
    title: "Minecraft",
    description: null,
    slug: "minecraft",
    status: "published",
    publisher: "Panini",
    year: 2026,
    coverUrl: null,
    sectionCount: 12,
    stickerCount: 240,
    collectionCount: 3,
  },
  {
    id: "album-2",
    title: "Fauna Chilena",
    description: "Colección nacional",
    slug: "fauna-chilena",
    status: "draft",
    publisher: "Editorial Sur",
    year: 2025,
    coverUrl: null,
    sectionCount: 8,
    stickerCount: 120,
    collectionCount: 0,
  },
];

afterEach(cleanup);

describe("AdminAlbumList", () => {
  it("renders an accessible local search and semantic table with the same album data", () => {
    render(<AdminAlbumList albums={albums} />);

    expect(screen.getByRole("searchbox", { name: "Buscar álbum" })).toBeTruthy();
    const region = screen.getByRole("region", { name: "Álbumes" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");

    for (const heading of [
      "Título",
      "Estado",
      "Editorial / año",
      "Páginas",
      "Láminas",
      "En colección",
      "Acciones",
    ]) {
      expect(screen.getByRole("columnheader", { name: heading }).getAttribute("scope"))
        .toBe("col");
    }

    const minecraft = screen.getByRole("row", { name: /Minecraft/ });
    expect(minecraft.textContent).toContain("minecraft");
    expect(minecraft.textContent).toContain("Publicado");
    expect(minecraft.textContent).toContain("Panini · 2026");
    expect(minecraft.textContent).toContain("12");
    expect(minecraft.textContent).toContain("240");
    expect(minecraft.textContent).toContain("3");
    expect(
      within(minecraft).getByRole("link", { name: "Editar Minecraft" }).getAttribute("href"),
    ).toBe("/admin/albums/album-1");
  });

  it("filters rows locally by title, slug, publisher and year", async () => {
    const user = userEvent.setup();
    render(<AdminAlbumList albums={albums} />);
    const search = screen.getByRole("searchbox", { name: "Buscar álbum" });

    await user.type(search, "fauna");
    expect(screen.getByRole("row", { name: /Fauna Chilena/ })).toBeTruthy();
    expect(screen.queryByRole("row", { name: /Minecraft/ })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("1 resultado");

    await user.clear(search);
    await user.type(search, "2026");
    expect(screen.getByRole("row", { name: /Minecraft/ })).toBeTruthy();
    expect(screen.queryByRole("row", { name: /Fauna Chilena/ })).toBeNull();
  });

  it("announces no results and clears the local filter", async () => {
    const user = userEvent.setup();
    render(<AdminAlbumList albums={albums} />);

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar álbum" }),
      "sin coincidencias",
    );

    expect(screen.getByRole("status").textContent).toBe("0 resultados");
    expect(screen.getByRole("heading", { name: "No encontramos álbumes" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Álbumes" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(screen.getByRole("region", { name: "Álbumes" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Buscar álbum" })).toHaveProperty("value", "");
    expect(screen.getByRole("status").textContent).toBe("2 resultados");
  });

  it("renders the empty state without search or table when no albums exist", () => {
    render(<AdminAlbumList albums={[]} />);

    expect(screen.getByRole("heading", { name: "Todavía no hay álbumes" })).toBeTruthy();
    expect(screen.queryByRole("searchbox", { name: "Buscar álbum" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Álbumes" })).toBeNull();
  });

  it("uses the approved status badges and tabular numeric cells", () => {
    render(<AdminAlbumList albums={albums} />);

    expect(screen.getByText("Publicado").className).toContain("bg-success");
    expect(screen.getByText("Borrador").className).toContain("bg-surface-muted");
    const minecraft = screen.getByRole("row", { name: /Minecraft/ });
    expect(within(minecraft).getByText("240").className).toContain("tabular-nums");
  });
});

/**
 * Regression: the row action and the search field must actually paint their
 * glyphs. The previous revision rendered the markup without any `<svg>` — the
 * `asChild` branch of `Button` dropped the `icon` slot, and the `Field` icon
 * was painted underneath the control's opaque background. Both bugs were
 * invisible to the assertions above, which only looked at text, roles and
 * class names, so these tests inspect the serialised markup instead.
 */
describe("AdminAlbumList — iconos visibles (regresión)", () => {
  it("renders the pencil <svg> inside every Editar link", () => {
    const html = renderToStaticMarkup(<AdminAlbumList albums={albums} />);
    const anchors = html.match(/<a[^>]*href="\/admin\/albums\/[^"]*"[^>]*>.*?<\/a>/gs) ?? [];

    expect(anchors).toHaveLength(albums.length);
    for (const anchor of anchors) {
      expect(anchor).toContain("<svg");
      expect(anchor).toContain('data-icon="pencil"');
      // Icon first, then the visible label: the order the native button uses.
      expect(anchor.indexOf("<svg")).toBeLessThan(anchor.indexOf(">Editar</a>"));
    }
  });

  it("renders the magnifier <svg> inside the search field", () => {
    const html = renderToStaticMarkup(<AdminAlbumList albums={albums} />);
    const searchBlock = html.match(/<div class="relative">.*?<\/div>/s)?.[0] ?? "";

    expect(searchBlock).toContain("<svg");
    expect(searchBlock).toContain('data-icon="explore"');
    // The glyph must sit above the control: daisyUI's `.input` is
    // `position: relative`, so without a positive z-index the input's opaque
    // background paints over the icon.
    expect(searchBlock).toContain("z-10");
  });
});
