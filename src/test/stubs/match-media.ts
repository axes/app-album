/**
 * UI-05C.3 — explicit `window.matchMedia` stub.
 *
 * jsdom 29.1.1 does not implement `window.matchMedia` (verified: it is
 * `undefined`), and `vitest.config.ts` declares no `setupFiles`, so the stub
 * is imported explicitly by the tests that need it instead of being installed
 * globally. That keeps every existing test file on its current behaviour.
 */
export function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    emit(next: boolean) {
      for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
    },
    listenerCount() {
      return listeners.size;
    },
  };
}
