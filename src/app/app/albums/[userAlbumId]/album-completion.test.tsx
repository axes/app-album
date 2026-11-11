// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AlbumCompletedMessage,
  AlbumCoverFrame,
  CONFETTI_MS,
  OPTIMISTIC_HOLD_MS,
  announceAlbumCompleted,
} from "./album-completion";

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const MESSAGE = "¡Álbum completado! ¡Felicitaciones!";

function renderHero(complete: boolean) {
  return render(
    <>
      <AlbumCoverFrame complete={complete}>
        <span>portada</span>
      </AlbumCoverFrame>
      <AlbumCompletedMessage complete={complete} />
    </>,
  );
}

function frame() {
  return document.querySelector('[data-component="album-cover-frame"]');
}

describe("album completion celebration", () => {
  it("stays quiet while the album is incomplete", () => {
    renderHero(false);

    expect(screen.queryByText(MESSAGE)).toBeNull();
    expect(frame()?.className).not.toContain("album-complete-glow");
    expect(screen.queryByTestId("album-confetti")).toBeNull();
  });

  it("shows the golden frame and the message for a completed album without replaying confetti", () => {
    renderHero(true);

    expect(screen.getByRole("status").textContent).toContain(MESSAGE);
    expect(frame()?.className).toContain("album-complete-glow");
    expect(frame()?.className).not.toContain("album-complete-glow-pulse");
    expect(screen.queryByTestId("album-confetti")).toBeNull();
  });

  it("celebrates on the click: glow, message and three seconds of confetti", () => {
    renderHero(false);

    act(() => announceAlbumCompleted());

    expect(screen.getByText(MESSAGE)).toBeTruthy();
    expect(frame()?.className).toContain("album-complete-glow-pulse");
    const confetti = screen.getByTestId("album-confetti");
    expect(confetti.getAttribute("aria-hidden")).toBe("true");
    expect(confetti.className).toContain("pointer-events-none");
    expect(confetti.children.length).toBeGreaterThan(20);

    act(() => vi.advanceTimersByTime(CONFETTI_MS));
    expect(screen.queryByTestId("album-confetti")).toBeNull();
    // The message outlives the confetti while the server confirms.
    expect(screen.getByText(MESSAGE)).toBeTruthy();
  });

  it("drops the optimistic state if the server never confirms the completion", () => {
    renderHero(false);

    act(() => announceAlbumCompleted());
    act(() => vi.advanceTimersByTime(OPTIMISTIC_HOLD_MS));

    expect(screen.queryByText(MESSAGE)).toBeNull();
    expect(frame()?.className).not.toContain("album-complete-glow");
  });

  it("skips the confetti when reduced motion is requested", () => {
    stubReducedMotion(true);
    renderHero(false);

    act(() => announceAlbumCompleted());

    expect(screen.getByText(MESSAGE)).toBeTruthy();
    expect(screen.queryByTestId("album-confetti")).toBeNull();
  });
});
