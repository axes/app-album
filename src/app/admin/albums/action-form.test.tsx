import { describe, expect, it } from "vitest";
import { Card } from "./action-form";

describe("album editor accordion cards", () => {
  it("renders a closed semantic details panel by default", () => {
    const element = Card({
      title: "Álbum",
      subtitle: "Minecraft · Borrador",
      children: "contenido",
    });

    expect(element.type).toBe("details");
    expect(element.props.open).toBeUndefined();
    expect(element.props.children[0].type).toBe("summary");
  });

  it("renders the stickers panel open when requested", () => {
    const element = Card({
      title: "Láminas",
      subtitle: "240 láminas · 3 sin página asignada",
      defaultOpen: true,
      children: "tabla",
    });

    expect(element.type).toBe("details");
    expect(element.props.open).toBe(true);
    expect(element.props.children[0].type).toBe("summary");
  });
});
