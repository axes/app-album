import { describe, expect, it } from "vitest";
import { albumCoverPresentation } from "./album-cover";

describe("album cover presentation", () => {
  it("builds accessible image semantics for a configured cover URL", () => {
    expect(
      albumCoverPresentation("https://images.example.test/minecraft.jpg", "Minecraft"),
    ).toEqual({
      kind: "image",
      src: "https://images.example.test/minecraft.jpg",
      alt: "Portada de Minecraft",
    });
  });

  it("selects the neutral placeholder when no URL is configured", () => {
    expect(albumCoverPresentation(null, "Minecraft")).toEqual({
      kind: "placeholder",
      label: "Sin portada",
    });
  });
});
