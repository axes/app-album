"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Album completion celebration.
 *
 * When the user marks the last missing sticker, the sticker mosaic announces
 * it with a window event. The mosaic and the album hero live in sibling
 * subtrees (the hero is rendered by a Server Component), so an event keeps
 * them decoupled without lifting state into the page.
 *
 * The click drives the celebration, never the data: reloading a completed
 * album shows the golden frame and the message (both derived from the server
 * progress) but does not replay the confetti.
 */
export const ALBUM_COMPLETED_EVENT = "micoleccion:album-completed";

/** Confetti falls and fades out within this window, then unmounts. */
export const CONFETTI_MS = 3000;

/**
 * The frame and the message appear on the click, before the Server Action
 * answers. They are held for this long so the authoritative progress has time
 * to take over; if the action fails, they simply go away.
 */
export const OPTIMISTIC_HOLD_MS = 6000;

export function announceAlbumCompleted() {
  window.dispatchEvent(new CustomEvent(ALBUM_COMPLETED_EVENT));
}

/** `burst` changes on every celebration; `holding` covers the optimistic gap. */
function useAlbumCelebration(): { burst: number; holding: boolean } {
  const [burst, setBurst] = useState(0);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const onCompleted = () => {
      setBurst((value) => value + 1);
      setHolding(true);
    };
    window.addEventListener(ALBUM_COMPLETED_EVENT, onCompleted);
    return () => window.removeEventListener(ALBUM_COMPLETED_EVENT, onCompleted);
  }, []);

  useEffect(() => {
    if (!holding) return;
    const timer = setTimeout(() => setHolding(false), OPTIMISTIC_HOLD_MS);
    return () => clearTimeout(timer);
  }, [holding, burst]);

  return { burst, holding };
}

/** Wraps the album cover and lights its frame with the golden glow. */
export function AlbumCoverFrame({ complete, children }: { complete: boolean; children: ReactNode }) {
  const { burst, holding } = useAlbumCelebration();
  const glowing = complete || holding;

  return (
    <div
      data-component="album-cover-frame"
      data-complete={glowing ? "true" : undefined}
      // The key restarts the pulse on each new celebration.
      key={burst}
      className={`rounded-card ${glowing ? "album-complete-glow" : ""}${burst > 0 && glowing ? " album-complete-glow-pulse" : ""}`}
    >
      {children}
    </div>
  );
}

const CONFETTI_COLORS = [
  "var(--album-warning)",
  "var(--album-primary)",
  "var(--album-accent)",
  "var(--album-success)",
] as const;

const CONFETTI_PIECES = 56;

type Piece = { left: number; size: number; drift: number; spin: number; delay: number; duration: number; color: string; round: boolean };

/**
 * Every piece finishes inside `CONFETTI_MS`: the longest delay plus the longest
 * fall is 0.5 s + 2.5 s.
 */
function makePieces(): Piece[] {
  return Array.from({ length: CONFETTI_PIECES }, (_, index) => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 160,
    spin: (Math.random() - 0.5) * 1080,
    delay: Math.random() * 0.5,
    duration: 1.7 + Math.random() * 0.8,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: index % 3 === 0,
  }));
}

/**
 * Decorative only: `aria-hidden`, `pointer-events-none`, CSS keyframes that
 * animate just `transform` and `opacity`. Colours come from semantic tokens.
 */
function Confetti() {
  const pieces = useMemo(makePieces, []);
  return (
    <div aria-hidden="true" data-testid="album-confetti" className="album-confetti pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`album-confetti-piece absolute ${piece.round ? "rounded-pill" : ""}`}
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.round ? piece.size : piece.size * 0.5}px`,
              backgroundColor: piece.color,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-spin": `${piece.spin}deg`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Message shown next to the album, plus the confetti of the click itself. */
export function AlbumCompletedMessage({ complete }: { complete: boolean }) {
  const { burst, holding } = useAlbumCelebration();
  const reduced = useReducedMotion();
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    if (burst === 0) return;
    setConfetti(burst);
    const timer = setTimeout(() => setConfetti(0), CONFETTI_MS);
    return () => clearTimeout(timer);
  }, [burst]);

  return (
    <>
      {complete || holding ? (
        <p
          role="status"
          data-component="album-completed-message"
          className="album-completed-message mt-2 inline-flex items-center gap-2 rounded-control px-3 py-1.5 text-sm font-semibold text-content"
        >
          <Icon className="shrink-0" name="completed" size="sm" />
          <span>¡Álbum completado! ¡Felicitaciones!</span>
        </p>
      ) : null}
      {confetti > 0 && !reduced ? <Confetti key={confetti} /> : null}
    </>
  );
}
