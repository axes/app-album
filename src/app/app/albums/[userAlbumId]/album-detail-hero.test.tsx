// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const connections = vi.hoisted(() => ({ share: vi.fn(), remove: vi.fn() }));
vi.mock("./share-controls", () => ({
  ShareControls: (props: unknown) => { connections.share(props); return <div>sharing-control</div>; },
}));
vi.mock("../remove-button", () => ({
  RemoveAlbumButton: (props: unknown) => { connections.remove(props); return <button>Quitar de mi colección</button>; },
}));

import { AlbumDetailHero } from "./album-detail-hero";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const base = {
  id: "collection-1",
  album: { id: "album-1", title: "Mundial 2026", publisher: "Panini", year: 2026, coverUrl: null, status: "published" as const },
  progress: { total: 7, owned: 5, missing: 2, duplicates: 1, percentage: 71 },
  sharing: { enabled: false, token: null },
};

describe("AlbumDetailHero", () => {
  it("renders an editorial heading, metadata, one summary and connected actions", () => {
    render(<AlbumDetailHero {...base} />);

    expect(screen.getByRole("heading", { level: 1, name: "Mundial 2026" })).toBeTruthy();
    expect(screen.getByText("Panini · 2026")).toBeTruthy();
    expect(screen.getAllByText("5 / 7 láminas")).toHaveLength(1);
    expect(screen.getByRole("progressbar", { name: "71% completado" })).toBeTruthy();
    expect(connections.share).toHaveBeenCalledWith({ sharing: base.sharing, userAlbumId: "collection-1" });
    expect(connections.remove).toHaveBeenCalledWith({ userAlbumId: "collection-1" });
  });

  it("uses the editorial fallback when publisher and year are absent", () => {
    render(<AlbumDetailHero {...base} album={{ ...base.album, publisher: null, year: null }} />);
    expect(screen.getByText("Sin datos editoriales")).toBeTruthy();
  });
});
