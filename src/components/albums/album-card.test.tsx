// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { AlbumCard } from "./album-card";
import type { Progress } from "@/lib/collection/service";

vi.mock("@/app/app/albums/add-button", () => ({
  AddAlbumButton: ({ albumId }: { albumId: string }) => (
    <form data-testid="add-album-form" data-album-id={albumId}>
      <input name="albumId" type="hidden" value={albumId} />
      <button type="submit">Añadir a mi colección</button>
    </form>
  ),
}));

afterEach(cleanup);

function progress(partial: Partial<Progress> = {}): Progress {
  return {
    total: 240,
    owned: 24,
    missing: 216,
    duplicates: 0,
    percentage: 10,
    ...partial,
  };
}

describe("AlbumCard", () => {
  it("renders a token-driven placeholder when coverUrl is null and surfaces an accessible name", () => {
    const { container } = render(
      <AlbumCard
        title="Minecraft"
        subtitle="Panini · 2026"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-labelledby")).toMatch(/^album-card-title-/);
    expect(within(article).getByRole("heading", { level: 2, name: "Minecraft" })).toBeTruthy();
    expect(within(article).getByText("Panini · 2026")).toBeTruthy();
    expect(within(article).getByText("Bajo")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-testid="album-cover-placeholder"]')).toBeTruthy();
    expect(screen.getByText("Portada no disponible para Minecraft")).toBeTruthy();
  });

  it("renders a real <img> with alt text when a cover URL is provided", () => {
    const { container } = render(
      <AlbumCard
        title="Minecraft"
        progress={progress({ percentage: 50 })}
        coverUrl="https://images.example.test/minecraft.jpg"
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("Portada de Minecraft");
    expect(img?.getAttribute("src")).toBe("https://images.example.test/minecraft.jpg");
    expect(container.querySelector('[data-testid="album-cover-placeholder"]')).toBeNull();
  });

  it.each([
    { percentage: 0, total: 240, owned: 0, label: "Bajo" },
    { percentage: 10, total: 240, owned: 24, label: "Bajo" },
    { percentage: 24, total: 240, owned: 58, label: "Bajo" },
    { percentage: 25, total: 240, owned: 60, label: "En progreso" },
    { percentage: 50, total: 240, owned: 120, label: "En progreso" },
    { percentage: 99, total: 240, owned: 237, label: "En progreso" },
    { percentage: 100, total: 240, owned: 240, label: "Completo" },
    { percentage: 120, total: 240, owned: 240, label: "Completo" },
  ])("maps percentage=$percentage to the $label badge", ({ percentage, total, owned, label }) => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress({ total, owned, percentage })}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("treats owned>=total as complete even when percentage lags behind", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress({ total: 50, owned: 50, missing: 0, percentage: 80 })}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    expect(screen.getByText("Completo")).toBeTruthy();
  });

  it("renders an open Button asChild pointing to href when action.kind === 'open'", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1", label: "Abrir álbum" }}
      />,
    );

    const link = screen.getByRole("link", { name: "Abrir álbum" });
    expect(link.getAttribute("href")).toBe("/app/albums/u1");
  });

  it("falls back to 'Abrir álbum' when the open action omits an explicit label", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Abrir álbum" }).getAttribute("href")).toBe("/app/albums/u1");
  });

  it("renders the in-collection variant with badge and secondary link", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "in-collection", href: "/app/albums/u1" }}
      />,
    );

    expect(screen.getByText("En mi colección")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Abrir álbum" });
    expect(link.getAttribute("href")).toBe("/app/albums/u1");
  });

  it("renders the AddAlbumButton form with hidden albumId when action.kind === 'add'", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "add", albumId: "album-42" }}
      />,
    );

    const form = screen.getByTestId("add-album-form");
    expect(form.tagName).toBe("FORM");
    expect(form.getAttribute("data-album-id")).toBe("album-42");
    const hidden = within(form).getByDisplayValue("album-42");
    expect(hidden.tagName).toBe("INPUT");
    expect(hidden.getAttribute("name")).toBe("albumId");
    expect(hidden.getAttribute("type")).toBe("hidden");
  });

  it("falls back to 'Sin datos editoriales' when both subtitle and meta are missing", () => {
    render(
      <AlbumCard
        title="Minecraft"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    expect(screen.getByText("Sin datos editoriales")).toBeTruthy();
  });

  it("shows the meta line alongside the subtitle when both are provided", () => {
    render(
      <AlbumCard
        title="Minecraft"
        subtitle="Panini · 2026"
        meta="240 láminas"
        progress={progress()}
        coverUrl={null}
        action={{ kind: "open", href: "/app/albums/u1" }}
      />,
    );

    const card = screen.getByRole("article");
    expect(within(card).getByText("Panini · 2026 · 240 láminas")).toBeTruthy();
  });
});