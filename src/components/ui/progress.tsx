/**
 * Compact progress bar primitive (UI-04A).
 *
 * A determinate progress indicator with the full `progressbar` ARIA contract:
 * `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an accessible name via
 * `label`. It is a plain function component with no hooks, so it renders from
 * Server and Client Components alike.
 *
 * The value is clamped to `[0, max]` before it is turned into a percentage, so
 * a caller can never render an out-of-range bar. Colours come exclusively from
 * the canonical `--album-*` tokens exposed as Tailwind utilities.
 */
export type ProgressVariant =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger";

const variantClasses: Record<ProgressVariant, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export type ProgressProps = {
  /** Current value. Clamped to `[0, max]`. */
  value: number;
  /** Upper bound of the scale. Defaults to `100`. */
  max?: number;
  /** Required accessible name announced for the progressbar. */
  label: string;
  variant?: ProgressVariant;
  className?: string;
};

function clamp(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

export function Progress({
  value,
  max = 100,
  label,
  variant = "success",
  className,
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = clamp(value, safeMax);
  const percentage = Math.round((clamped / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-label={label}
      className={[
        "h-2 w-full overflow-hidden rounded-control bg-surface-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={["h-full", variantClasses[variant]].join(" ")}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
