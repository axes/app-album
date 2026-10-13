/**
 * UI-05C.3 — sticker interaction feedback.
 *
 * Pure, DOM-free module. It classifies a `previous → next` quantity
 * transition into an `Intent` and exposes the timing constants the card and
 * the decorative layer consume.
 *
 * It deliberately does NOT duplicate any business rule: it never decides
 * whether an operation is valid (the Server Action and the `disabled` state
 * of the controls own that). It only names a numeric transition.
 */

export type Intent =
  | "obtained"
  | "duplicate"
  | "increment"
  | "decrement"
  | "downgrade"
  | "lost";

/**
 * Shared easing curve. Mirrors `--motion-ease` from `src/styles/tokens.css`
 * (`cubic-bezier(0.2, 0, 0, 1)`). Motion needs the numeric form, so it is
 * declared once here instead of being read back from the computed style on
 * every click.
 */
export const MOTION_EASE = [0.2, 0, 0, 1] as const;

/**
 * Classifies a quantity transition.
 *
 * `0 → 1` is the only "first copy" moment, `1 → 2` is the only "became a
 * duplicate" moment, and the symmetric downgrades are kept distinct so the
 * card can avoid celebrating a loss.
 */
export function intentFor(from: number, to: number): Intent {
  if (to > from) {
    if (from === 0) return "obtained";
    if (from === 1) return "duplicate";
    return "increment";
  }
  if (to === 0) return "lost";
  if (to === 1) return "downgrade";
  return "decrement";
}

/**
 * Celebrations are the two intents that mount the decorative layer (burst or
 * ghost). Everything else is a discrete, non-celebratory acknowledgement.
 */
export function isCelebration(intent: Intent): boolean {
  return intent === "obtained" || intent === "duplicate";
}

/** How long the decorative layer stays mounted, in milliseconds. */
export const CLEAR_MS: Record<Intent, number> = {
  obtained: 500,
  duplicate: 450,
  increment: 250,
  decrement: 200,
  downgrade: 300,
  lost: 220,
};

/** Card / label animation durations, in seconds (Motion's unit). */
export const DURATION_S: Record<Intent, number> = {
  obtained: 0.4,
  duplicate: 0.32,
  increment: 0.2,
  decrement: 0.16,
  downgrade: 0.24,
  lost: 0.2,
};

/**
 * Safety net: if the Server Action never produces a new `quantity` prop
 * (rejected action, dropped connection), the optimistic overlay is dropped
 * after this delay so the card can never stay stuck on an invented value.
 */
export const OPTIMISTIC_TIMEOUT_MS = 5000;
