"use client";

import type { CSSProperties } from "react";
import type { Intent } from "./sticker-interaction";

/**
 * UI-05C.3 — decorative layer for the two celebratory intents.
 *
 * Purely presentational: every node is `aria-hidden` and `pointer-events-none`,
 * nothing here is focusable, and the whole layer is unmounted by the parent
 * once the animation window closes. It never reads or writes business state.
 *
 * The particles are plain `<span>` elements animated by CSS keyframes that
 * consume the `--burst-x` / `--burst-y` custom properties computed once at
 * render time. No canvas, no per-frame JavaScript, no layout properties.
 */

type Particle = {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: "circle" | "diamond";
};

/**
 * Six particles on a 60° grid, radius 22–30 px. Colours come exclusively from
 * the semantic tokens, never from a literal.
 */
const PARTICLES: Particle[] = [
  { x: 28, y: 0, size: 5, color: "var(--album-primary)", shape: "circle" },
  { x: 14, y: -24, size: 4, color: "var(--album-accent)", shape: "diamond" },
  { x: -14, y: -24, size: 6, color: "var(--album-primary)", shape: "circle" },
  { x: -28, y: 0, size: 4, color: "var(--album-success)", shape: "circle" },
  { x: -14, y: 24, size: 5, color: "var(--album-accent)", shape: "diamond" },
  { x: 14, y: 24, size: 4, color: "var(--album-primary)", shape: "circle" },
];

function Burst() {
  return (
    <span aria-hidden="true" className="sticker-burst pointer-events-none absolute inset-0 overflow-visible">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className={`sticker-burst-particle absolute left-1/2 top-1/2 ${particle.shape === "circle" ? "rounded-pill" : "rotate-45"}`}
          style={
            {
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              "--burst-x": `${particle.x}px`,
              "--burst-y": `${particle.y}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function Ghost({ leaving }: { leaving: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`sticker-ghost pointer-events-none absolute inset-0 rounded-sticker border border-border ${leaving ? "sticker-ghost-out" : "sticker-ghost-in"}`}
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--album-sticker-duplicate) 18%, var(--album-surface))",
      }}
    />
  );
}

export function StickerMotionLayer({ intent }: { intent: Intent }) {
  if (intent === "obtained") return <Burst />;
  if (intent === "duplicate") return <Ghost leaving={false} />;
  if (intent === "downgrade") return <Ghost leaving />;
  return null;
}
