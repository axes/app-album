// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CollectionSummary } from "./collection-summary";

afterEach(cleanup);

describe("CollectionSummary", () => {
  it("is the accessible source for all collection figures", () => {
    render(<CollectionSummary progress={{ total: 7, owned: 5, missing: 2, duplicates: 3, percentage: 71 }} />);

    expect(screen.getByText("5 / 7 láminas")).toBeTruthy();
    expect(screen.getByText("71%")).toBeTruthy();
    expect(screen.getByText("2 faltantes · 3 repetidas")).toBeTruthy();
    const progress = screen.getByRole("progressbar", { name: "71% completado" });
    expect(progress.getAttribute("aria-valuenow")).toBe("71");
  });
});
