import type { Progress } from "@/lib/collection/service";
import { Progress as UiProgress } from "@/components/ui/progress";

/**
 * Compact album progress block (UI-05B).
 *
 * Mirrors the public API of `src/app/app/progress.tsx` but routes the
 * productive bar through the `<Progress>` primitive. The progress is the
 * domain's productive truth: the primitive takes the violet `primary`
 * track for the in-progress signal; green is reserved for the "Completo"
 * badge and other completion semantics downstream.
 *
 * Server Component (no hooks).
 */
export type AlbumProgressProps = {
  progress: Progress;
  detailed?: boolean;
};

export type ProgressState = "low" | "in_progress" | "complete";

/**
 * Pure helper exported for tests and shared between the productive card and
 * the migration shim. The decision rules are:
 *   - `owned >= total` (with `total > 0`) or `percentage >= 100` → complete.
 *   - `percentage < 25` → low.
 *   - everything else between 25 and 99 → in_progress.
 */
export function deriveProgressState(progress: Progress): ProgressState {
  if (progress.total > 0 && progress.owned >= progress.total) return "complete";
  if (progress.percentage >= 100) return "complete";
  if (progress.percentage < 25) return "low";
  return "in_progress";
}

export function AlbumProgress({ progress, detailed = false }: AlbumProgressProps) {
  const label = `${progress.percentage}% completado`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs tabular-nums text-content">
          {progress.owned} / {progress.total} láminas
        </span>
        <span className="text-xs font-medium tabular-nums text-muted">{progress.percentage}%</span>
      </div>
      <UiProgress value={progress.percentage} label={label} variant="primary" />
      {detailed ? (
        <p className="text-xs text-muted">
          {progress.missing} faltantes · {progress.duplicates} repetidas
        </p>
      ) : null}
    </div>
  );
}