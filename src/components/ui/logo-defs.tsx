/**
 * DESIGN v2 §14 — logo definitions.
 *
 * The `<symbol>` and its three gradients are declared exactly once per page,
 * inside the application shell. `Logo` then reuses them with
 * `<use href="#mark"/>`, so the document never carries duplicated ids and the
 * gradients are resolved once.
 *
 * The colours are **fixed** and intentionally hard-coded: the logo must look
 * the same in light and dark mode (the inner square stays dark in both), so it
 * must never read a theme token. These are the only hex literals allowed
 * outside `scripts/ui-tokens.ts`; `scripts/centralization.test.ts` whitelists
 * this file and `logo.tsx` for exactly that reason.
 *
 * The wrapper is a zero-sized, absolutely positioned, `aria-hidden` SVG: it
 * paints nothing on its own and is invisible to assistive technology.
 */
export function LogoDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      data-component="logo-defs"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a1fb8" />
          <stop offset="1" stopColor="#2a1285" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a2b" />
          <stop offset="1" stopColor="#ff4d12" />
        </linearGradient>
        <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4a1fb8" />
          <stop offset=".55" stopColor="#6b2fc9" />
          <stop offset="1" stopColor="#f0583a" />
        </linearGradient>
        <symbol id="mark" viewBox="0 0 200 200">
          <rect x="10" y="10" width="180" height="180" rx="52" fill="url(#g1)" />
          <rect
            x="40"
            y="40"
            width="120"
            height="120"
            rx="24"
            fill="#190c58"
            stroke="#5b34e0"
            strokeWidth="10"
          />
          <path
            d="M64 45H136Q155 45 155 64V136Q155 155 136 155H81L45 119V64Q45 45 64 45Z"
            fill="url(#g2)"
          />
          <rect x="65" y="59" width="70" height="56" rx="14" fill="url(#g3)" />
          <path
            d="M45 119L81 155L81 119Z"
            fill="#ffc48f"
            stroke="#ffc48f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
